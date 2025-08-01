import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    
    console.log('Benefit Pay webhook received:', body);

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
      console.error('Missing required fields in Benefit Pay webhook');
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
        console.log(`Unhandled Benefit Pay status: ${status}`);
        break;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing Benefit Pay webhook:', error);
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
      }
    });

    if (transaction) {
      // Update the transaction status
      await prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          metadata: JSON.stringify({
            ...JSON.parse(transaction.metadata || '{}'),
            status: 'SUCCESS',
            chargeId,
            updatedAt: new Date().toISOString()
          })
        }
      });

      console.log(`Benefit Pay payment successful for transaction ${transaction.id}`);
    } else {
      console.warn(`No wallet transaction found for Benefit Pay charge ID: ${chargeId}`);
    }

  } catch (error) {
    console.error('Error handling successful Benefit Pay payment:', error);
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

      console.log(`Benefit Pay payment failed for transaction ${transaction.id}`);
    } else {
      console.warn(`No wallet transaction found for Benefit Pay charge ID: ${chargeId}`);
    }

  } catch (error) {
    console.error('Error handling failed Benefit Pay payment:', error);
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

      console.log(`Benefit Pay payment pending for transaction ${transaction.id}`);
    } else {
      console.warn(`No wallet transaction found for Benefit Pay charge ID: ${chargeId}`);
    }

  } catch (error) {
    console.error('Error handling pending Benefit Pay payment:', error);
  }
} 