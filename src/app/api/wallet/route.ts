import { NextRequest, NextResponse } from 'next/server';
import { 
  getWalletBalance,
  getWalletTransactionHistory,
  processWalletTransaction,
  createWalletForCustomer
} from '@/lib/utils/walletUtils';
import logger from '@/lib/logger';

interface WalletTransactionRequest {
  customerId: number;
  action: 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT';
  amount: number | string;
  description: string;
  reference?: string;
  metadata?: string;
}

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
    const transactions = await getWalletTransactionHistory(parseInt(customerId), 10);

    return NextResponse.json({
      success: true,
      data: {
        balance,
        transactions
      }
    });

  } catch (error) {
    logger.error('Error getting wallet info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get wallet information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as WalletTransactionRequest;
    const {
      customerId,
      action,
      amount,
      description,
      reference,
      metadata
    } = body;

    if (!customerId || !action || !amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, action, amount, description' },
        { status: 400 }
      );
    }

    // Ensure wallet exists
    const wallet = await createWalletForCustomer(customerId);

    let result;

    switch (action) {
      case 'DEPOSIT':
        result = await processWalletTransaction({
          walletId: wallet.id,
          transactionType: 'DEPOSIT',
          amount: typeof amount === 'string' ? parseFloat(amount) : amount,
          description,
          reference,
          metadata
        });
        break;

      case 'WITHDRAWAL':
        result = await processWalletTransaction({
          walletId: wallet.id,
          transactionType: 'WITHDRAWAL',
          amount: typeof amount === 'string' ? parseFloat(amount) : amount,
          description,
          reference,
          metadata
        });
        break;

      case 'ADJUSTMENT':
        result = await processWalletTransaction({
          walletId: wallet.id,
          transactionType: 'ADJUSTMENT',
          amount: typeof amount === 'string' ? parseFloat(amount) : amount,
          description,
          reference,
          metadata
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error processing wallet transaction:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process wallet transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 