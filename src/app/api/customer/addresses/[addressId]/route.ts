import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { requireAuthenticatedCustomer } from '@/lib/auth';

interface AddressUpdateBody {
  label?: string;
  locationType?: string;
  contactNumber?: string;
  googleAddress?: string;
  addressLine1?: string;
  city?: string;
  hotelName?: string;
  roomNumber?: string;
  collectionMethod?: string;
  house?: string;
  road?: string;
  block?: string;
  building?: string;
  flatNumber?: string;
  officeNumber?: string;
  latitude?: number;
  longitude?: number;
}

export async function PUT(
  req: Request,
  { params }: { params: { addressId: string } }
) {
  try {
    // Get authenticated customer
    const customer = await requireAuthenticatedCustomer();
    const body = (await req.json()) as AddressUpdateBody;
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

    // Validate required fields
    const { label, locationType, contactNumber } = body;

    if (!label?.trim()) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 });
    }

    if (!contactNumber?.trim()) {
      return NextResponse.json(
        { error: 'Contact number is required' },
        { status: 400 }
      );
    }

    if (!locationType) {
      return NextResponse.json(
        { error: 'Location type is required' },
        { status: 400 }
      );
    }

    // Format address based on location type
    let addressLine1 = '';
    let city = 'Bahrain'; // Default city

    // Check if this is a Google address (has googleAddress or addressLine1 field)
    if ((body.googleAddress as string)?.trim() || (body.addressLine1 as string)?.trim()) {
      // Use Google address as the primary address - all other fields are optional
      addressLine1 = ((body.googleAddress as string) || (body.addressLine1 as string)).trim();
      city = (body.city as string) || 'Bahrain';
      // Skip all location-specific validation when Google address is provided
    } else {
      // Fall back to location-specific address formatting
      switch (locationType) {
        case 'hotel':
          if (!(body.hotelName as string)?.trim() || !(body.roomNumber as string)?.trim()) {
            return NextResponse.json(
              { error: 'Hotel name and room number are required' },
              { status: 400 }
            );
          }
          addressLine1 = `${body.hotelName as string}, Room ${body.roomNumber as string}`;
          if (body.collectionMethod) {
            addressLine1 += ` (${body.collectionMethod as string})`;
          }
          break;

        case 'home':
          if (!(body.house as string)?.trim() || !(body.road as string)?.trim()) {
            return NextResponse.json(
              { error: 'House and road are required' },
              { status: 400 }
            );
          }
          addressLine1 = `${body.house as string}, ${body.road as string}`;
          if ((body.block as string)?.trim()) {
            addressLine1 += `, Block ${body.block as string}`;
          }
          break;

        case 'flat':
          if (!(body.building as string)?.trim() || !(body.flatNumber as string)?.trim()) {
            return NextResponse.json(
              { error: 'Building and flat number are required' },
              { status: 400 }
            );
          }
          addressLine1 = `${body.building as string}`;
          if ((body.road as string)?.trim()) {
            addressLine1 += `, ${body.road as string}`;
          }
          if ((body.block as string)?.trim()) {
            addressLine1 += `, Block ${body.block as string}`;
          }
          addressLine1 += `, Flat ${body.flatNumber as string}`;
          break;

        case 'office':
          if (!(body.building as string)?.trim() || !(body.officeNumber as string)?.trim()) {
            return NextResponse.json(
              { error: 'Building and office number are required' },
              { status: 400 }
            );
          }
          addressLine1 = `${body.building as string}`;
          if ((body.road as string)?.trim()) {
            addressLine1 += `, ${body.road as string}`;
          }
          if ((body.block as string)?.trim()) {
            addressLine1 += `, Block ${body.block as string}`;
          }
          addressLine1 += `, Office ${body.officeNumber as string}`;
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid location type' },
            { status: 400 }
          );
      }
    }

    // Update the address
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        label: (label as string)?.trim() || '',
        address: addressLine1,
        addressLine1,
        city,
        locationType,
        contactNumber: (contactNumber as string)?.trim() || null,
        area: (body.road as string)?.trim() || null,
        building: (body.building as string)?.trim() || (body.hotelName as string)?.trim() || null,
        floor: (body.flatNumber as string)?.trim() || (body.roomNumber as string)?.trim() || null,
        apartment: (body.officeNumber as string)?.trim() || null,
        latitude: body.latitude as number || null,
        longitude: body.longitude as number || null,
      },
    });

    return NextResponse.json({
      success: true,
      address: updatedAddress,
      message: 'Address updated successfully',
    });
  } catch (error) {
    logger.error('Error updating address:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if this is the default address
    if (existingAddress.isDefault) {
      return NextResponse.json(
        {
          error:
            'Cannot delete default address. Please set another address as default first.',
        },
        { status: 400 }
      );
    }

    // Delete the address
    await prisma.address.delete({
      where: { id: addressId },
    });

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting address:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
