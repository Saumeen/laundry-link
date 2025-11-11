import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import logger from '@/lib/logger';
import { createTapRefund } from '@/lib/utils/tapPaymentUtils';

interface ProcessRefundRequest {
  paymentId: number;
  orderId: number;
  customerId: number;
  refundAmount: number;
  refundReason: string;
}

interface TapRefundResult {
  originalPaymentRecordId: number;
  refundPaymentRecordId: null;
  tapRefundId: string;
}

interface WalletRefundResult {
  originalPaymentRecordId: number;
  refundPaymentRecordId: number;
  newWalletBalance: number;
}

type RefundResult = TapRefundResult | WalletRefundResult;

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await requireAuthenticatedAdmin();
    
    // Check if user is super admin
    if (admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Administrators can process refunds' },
        { status: 403 }
      );
    }

    const body = await request.json() as ProcessRefundRequest;
    const { paymentId, orderId, customerId, refundAmount, refundReason } = body;

    // Validate required fields
    if (!paymentId || !orderId || !customerId || !refundAmount || !refundReason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate refund amount
    if (refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Refund amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get the payment record
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
        customer: {
          include: {
            wallet: true
          }
        }
      }
    });

    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Verify the payment belongs to the specified order and customer
    if (paymentRecord.orderId !== orderId || paymentRecord.customerId !== customerId) {
      return NextResponse.json(
        { error: 'Payment record does not match the specified order and customer' },
        { status: 400 }
      );
    }

    // Check if payment is eligible for refund
    if (paymentRecord.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { error: 'Payment is not eligible for refund. Only PAID payments can be refunded.' },
        { status: 400 }
      );
    }

    // Check if refund amount is valid
    const alreadyRefunded = paymentRecord.refundAmount || 0;
    const maxRefundable = paymentRecord.amount - alreadyRefunded;
    
    if (refundAmount > maxRefundable) {
      return NextResponse.json(
        { error: `Refund amount exceeds maximum refundable amount of ${maxRefundable} BD` },
        { status: 400 }
      );
    }

    // Check if payment is refundable based on metadata
    let metadata = {};
    try {
      if (paymentRecord.metadata) {
        metadata = JSON.parse(paymentRecord.metadata);
      }
    } catch (error) {
      logger.warn('Failed to parse payment metadata:', error);
    }

    if (metadata && typeof metadata === 'object' && 'refundable' in metadata && !metadata.refundable) {
      return NextResponse.json(
        { error: 'This payment is not eligible for refund' },
        { status: 400 }
      );
    }

    // Process the refund based on payment method
    // Use transaction to prevent concurrent refunds
    let refundResult: RefundResult;
    
    if (paymentRecord.paymentMethod === 'TAP_PAY' && paymentRecord.tapChargeId) {
      // Process Tap refund with transaction-level locking
      try {
        // Re-fetch payment record inside transaction to get latest refundAmount
        // This prevents concurrent refunds from over-refunding
        refundResult = await prisma.$transaction(async (tx) => {
          // Re-fetch payment record with latest data (transaction isolation prevents concurrent updates)
          const currentPaymentRecord = await tx.paymentRecord.findUnique({
            where: { id: paymentId },
            include: {
              order: true
            }
          });

          if (!currentPaymentRecord) {
            throw new Error('Payment record not found');
          }

          // Re-verify refund amount inside transaction
          const currentAlreadyRefunded = currentPaymentRecord.refundAmount || 0;
          const currentMaxRefundable = currentPaymentRecord.amount - currentAlreadyRefunded;
          
          if (refundAmount > currentMaxRefundable) {
            // Alert: Refund validation failed
            logger.error('PAYMENT_ANOMALY: Refund amount exceeds maximum refundable', {
              type: 'REFUND_VALIDATION_FAILED',
              severity: 'HIGH',
              paymentRecordId: paymentId,
              orderId: currentPaymentRecord.orderId,
              requestedRefund: refundAmount,
              maxRefundable: currentMaxRefundable,
              alreadyRefunded: currentAlreadyRefunded,
              originalAmount: currentPaymentRecord.amount,
              timestamp: new Date().toISOString()
            });
            throw new Error(`Refund amount exceeds maximum refundable amount of ${currentMaxRefundable} BD`);
          }

          // Process Tap refund
          const tapRefundResponse = await createTapRefund(
            currentPaymentRecord.tapChargeId!,
            refundAmount,
            refundReason
          );

          return await processTapRefund(
            currentPaymentRecord,
            refundAmount,
            refundReason,
            admin.id,
            tapRefundResponse
          );
        }, {
          isolationLevel: 'Serializable' // Highest isolation level to prevent concurrent refunds
        });
      } catch (tapError) {
        logger.error('Error processing Tap refund:', tapError);
        return NextResponse.json(
          { error: `Tap refund failed: ${tapError instanceof Error ? tapError.message : 'Unknown error'}` },
          { status: 400 }
        );
      }
    } else {
      // Process wallet refund with transaction-level locking
      refundResult = await prisma.$transaction(async (tx) => {
        // Re-fetch payment record inside transaction to get latest refundAmount
        const currentPaymentRecord = await tx.paymentRecord.findUnique({
          where: { id: paymentId },
          include: {
            order: true,
            customer: {
              include: {
                wallet: true
              }
            }
          }
        });

        if (!currentPaymentRecord) {
          throw new Error('Payment record not found');
        }

        // Re-verify refund amount inside transaction
        const currentAlreadyRefunded = currentPaymentRecord.refundAmount || 0;
        const currentMaxRefundable = currentPaymentRecord.amount - currentAlreadyRefunded;
        
        if (refundAmount > currentMaxRefundable) {
          throw new Error(`Refund amount exceeds maximum refundable amount of ${currentMaxRefundable} BD`);
        }

        return await processWalletRefund(
          currentPaymentRecord,
          refundAmount,
          refundReason,
          admin.id
        );
      }, {
        isolationLevel: 'Serializable' // Highest isolation level to prevent concurrent refunds
      });
    }

    // Build response based on refund type
    const responseData: any = {
      refundAmount: refundAmount,
      refundType: paymentRecord.paymentMethod === 'TAP_PAY' ? 'TAP_REFUND' : 'WALLET_REFUND',
      refundPaymentRecordId: refundResult.refundPaymentRecordId,
      originalPaymentRecordId: refundResult.originalPaymentRecordId,
    };

    // Add type-specific fields
    if (paymentRecord.paymentMethod === 'TAP_PAY') {
      responseData.tapRefundId = (refundResult as TapRefundResult).tapRefundId;
    } else {
      responseData.newWalletBalance = (refundResult as WalletRefundResult).newWalletBalance;
    }

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      data: responseData
    });

  } catch (error) {
    logger.error('Error processing refund:', error);
    
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to process refund',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to process Tap refunds
async function processTapRefund(
  paymentRecord: any,
  refundAmount: number,
  refundReason: string,
  adminId: number,
  tapRefundResponse: any
): Promise<TapRefundResult> {
  return await prisma.$transaction(async (tx) => {
    // Update the original payment record with refund information
    const updatedOriginalPaymentRecord = await tx.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        refundAmount: (paymentRecord.refundAmount || 0) + refundAmount,
        refundReason: refundReason,
        metadata: JSON.stringify({
          ...(paymentRecord.metadata ? JSON.parse(paymentRecord.metadata) : {}),
          refund: {
            amount: refundAmount,
            reason: refundReason,
            tapRefundId: tapRefundResponse.id,
            processedAt: new Date().toISOString(),
            processedBy: adminId,
            isFullRefund: refundAmount === paymentRecord.amount,
          },
          lastUpdated: new Date().toISOString(),
        }),
        updatedAt: new Date()
      }
    });

    // Create order history entry
    await tx.orderHistory.create({
      data: {
        orderId: paymentRecord.orderId,
        action: refundAmount === paymentRecord.amount ? 'PAYMENT_REFUNDED' : 'PARTIAL_REFUND',
        description: `Refund of ${refundAmount} BD processed via Tap. Reason: ${refundReason}`,
        metadata: JSON.stringify({
          originalPaymentRecordId: paymentRecord.id,
          refundAmount: refundAmount,
          refundReason: refundReason,
          tapRefundId: tapRefundResponse.id,
          processedBy: adminId,
          isFullRefund: refundAmount === paymentRecord.amount,
        }),
        staffId: adminId
      }
    });

    // Update order payment status if full refund
    if (refundAmount === paymentRecord.amount && paymentRecord.orderId) {
      await tx.order.update({
        where: { id: paymentRecord.orderId },
        data: {
          paymentStatus: 'REFUNDED',
          notes: paymentRecord.order?.notes 
            ? `${paymentRecord.order.notes}\nFull refund processed: ${refundAmount} BHD - ${refundReason}`
            : `Full refund processed: ${refundAmount} BHD - ${refundReason}`,
        },
      });
    }

    return {
      originalPaymentRecordId: updatedOriginalPaymentRecord.id,
      refundPaymentRecordId: null, // No separate refund record for Tap refunds
      tapRefundId: tapRefundResponse.id
    };
  });
}

