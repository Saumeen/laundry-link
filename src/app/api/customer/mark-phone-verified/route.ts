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

    // Use Prisma upsert for type-safe phone verification
    const phoneVerification = await prisma.phoneVerification.upsert({
      where: {
        customerId_phoneNumber: {
          customerId: customer.id,
          phoneNumber: phoneNumber
        }
      },
      update: {
        isVerified: true,
        verifiedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        customerId: customer.id,
        phoneNumber: phoneNumber,
        isVerified: true,
        verifiedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Phone number marked as verified'
    });

  } catch (error) {
    console.error('Error marking phone as verified:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 