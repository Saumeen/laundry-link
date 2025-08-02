import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedCustomer } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated customer
    const customer = await requireAuthenticatedCustomer();
    
    // Get payment ID from query params
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get payment record with wallet transaction
    const paymentRecord = await prisma.paymentRecord.findFirst({
      where: {
        id: parseInt(paymentId),
        customerId: customer.id // Ensure customer can only access their own payments
      },
      include: {
        walletTransaction: {
          select: {
            id: true,
            status: true,
            amount: true,
            description: true,
            metadata: true
          }
        }
      }
    });

    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Determine if this is a wallet top-up based on metadata
    const isWalletTopUp = !paymentRecord.orderId && 
      (paymentRecord.description?.includes('Wallet top-up') || 
       paymentRecord.description?.includes('wallet'));

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentRecord.id,
        paymentStatus: paymentRecord.paymentStatus,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        description: paymentRecord.description,
        createdAt: paymentRecord.createdAt,
        isWalletTopUp,
        tapTransactionId: paymentRecord.tapTransactionId,
        walletTransaction: paymentRecord.walletTransaction
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    
    // Handle authentication errors specifically
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 