import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

interface AddressUpdate {
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  area?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  contactNumber?: string;
  locationType?: string;
  latitude?: number;
  longitude?: number;
}

interface UpdateAddressRequest {
  addressId: number;
  updates: AddressUpdate;
}

// GET - Get all addresses for a specific customer
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { customerId: parseInt(customerId) },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      addresses,
    });
  } catch (error) {
    logger.error('Error fetching customer addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// PUT - Update customer address
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as UpdateAddressRequest;
    const { addressId, updates } = body;

    if (!addressId) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    // Validate updates
    const allowedFields = [
      'label',
      'addressLine1',
      'addressLine2',
      'city',
      'area',
      'building',
      'floor',
      'apartment',
      'landmark',
      'contactNumber',
      'locationType',
      'latitude',
      'longitude',
    ];

    const validUpdates: AddressUpdate = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;
      }
    }

    // Update address
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: validUpdates,
    });

    return NextResponse.json({
      success: true,
      address: updatedAddress,
      message: 'Address updated successfully',
    });
  } catch (error) {
    logger.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer address
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    // Check if address is default
    const address = await prisma.address.findUnique({
      where: { id: parseInt(addressId) },
      select: { isDefault: true },
    });

    if (address?.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default address' },
        { status: 400 }
      );
    }

    // Delete address
    await prisma.address.delete({
      where: { id: parseInt(addressId) },
    });

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
