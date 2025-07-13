import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// POST - Reset customer password
export async function POST(req: Request) {
  try {
    const body = await req.json() as { customerId: number; newPassword?: string };
    const { customerId, newPassword } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, isActive: true }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    let hashedPassword: string;
    let activationToken: string | null = null;

    if (newPassword) {
      // If new password is provided, hash it
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      hashedPassword = await bcrypt.hash(newPassword, 12);
    } else {
      // Generate a random password
      const randomPassword = crypto.randomBytes(8).toString('hex');
      hashedPassword = await bcrypt.hash(randomPassword, 12);
      activationToken = crypto.randomBytes(32).toString('hex');
    }

    // Update customer password
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        password: hashedPassword,
        activationToken: newPassword ? null : activationToken,
        isActive: newPassword ? true : false, // If password provided, activate account
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: newPassword 
        ? 'Password updated successfully' 
        : 'Password reset successfully. Customer needs to activate account.',
      activationToken: activationToken, // Only returned if auto-generated password
    });
  } catch (error) {
    console.error('Error resetting customer password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
} 