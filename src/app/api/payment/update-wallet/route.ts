import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedCustomer } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated customer
    const customer = await requireAuthenticatedCustomer();
    
    const body = await request.json();
    const { paymentId, amount, description } = body as { paymentId: string; amount: string; description: string };

    if (!paymentId || !amount) {
      return NextResponse.json(
        { error: 'Payment ID and amount are required' },
        { status: 400 }
      );
    }

    // Get payment record to verify it belongs to the customer
    const paymentRecord = await prisma.paymentRecord.findFirst({
      where: {
        id: parseInt(paymentId),
        customerId: customer.id
      }
    });

    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Get or create wallet for the customer
    let wallet = await prisma.wallet.findUnique({
      where: { customerId: customer.id }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          customerId: customer.id,
          balance: 0,
          currency: 'BHD',
          isActive: true
        }
      });
    }

    // Create wallet transaction with PENDING status
    const walletTransaction = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        transactionType: 'DEPOSIT',
        amount: parseFloat(amount),
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance + parseFloat(amount), // This will be updated when transaction is completed
        description: description || `Wallet top-up via payment #${paymentId}`,
        reference: `Payment: ${paymentId}`,
        metadata: JSON.stringify({ 
          paymentRecordId: paymentRecord.id,
          paymentMethod: paymentRecord.paymentMethod,
          tapTransactionId: paymentRecord.tapTransactionId
        }),
        status: 'PENDING', // Keep as pending until payment is fully confirmed
        processedAt: null // Will be set when transaction is completed
      }
    });

    // Link payment record to wallet transaction
    await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        walletTransactionId: walletTransaction.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        walletTransaction,
        message: 'Wallet transaction created with pending status'
      }
    });

  } catch (error) {
    console.error('Error updating wallet:', error);
    
    // Handle authentication errors specifically
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 