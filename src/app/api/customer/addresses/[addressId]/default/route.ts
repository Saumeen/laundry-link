// src/app/api/customer/addresses/[addressId]/default/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireAuthenticatedCustomer,
  createAuthErrorResponse,
} from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: { addressId: string } }
) {
  try {
    // Get authenticated customer
    const customer = await requireAuthenticatedCustomer();
    const addressId = parseInt(params.addressId);

    // Validate address exists and belongs to customer
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        customerId: customer.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Use a transaction to ensure data consistency
    await prisma.$transaction(async tx => {
      // First, remove default from all addresses
      await tx.address.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      });

      // Then set the selected address as default
      await tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Default address updated successfully',
    });
  } catch (error) {
    console.error('Error setting default address:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to set default address' },
      { status: 500 }
    );
  }
}
