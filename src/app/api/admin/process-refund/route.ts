import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import logger from '@/lib/logger';

interface ProcessRefundRequest {
  paymentId: number;
  orderId: number;
  customerId: number;
  refundAmount: number;
  refundReason: string;
}

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

    // Ensure customer has a wallet
    if (!paymentRecord.customer.wallet) {
      return NextResponse.json(
        { error: 'Customer wallet not found' },
        { status: 400 }
      );
    }

    // Process the refund in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create wallet transaction for refund first
      const walletTransaction = await tx.walletTransaction.create({
        data: {
          walletId: paymentRecord.customer.wallet!.id,
          transactionType: 'REFUND',
          amount: refundAmount,
          balanceBefore: paymentRecord.customer.wallet!.balance,
          balanceAfter: paymentRecord.customer.wallet!.balance + refundAmount,
          description: `Refund for Order #${paymentRecord.order?.orderNumber || orderId}: ${refundReason}`,
          reference: `REFUND_${paymentId}`,
          metadata: JSON.stringify({
            originalPaymentRecordId: paymentId,
            orderId: orderId,
            refundReason: refundReason,
            processedBy: admin.id
          }),
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      // Create a NEW payment record for the refund (instead of updating the original)
      const refundPaymentRecord = await tx.paymentRecord.create({
        data: {
          customerId: customerId,
          orderId: orderId,
          amount: refundAmount,
          paymentMethod: 'WALLET', // Refund goes back to wallet
          paymentStatus: 'PAID', // Refund is immediately processed
          description: `Refund for Order #${paymentRecord.order?.orderNumber || orderId}: ${refundReason}`,
          walletTransactionId: walletTransaction.id,
          refundReason: refundReason,
          processedAt: new Date(),
          metadata: JSON.stringify({
            originalPaymentRecordId: paymentId,
            originalPaymentAmount: paymentRecord.amount,
            originalPaymentMethod: paymentRecord.paymentMethod,
            refundReason: refundReason,
            processedBy: admin.id,
            isRefund: true
          })
        }
      });

      // Update the ORIGINAL payment record to track refunds (but don't change its core data)
      const updatedOriginalPaymentRecord = await tx.paymentRecord.update({
        where: { id: paymentId },
        data: {
          refundAmount: alreadyRefunded + refundAmount,
          refundReason: refundReason,
          // Keep the original payment status as PAID, but add refund tracking
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
          orderId: orderId,
          action: 'REFUND_PROCESSED',
          description: `Refund of ${refundAmount} BD processed. Reason: ${refundReason}`,
          metadata: JSON.stringify({
            originalPaymentRecordId: paymentId,
            refundPaymentRecordId: refundPaymentRecord.id,
            refundAmount: refundAmount,
            refundReason: refundReason,
            processedBy: admin.id,
            walletTransactionId: walletTransaction.id
          }),
          staffId: admin.id
        }
      });

      return {
        originalPaymentRecord: updatedOriginalPaymentRecord,
        refundPaymentRecord,
        walletTransaction,
        newWalletBalance: paymentRecord.customer.wallet!.balance + refundAmount
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundAmount: refundAmount,
        newWalletBalance: result.newWalletBalance,
        refundPaymentRecordId: result.refundPaymentRecord.id,
        originalPaymentRecordId: result.originalPaymentRecord.id
      }
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