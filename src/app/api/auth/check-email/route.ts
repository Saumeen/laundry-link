// src/app/api/auth/check-email/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email: string };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if customer exists with this email
    const customer = await prisma.customer.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    return NextResponse.json({
      exists: !!customer,
      isActive: customer?.isActive || false,
    });
  } catch (error) {
    logger.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Failed to check email' },
      { status: 500 }
    );
  }
}
