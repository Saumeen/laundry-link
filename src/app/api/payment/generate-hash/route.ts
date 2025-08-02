import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      publicKey: string;
      amount: string | number;
      currency: string;
      transactionReference: string;
      postUrl: string;
    };
    const { publicKey, amount, currency, transactionReference, postUrl } = body;

    // Validate required fields
    if (!publicKey || !amount || !currency || !transactionReference || !postUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get secret key from environment
    const secretKey = process.env.TAP_SECRET_KEY;
    if (!secretKey || secretKey === 'sk_test_...') {
      return NextResponse.json(
        { error: 'Secret key not configured' },
        { status: 500 }
      );
    }

    // Format amount to 3 decimal places
    const formattedAmount = parseFloat(amount.toString()).toFixed(3);

    // Create the string to be hashed
    const toBeHashed = `x_publickey${publicKey}x_amount${formattedAmount}x_currency${currency}x_transaction${transactionReference}x_post${postUrl}`;

    // Generate hash using HMAC SHA256
    const hashString = crypto
      .createHmac('sha256', secretKey)
      .update(toBeHashed)
      .digest('hex');

    return NextResponse.json({
      success: true,
      hashString,
      toBeHashed // For debugging purposes only - remove in production
    });

  } catch (error) {
    console.error('Error generating hash string:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 