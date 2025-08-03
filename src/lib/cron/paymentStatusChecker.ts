import { PrismaClient, PaymentStatus, TransactionStatus } from '@prisma/client';
import { getTapCharge } from '../utils/tapPaymentUtils';
import logger from '@/lib/logger';

const prisma = new PrismaClient();

interface PaymentStatusUpdateResult {
  success: boolean;
  message: string;
  updatedCount: number;
  errors: string[];
}

export class PaymentStatusChecker {
  /**
   * Check and update pending payment statuses
   */
  static async checkPendingPayments(): Promise<PaymentStatusUpdateResult> {
    const result: PaymentStatusUpdateResult = {
      success: true,
      message: 'Payment status check completed',
      updatedCount: 0,
      errors: []
    };

    try {
      logger.info('Starting payment status check...');

      // Get all pending payment records with TAP charge IDs
      const pendingPayments = await prisma.paymentRecord.findMany({
        where: {
          paymentStatus: PaymentStatus.PENDING,
          tapChargeId: {
            not: null
          },
          createdAt: {
            // Only check payments from the last 24 hours to avoid checking old payments
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        include: {
          customer: true,
          walletTransaction: {
            include: {
              wallet: true
            }
          },
          order: true
        }
      });

      logger.info(`Found ${pendingPayments.length} pending payments to check`);

      for (const payment of pendingPayments) {
        try {
          await this.processPaymentStatus(payment);
          result.updatedCount++;
        } catch (error) {
          const errorMessage = `Error processing payment ${payment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          logger.error(errorMessage);
          result.errors.push(errorMessage);
        }
      }

      logger.info(`Payment status check completed. Updated: ${result.updatedCount}, Errors: ${result.errors.length}`);
    } catch (error) {
      const errorMessage = `Payment status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage);
      result.success = false;
      result.message = errorMessage;
      result.errors.push(errorMessage);
    }

    return result;
  }

  /**
   * Process individual payment status
   */
  private static async processPaymentStatus(payment: any): Promise<void> {
    if (!payment.tapChargeId) {
      throw new Error('No TAP charge ID found');
    }

    logger.info(`Checking payment ${payment.id} with TAP charge ID: ${payment.tapChargeId}`);

    // Get charge status from TAP API
    const tapCharge = await getTapCharge(payment.tapChargeId);
    
    if (!tapCharge) {
      throw new Error('Failed to retrieve TAP charge');
    }

    const chargeStatus = (tapCharge as any).status;
    logger.info(`TAP charge status for payment ${payment.id}: ${chargeStatus}`);

    // Update payment status based on TAP charge status
    await this.updatePaymentStatus(payment, chargeStatus, tapCharge);
  }

  /**
   * Update payment and wallet status based on TAP charge status
   */
  private static async updatePaymentStatus(payment: any, tapStatus: string, tapCharge: any): Promise<void> {
    let newPaymentStatus: PaymentStatus;
    let newTransactionStatus: TransactionStatus;
    let failureReason: string | null = null;
    let processedAt: Date | null = null;

    switch (tapStatus.toLowerCase()) {
      case 'captured':
      case 'authorized':
        newPaymentStatus = PaymentStatus.PAID;
        newTransactionStatus = TransactionStatus.COMPLETED;
        processedAt = new Date();
        break;

      case 'declined':
      case 'failed':
      case 'cancelled':
        newPaymentStatus = PaymentStatus.FAILED;
        newTransactionStatus = TransactionStatus.FAILED;
        failureReason = tapCharge.response?.message || 'Payment failed';
        break;

      case 'pending':
        // Keep as pending
        newPaymentStatus = PaymentStatus.PENDING;
        newTransactionStatus = TransactionStatus.PENDING;
        break;

      default:
        logger.info(`Unknown TAP status: ${tapStatus} for payment ${payment.id}`);
        return; // Don't update for unknown statuses
    }

    // Update payment record
    await prisma.paymentRecord.update({
      where: { id: payment.id },
      data: {
        paymentStatus: newPaymentStatus,
        failureReason,
        processedAt,
        tapResponse: JSON.stringify(tapCharge),
        updatedAt: new Date()
      }
    });

    // Update wallet transaction if exists
    if (payment.walletTransaction) {
      await prisma.walletTransaction.update({
        where: { id: payment.walletTransaction.id },
        data: {
          status: newTransactionStatus,
          processedAt,
          metadata: JSON.stringify({
            ...JSON.parse(payment.walletTransaction.metadata || '{}'),
            tapTransactionId: tapCharge.id,
            tapChargeId: payment.tapChargeId,
            tapStatus,
            lastChecked: new Date().toISOString()
          }),
          updatedAt: new Date()
        }
      });

      // Update wallet balance if payment is successful
      if (newPaymentStatus === PaymentStatus.PAID && payment.walletTransaction) {
        await this.updateWalletBalance(payment.walletTransaction.wallet, payment.amount);
      }
    }

    // Update order payment status if this is an order payment
    if (payment.orderId) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: newPaymentStatus,
          updatedAt: new Date()
        }
      });
    }

    logger.info(`Updated payment ${payment.id} to status: ${newPaymentStatus}`);
  }

  /**
   * Update wallet balance after successful payment
   */
  private static async updateWalletBalance(wallet: any, amount: number): Promise<void> {
    const currentBalance = wallet.balance;
    const newBalance = currentBalance + amount;

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        lastTransactionAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info(`Updated wallet ${wallet.id} balance: ${currentBalance} -> ${newBalance}`);
  }

  /**
   * Get statistics about pending payments
   */
  static async getPendingPaymentStats(): Promise<{
    totalPending: number;
    pendingWithTapId: number;
    pendingWithoutTapId: number;
    lastChecked: Date;
  }> {
    const totalPending = await prisma.paymentRecord.count({
      where: { paymentStatus: PaymentStatus.PENDING }
    });

    const pendingWithTapId = await prisma.paymentRecord.count({
      where: {
        paymentStatus: PaymentStatus.PENDING,
        tapChargeId: { not: null }
      }
    });

    const pendingWithoutTapId = totalPending - pendingWithTapId;

    return {
      totalPending,
      pendingWithTapId,
      pendingWithoutTapId,
      lastChecked: new Date()
    };
  }

  /**
   * Clean up old failed payments (older than 7 days)
   */
  static async cleanupOldFailedPayments(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await prisma.paymentRecord.updateMany({
      where: {
        paymentStatus: PaymentStatus.FAILED,
        createdAt: {
          lt: sevenDaysAgo
        }
      },
      data: {
        paymentStatus: PaymentStatus.FAILED // Keep as failed but mark as old
      }
    });

    logger.info(`Cleaned up ${result.count} old failed payments`);
    return result.count;
  }
} 