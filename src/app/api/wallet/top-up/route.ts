import { NextRequest, NextResponse } from 'next/server';
import { processTapPayment } from '@/lib/utils/tapPaymentUtils';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      amount,
      paymentMethod,
      description,
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

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    let result;

    switch (paymentMethod) {
      case 'TAP_PAY':
        // Validate Tap payment required fields
        if (!tokenId || !customerData) {
          return NextResponse.json(
            { error: 'Missing required fields for Tap payment: tokenId, customerData' },
            { status: 400 }
          );
        }

        // Process wallet top-up using Tap
        result = await processTapPayment(
          customerId,
          0, // No order ID for wallet top-ups
          amount,
          customerData,
          tokenId,
          description || `Wallet top-up - ${amount} BHD`,
          true // isWalletTopUp = true
        );
        break;

      case 'BANK_TRANSFER':
        // Create payment record for bank transfer
        const paymentRecord = await prisma.paymentRecord.create({
          data: {
            customerId,
            amount,
            currency: 'BHD',
            paymentMethod: 'BANK_TRANSFER',
            description: description || `Wallet top-up via bank transfer - ${amount} BHD`,
            paymentStatus: 'PENDING'
          }
        });

        result = { 
          paymentRecord,
          message: 'Bank transfer initiated. Please complete the transfer and contact support for confirmation.'
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported payment method for wallet top-up: ${paymentMethod}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error processing wallet top-up:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process wallet top-up',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 