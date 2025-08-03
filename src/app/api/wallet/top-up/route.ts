import { NextRequest, NextResponse } from 'next/server';
import { processTapPayment } from '@/lib/utils/tapPaymentUtils';
import prisma from '@/lib/prisma';
import { requireAuthenticatedCustomer } from '@/lib/auth';
import logger from '@/lib/logger';

interface TopUpRequest {
  amount: number;
  paymentMethod: 'TAP_PAY' | 'BENEFIT_PAY' | 'BANK_TRANSFER';
  description?: string;
  tokenId?: string;
  customerData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated customer
    const customer = await requireAuthenticatedCustomer();
    
    // Parse and validate request body
    let body: TopUpRequest;
    try {
      const rawBody = await request.json();
      body = rawBody as TopUpRequest;
    } catch (parseError) {
      logger.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body format' },
        { status: 400 }
      );
    }

    const {
      amount,
      paymentMethod,
      description,
      // Tap payment specific fields
      tokenId,
      customerData
    } = body;

    // Validate required fields
    if (!amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, paymentMethod' },
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
      case 'BENEFIT_PAY':
        // Validate Tap payment required fields
        if (!tokenId || !customerData) {
          return NextResponse.json(
            { error: 'Missing required fields for payment: tokenId, customerData' },
            { status: 400 }
          );
        }

        // Process wallet top-up using Tap (works for both TAP_PAY and BENEFIT_PAY)
        result = await processTapPayment(
          customer.id,
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
            customerId: customer.id,
            amount,
            currency: 'BHD',
            paymentMethod: 'BANK_TRANSFER',
            description: description || `Wallet top-up via bank transfer - ${amount} BHD`,
            paymentStatus: 'PENDING'
          }
        });

        result = { 
          paymentRecord,
          message: 'Bank transfer request submitted successfully. Please complete the transfer and contact support for confirmation.'
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
    logger.error('Error processing wallet top-up:', error);
    
    // Handle authentication errors specifically
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process wallet top-up',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 