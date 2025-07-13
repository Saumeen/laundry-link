import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedCustomer } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated customer
    const customer = await requireAuthenticatedCustomer();

    const body = await request.json();
    const { phoneNumber } = body as { phoneNumber: string };

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if phone number is already verified using Prisma ORM
    const phoneVerification = await prisma.phoneVerification.findFirst({
      where: {
        customerId: customer.id,
        phoneNumber: phoneNumber
      },
      select: {
        isVerified: true,
        verifiedAt: true
      }
    });

    const isVerified = phoneVerification?.isVerified || false;

    return NextResponse.json({
      isVerified,
      verifiedAt: phoneVerification?.verifiedAt || null
    });

  } catch (error) {
    console.error('Error checking phone verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 