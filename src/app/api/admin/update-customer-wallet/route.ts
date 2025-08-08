import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';

interface UpdateWalletRequest {
  customerId: number;
  newBalance: number;
  reason: string;
  adminNotes?: string;
}

export async function POST(req: Request) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const body = (await req.json()) as UpdateWalletRequest;
    const { customerId, newBalance, reason, adminNotes } = body;

    // Validate input
    if (!customerId || newBalance === undefined || !reason) {
      return NextResponse.json(
        { error: 'Customer ID, new balance, and reason are required' },
        { status: 400 }
      );
    }

    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Wallet balance cannot be negative' },
        { status: 400 }
      );
    }

    if (reason.trim().length < 3) {
      return NextResponse.json(
        { error: 'Reason must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Get customer with wallet
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        wallet: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (!customer.wallet) {
      return NextResponse.json(
        { error: 'Customer does not have a wallet' },
        { status: 400 }
      );
    }

    const oldBalance = customer.wallet.balance;
    const balanceDifference = newBalance - oldBalance;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: customer?.wallet?.id },
        data: {
          balance: newBalance,
          lastTransactionAt: new Date(),
        },
      });

      // Create wallet transaction record for audit trail
      const walletTransaction = await tx.walletTransaction.create({
        data: {
          walletId: customer.wallet!.id,
          transactionType: 'ADJUSTMENT',
          amount: Math.abs(balanceDifference),
          balanceBefore: oldBalance,
          balanceAfter: newBalance,
          description: `Admin adjustment: ${reason}`,
          metadata: JSON.stringify({
            adminId: admin.id,
            adminEmail: admin.email,
            adminNotes: adminNotes || '',
            adjustmentType: 'MANUAL_ADMIN_ADJUSTMENT',
            reason: reason,
          }),
        },
      });

      return { updatedWallet, walletTransaction };
    });

    logger.info('Admin wallet adjustment:', {
      adminId: admin.id,
      customerId: customerId,
      oldBalance: oldBalance,
      newBalance: newBalance,
      difference: balanceDifference,
      reason: reason,
    });

    return NextResponse.json({
      success: true,
      message: 'Wallet balance updated successfully',
      data: {
        customerId: customerId,
        oldBalance: oldBalance,
        newBalance: newBalance,
        difference: balanceDifference,
        transactionId: result.walletTransaction.id,
      },
    });
  } catch (error: unknown) {
    logger.error('Error updating customer wallet:', error);
    
    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: 'Failed to update wallet balance' },
      { status: 500 }
    );
  }
} 