// Helper function to process wallet refunds (existing logic)
async function processWalletRefund(
  paymentRecord: any,
  refundAmount: number,
  refundReason: string,
  adminId: number
): Promise<WalletRefundResult> {
  // Ensure customer has a wallet
  if (!paymentRecord.customer.wallet) {
    throw new Error('Customer wallet not found');
  }

  return await prisma.$transaction(async (tx) => {
    // Create wallet transaction for refund first
    const walletTransaction = await tx.walletTransaction.create({
      data: {
        walletId: paymentRecord.customer.wallet!.id,
        transactionType: 'REFUND',
        amount: refundAmount,
        balanceBefore: paymentRecord.customer.wallet!.balance,
        balanceAfter: paymentRecord.customer.wallet!.balance + refundAmount,
        description: `Refund for Order #${paymentRecord.order?.orderNumber || paymentRecord.orderId}: ${refundReason}`,
        reference: `REFUND_${paymentRecord.id}`,
        metadata: JSON.stringify({
          originalPaymentRecordId: paymentRecord.id,
          orderId: paymentRecord.orderId,
          refundReason: refundReason,
          processedBy: adminId
        }),
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    // Create a NEW payment record for the refund
    const refundPaymentRecord = await tx.paymentRecord.create({
      data: {
        customerId: paymentRecord.customerId,
        orderId: paymentRecord.orderId,
        amount: refundAmount,
        paymentMethod: 'WALLET', // Refund goes back to wallet
        paymentStatus: 'PAID', // Refund is immediately processed
        description: `Refund for Order #${paymentRecord.order?.orderNumber || paymentRecord.orderId}: ${refundReason}`,
        walletTransactionId: walletTransaction.id,
        refundReason: refundReason,
        processedAt: new Date(),
        metadata: JSON.stringify({
          originalPaymentRecordId: paymentRecord.id,
          originalPaymentAmount: paymentRecord.amount,
          originalPaymentMethod: paymentRecord.paymentMethod,
          refundReason: refundReason,
          processedBy: adminId,
          isRefund: true
        })
      }
    });

    // Update the ORIGINAL payment record to track refunds
    const updatedOriginalPaymentRecord = await tx.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        refundAmount: (paymentRecord.refundAmount || 0) + refundAmount,
        refundReason: refundReason,
        updatedAt: new Date()
      }
    });

    // Update wallet balance
    await tx.wallet.update({
      where: { id: paymentRecord.customer.wallet!.id },
      data: {
        balance: paymentRecord.customer.wallet!.balance + refundAmount,
        lastTransactionAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create order history entry
    await tx.orderHistory.create({
      data: {
        orderId: paymentRecord.orderId,
        action: 'REFUND_PROCESSED',
        description: `Refund of ${refundAmount} BD processed. Reason: ${refundReason}`,
        metadata: JSON.stringify({
          originalPaymentRecordId: paymentRecord.id,
          refundPaymentRecordId: refundPaymentRecord.id,
          refundAmount: refundAmount,
          refundReason: refundReason,
          processedBy: adminId,
          walletTransactionId: walletTransaction.id
        }),
        staffId: adminId
      }
    });

    return {
      originalPaymentRecordId: updatedOriginalPaymentRecord.id,
      refundPaymentRecordId: refundPaymentRecord.id,
      newWalletBalance: paymentRecord.customer.wallet!.balance + refundAmount
    };
  });
} 