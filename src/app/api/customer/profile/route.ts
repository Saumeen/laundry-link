import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
import logger from '@/lib/logger';
  requireAuthenticatedCustomer,
  createAuthErrorResponse,
} from '@/lib/auth';

export async function GET() {
  try {
    // Get authenticated customer using NextAuth
    const authenticatedCustomer = await requireAuthenticatedCustomer();

    // Get customer profile with wallet balance
    const customer = await prisma.customer.findUnique({
      where: { id: authenticatedCustomer.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        wallet: {
          select: {
            balance: true,
            currency: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    logger.error('Error fetching customer profile:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch customer profile',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: Request) {
  try {
    // Get authenticated customer using NextAuth
    const authenticatedCustomer = await requireAuthenticatedCustomer();
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      phone?: string;
    };

    // Validate required fields
    const { firstName, lastName, phone } = body;

    if (!firstName?.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    if (!lastName?.trim()) {
      return NextResponse.json(
        { error: 'Last name is required' },
        { status: 400 }
      );
    }

    // Update customer profile
    const updatedCustomer = await prisma.customer.update({
      where: { id: authenticatedCustomer.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logger.error('Error updating customer profile:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }

    return NextResponse.json(
      {
        error: 'Failed to update customer profile',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
