import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';
import { createWalletForCustomer } from '@/lib/utils/walletUtils';

interface UpdateWalletRequest {
  customerId: number;
  newBalance?: number; // Direct balance setting
  balanceAdjustment?: number; // Amount to add/subtract from current balance
  reason: string;
  adminNotes?: string;
}

export async function POST(req: Request) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const body = (await req.json()) as UpdateWalletRequest;
    const { customerId, newBalance, balanceAdjustment, reason, adminNotes } = body;

    // Validate input
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json(
        { error: 'Reason must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (newBalance === undefined && balanceAdjustment === undefined) {
      return NextResponse.json(
        { error: 'Either new balance or balance adjustment is required' },
        { status: 400 }
      );
    }

    // Get customer
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

    // Create wallet if it doesn't exist
    const wallet = customer.wallet || await createWalletForCustomer(customerId);
    
    const oldBalance = wallet.balance;
    let finalBalance: number;

    if (newBalance !== undefined) {
      // Direct balance setting
      if (newBalance < 0) {
        return NextResponse.json(
          { error: 'Wallet balance cannot be negative' },
          { status: 400 }
        );
      }
      finalBalance = newBalance;
    } else {
      // Balance adjustment
      finalBalance = oldBalance + balanceAdjustment!;
      if (finalBalance < 0) {
        return NextResponse.json(
          { error: 'Resulting wallet balance cannot be negative' },
          { status: 400 }
        );
      }
    }

    const balanceDifference = finalBalance - oldBalance;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: finalBalance,
          lastTransactionAt: new Date(),
        },
      });

      // Create wallet transaction record for audit trail
      const walletTransaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          transactionType: 'ADJUSTMENT',
          amount: Math.abs(balanceDifference),
          balanceBefore: oldBalance,
          balanceAfter: finalBalance,
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
      newBalance: finalBalance,
      difference: balanceDifference,
      reason: reason,
    });

    return NextResponse.json({
      success: true,
      message: 'Wallet balance updated successfully',
      data: {
        customerId: customerId,
        oldBalance: oldBalance,
        newBalance: finalBalance,
        difference: balanceDifference,
        transactionId: result.walletTransaction.id,
        walletCreated: !customer.wallet, // Indicate if wallet was created
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