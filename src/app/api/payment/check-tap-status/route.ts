import { NextRequest, NextResponse } from 'next/server';
import { getTapCharge } from '@/lib/utils/tapPaymentUtils';
import { requireAuthenticatedCustomer } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated customer
    const customer = await requireAuthenticatedCustomer();
    
    // Parse request body
    const body = await request.json();
    const { tapTransactionId, paymentId } = body as { tapTransactionId?: string; paymentId?: string };

    if (!tapTransactionId && !paymentId) {
      return NextResponse.json(
        { error: 'Either tapTransactionId or paymentId is required' },
        { status: 400 }
      );
    }

    let paymentRecord;
    
    if (paymentId) {
      // Get payment record by ID
      paymentRecord = await prisma.paymentRecord.findFirst({
        where: {
          id: parseInt(paymentId),
          customerId: customer.id
        },
        include: {
          walletTransaction: true
        }
      });
    } else if (tapTransactionId) {
      // Get payment record by TAP transaction ID
      paymentRecord = await prisma.paymentRecord.findFirst({
        where: {
          tapTransactionId: tapTransactionId,
          customerId: customer.id
        },
        include: {
          walletTransaction: true
        }
      });
    }

    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // If we have a TAP transaction ID, check with TAP API
    let tapStatus = null;
    if (paymentRecord.tapTransactionId) {
      try {
        tapStatus = await getTapCharge(paymentRecord.tapTransactionId);
      } catch (error) {
        console.error('Error fetching TAP charge:', error);
        tapStatus = { error: 'Failed to fetch TAP status' };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentRecord: {
          id: paymentRecord.id,
          paymentStatus: paymentRecord.paymentStatus,
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          description: paymentRecord.description,
          tapTransactionId: paymentRecord.tapTransactionId,
          tapChargeId: paymentRecord.tapChargeId,
          createdAt: paymentRecord.createdAt,
          processedAt: paymentRecord.processedAt
        },
        walletTransaction: paymentRecord.walletTransaction ? {
          id: paymentRecord.walletTransaction.id,
          status: paymentRecord.walletTransaction.status,
          amount: paymentRecord.walletTransaction.amount,
          description: paymentRecord.walletTransaction.description,
          metadata: paymentRecord.walletTransaction.metadata
        } : null,
        tapStatus
      }
    });

  } catch (error) {
    console.error('Error checking TAP payment status:', error);
    
    // Handle authentication errors specifically
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to check TAP payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 