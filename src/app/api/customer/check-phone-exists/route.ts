import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

interface CheckPhoneRequest {
  phoneNumber: string;
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = (await request.json()) as CheckPhoneRequest;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if a customer with this phone number already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: phoneNumber,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return NextResponse.json({
      exists: !!existingCustomer,
      message: existingCustomer
        ? 'Phone number already registered'
        : 'Phone number available',
    });
  } catch (error) {
    logger.error('Error checking phone number existence:', error);
    return NextResponse.json(
      { error: 'Failed to check phone number' },
      { status: 500 }
    );
  }
}
