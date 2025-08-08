import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { 
  processWalletPayment, 
  createPaymentRecord, 
  updatePaymentStatus 
} from '@/lib/utils/walletUtils';
import { processTapPayment, processCardPayment } from '@/lib/utils/tapPaymentUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      customerId: number;
      orderId?: number;
      amount: number;
      paymentMethod: string;
      description?: string;
      paymentType?: string;
      tokenId?: string;
      customerData?: any;
    };
    const {
      customerId,
      orderId,
      amount,
      paymentMethod,
      description,
      paymentType, // For wallet top-ups
      // Tap payment specific fields
      tokenId,
      customerData
    } = body;

    // Validate required fields
    if (!customerId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, amount, paymentMethod' },
        { status: 400 }
      );
    }

    let result;

    switch (paymentMethod) {
      case 'WALLET':
        // Process payment using wallet balance
        result = await processWalletPayment(
          customerId,
          orderId ?? 0,
          amount,
          description || `Payment for order ${orderId ?? 'wallet top-up'}`
        );
        break;

      case 'TAP_PAY':
        // Validate Tap payment required fields
        if (!tokenId || !customerData) {
          return NextResponse.json(
            { error: 'Missing required fields for Tap payment: tokenId, customerData' },
            { status: 400 }
          );
        }

        // Check if this is a wallet top-up
        const isWalletTopUp = paymentType === 'WALLET_TOP_UP';

        // Process payment using Tap
        if (isWalletTopUp) {
          result = await processTapPayment(
            customerId,
            0, // Use 0 for wallet top-ups
            amount,
            customerData,
            tokenId,
            description,
            true // isWalletTopUp = true
          );
        } else {
          // This is an order payment
          result = await processCardPayment(
            customerId,
            orderId ?? 0,
            amount,
            customerData,
            tokenId,
            description
          );
        }
        break;

      case 'CASH':
      case 'BANK_TRANSFER':
        // Create payment record for offline payments
        const paymentRecord = await createPaymentRecord({
          customerId,
          orderId,
          amount,
          paymentMethod,
          description: description || `Payment for order ${orderId ?? 'wallet top-up'}`
        });

        // Mark as pending - will be updated manually by admin
        await updatePaymentStatus(paymentRecord.id, 'PENDING');
        
        result = { paymentRecord };
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported payment method: ${paymentMethod}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error processing payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 