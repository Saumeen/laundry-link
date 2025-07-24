import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find customer with this activation token
    const customer = await prisma.customer.findUnique({
      where: {
        activationToken: token,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    if (customer.isActive) {
      return NextResponse.json(
        { error: 'Account is already activated' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update customer with password and activate account
    const updatedCustomer = await prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: {
        password: hashedPassword,
        isActive: true,
        activationToken: null, // Remove the token after use
      },
    });

    return NextResponse.json({
      message: 'Account setup completed successfully',
      customer: {
        id: updatedCustomer.id,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        email: updatedCustomer.email,
      },
    });
  } catch (error) {
    console.error('Error setting up account:', error);
    return NextResponse.json(
      { error: 'Failed to set up account' },
      { status: 500 }
    );
  }
}
