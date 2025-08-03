import { NextRequest, NextResponse } from 'next/server';
import { getWalletTransactionHistory } from '@/lib/utils/walletUtils';
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