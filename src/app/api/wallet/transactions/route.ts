import { NextRequest, NextResponse } from 'next/server';
import { getWalletTransactionHistory } from '@/lib/utils/walletUtils';
import { getTapCharge } from '@/lib/utils/tapPaymentUtils';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    // First, check for any pending TAP payments and update their status
    await checkAndUpdatePendingTapPayments(parseInt(customerId));

    const transactions = await getWalletTransactionHistory(parseInt(customerId), limit);

    // Calculate if there are more transactions
    const hasMore = transactions.length === limit;

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        total: transactions.length + (hasMore ? 1 : 0), // Approximate total
        hasMore,
        page,
        limit
      }
    });

  } catch (error) {
    logger.error('Error getting transaction history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get transaction history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Check and update pending TAP payments by fetching their current status from TAP API
 */
async function checkAndUpdatePendingTapPayments(customerId: number) {
  try {
    // Find all pending wallet transactions that have TAP charge IDs
    const pendingTransactions = await prisma.walletTransaction.findMany({
      where: {
        wallet: {
          customerId: customerId
        },
        status: 'PENDING',
        metadata:{
          contains: 'tapTransactionId'
        }
      },
      include: {
        wallet: true
      }
    });

    for (const transaction of pendingTransactions) {
      try {
        // Extract TAP charge ID from metadata
        const metadata = JSON.parse(transaction.metadata || '{}');
        const tapChargeId = metadata.tapTransactionId;

        if (tapChargeId) {
          // Fetch current status from TAP API
          const chargeData = await getTapCharge(tapChargeId) as any;
          
          // Determine the new status based on TAP charge status
          let newStatus: 'COMPLETED' | 'FAILED' | 'PENDING' = 'PENDING';
          
          switch (chargeData.status) {
            case 'CAPTURED':
              newStatus = 'COMPLETED';
              break;
            case 'DECLINED':
            case 'CANCELLED':
            case 'FAILED':
            case 'VOID':
              newStatus = 'FAILED';
              break;
            default:
              newStatus = 'PENDING';
          }

          // Update transaction if status changed
          if (newStatus !== transaction.status) {
            if (newStatus === 'COMPLETED') {
              // Update wallet balance
              const newBalance = transaction.wallet.balance + transaction.amount;
              
              await prisma.walletTransaction.update({
                where: { id: transaction.id },
                data: {
                  status: 'COMPLETED',
                  balanceAfter: newBalance,
                  processedAt: new Date(),
                  metadata: JSON.stringify({
                    ...metadata,
                    tapChargeStatus: chargeData.status,
                    lastStatusCheck: new Date().toISOString(),
                    updatedFromTap: true
                  })
                }
              });

              // Update wallet balance
              await prisma.wallet.update({
                where: { id: transaction.wallet.id },
                data: {
                  balance: newBalance,
                  lastTransactionAt: new Date()
                }
              });

              logger.info(`Updated pending TAP payment ${transaction.id} to COMPLETED. Charge ID: ${tapChargeId}`);
            } else if (newStatus === 'FAILED') {
              await prisma.walletTransaction.update({
                where: { id: transaction.id },
                data: {
                  status: 'FAILED',
                  processedAt: new Date(),
                  metadata: JSON.stringify({
                    ...metadata,
                    tapChargeStatus: chargeData.status,
                    failureReason: chargeData.failure_reason || 'Payment failed',
                    lastStatusCheck: new Date().toISOString(),
                    updatedFromTap: true
                  })
                }
              });

              logger.info(`Updated pending TAP payment ${transaction.id} to FAILED. Charge ID: ${tapChargeId}`);
            }
          }
        }
      } catch (error) {
        logger.error(`Error checking TAP payment status for transaction ${transaction.id}:`, error);
        // Continue with other transactions even if one fails
      }
    }
  } catch (error) {
    logger.error('Error checking pending TAP payments:', error);
    // Don't throw error - we still want to return transaction history even if TAP check fails
  }
} 