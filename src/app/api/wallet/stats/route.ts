import { NextRequest, NextResponse } from 'next/server';
import { getWalletBalance, getWalletTransactionHistory } from '@/lib/utils/walletUtils';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    const balance = await getWalletBalance(parseInt(customerId));
    const transactions = await getWalletTransactionHistory(parseInt(customerId), 1000); // Get all transactions for stats

    // Calculate statistics
    const totalDeposits = transactions
      .filter(t => t.transactionType === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayments = transactions
      .filter(t => t.transactionType === 'PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRefunds = transactions
      .filter(t => t.transactionType === 'REFUND')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = transactions
      .filter(t => t.transactionType === 'WITHDRAWAL')
      .reduce((sum, t) => sum + t.amount, 0);

    const transactionCounts = {
      DEPOSIT: transactions.filter(t => t.transactionType === 'DEPOSIT').length,
      PAYMENT: transactions.filter(t => t.transactionType === 'PAYMENT').length,
      REFUND: transactions.filter(t => t.transactionType === 'REFUND').length,
      WITHDRAWAL: transactions.filter(t => t.transactionType === 'WITHDRAWAL').length,
      ADJUSTMENT: transactions.filter(t => t.transactionType === 'ADJUSTMENT').length,
      TRANSFER: transactions.filter(t => t.transactionType === 'TRANSFER').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        balance,
        totalDeposits,
        totalPayments,
        totalRefunds,
        totalWithdrawals,
        transactionCounts,
        totalTransactions: transactions.length
      }
    });

  } catch (error) {
    logger.error('Error getting wallet stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get wallet statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 