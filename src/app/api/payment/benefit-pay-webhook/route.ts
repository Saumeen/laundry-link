import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import emailService from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      id: string;
      status: string;
      amount: number;
      currency: string;
      reference?: Record<string, unknown>;
      customer?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    };
    
    logger.info('Benefit Pay webhook received:', body);

    // Extract relevant data from the webhook
    const {
      id: chargeId,
      status,
      amount,
      currency,
      reference,
      customer,
      metadata
    } = body;

    // Validate required fields
    if (!chargeId || !status || !amount || !currency) {
      logger.error('Missing required fields in Benefit Pay webhook');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Handle different payment statuses
    switch (status) {
      case 'CAPTURED':
      case 'SUCCESS':
        // Payment was successful
        await handleSuccessfulPayment({
          chargeId,
          amount,
          currency,
          reference,
          customer,
          metadata
        });
        break;

      case 'FAILED':
      case 'DECLINED':
        // Payment failed
        await handleFailedPayment({
          chargeId,
          amount,
          currency,
          reference,
          customer,
          metadata
        });
        break;

      case 'PENDING':
        // Payment is pending
        await handlePendingPayment({
          chargeId,
          amount,
          currency,
          reference,
          customer,
          metadata
        });
        break;

      default:
        logger.info(`Unhandled Benefit Pay status: ${status}`);
        break;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Error processing Benefit Pay webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(data: {
  chargeId: string;
  amount: number;
  currency: string;
  reference?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { chargeId, amount, currency, reference, metadata } = data;

    // Find the wallet transaction by reference
    const transaction = await prisma.walletTransaction.findFirst({
      where: {
        reference: chargeId,
        transactionType: 'DEPOSIT'
      },
      include: {
        wallet: {
          include: {
            customer: true
          }
        }
      }
    });

    if (transaction) {
      // Update the transaction status and wallet balance
      await prisma.$transaction(async (tx) => {
        // Update the transaction status
        await tx.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            balanceAfter: transaction.wallet.balance + amount,
            metadata: JSON.stringify({
              ...JSON.parse(transaction.metadata || '{}'),
              status: 'SUCCESS',
              chargeId,
              updatedAt: new Date().toISOString()
            })
          }
        });

        // Update the wallet balance
        await tx.wallet.update({
          where: { id: transaction.wallet.id },
          data: {
            balance: transaction.wallet.balance + amount,
            lastTransactionAt: new Date()
          }
        });
      });

      // Send wallet top-up completion email notification
      if (transaction.wallet.customer) {
        const customer = transaction.wallet.customer;
        
        // Fetch the updated wallet balance to ensure we have the correct balance
        const updatedWallet = await prisma.wallet.findUnique({
          where: { id: transaction.wallet.id }
        });
        
        const finalBalance = updatedWallet ? updatedWallet.balance : transaction.wallet.balance + amount;
        
        await emailService.sendWalletTopUpCompletionNotification(
          customer.email,
          `${customer.firstName} ${customer.lastName}`,
          amount,
          finalBalance,
          'BENEFIT_PAY',
          chargeId
        );
      }

      logger.info(`Benefit Pay payment successful for transaction ${transaction.id}`);
    } else {
      logger.warn(`No wallet transaction found for Benefit Pay charge ID: ${chargeId}`);
    }

  } catch (error) {
    logger.error('Error handling successful Benefit Pay payment:', error);
  }
}

async function handleFailedPayment(data: {
  chargeId: string;
  amount: number;
  currency: string;
  reference?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { chargeId, amount, currency, reference, metadata } = data;

    // Find the wallet transaction by reference
    const transaction = await prisma.walletTransaction.findFirst({
      where: {
        reference: chargeId,
        transactionType: 'DEPOSIT'
      }
    });

    if (transaction) {
      // Update the transaction status
      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          metadata: JSON.stringify({
            ...JSON.parse(transaction.metadata || '{}'),
            status: 'FAILED',
            chargeId,
            updatedAt: new Date().toISOString()
          })
        }
      });

      logger.info(`Benefit Pay payment failed for transaction ${transaction.id}`);
    } else {
      logger.warn(`No wallet transaction found for Benefit Pay charge ID: ${chargeId}`);
    }

  } catch (error) {
    logger.error('Error handling failed Benefit Pay payment:', error);
  }
}

async function handlePendingPayment(data: {
  chargeId: string;
  amount: number;
  currency: string;
  reference?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { chargeId, amount, currency, reference, metadata } = data;

    // Find the wallet transaction by reference
    const transaction = await prisma.walletTransaction.findFirst({
      where: {
        reference: chargeId,
        transactionType: 'DEPOSIT'
      }
    });

    if (transaction) {
      // Update the transaction status
      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          metadata: JSON.stringify({
            ...JSON.parse(transaction.metadata || '{}'),
            status: 'PENDING',
            chargeId,
            updatedAt: new Date().toISOString()
          })
        }
      });

      logger.info(`Benefit Pay payment pending for transaction ${transaction.id}`);
    } else {
      logger.warn(`No wallet transaction found for Benefit Pay charge ID: ${chargeId}`);
    }

  } catch (error) {
    logger.error('Error handling pending Benefit Pay payment:', error);
  }
} 