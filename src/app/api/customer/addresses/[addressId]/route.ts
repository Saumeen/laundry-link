import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedCustomer, createAuthErrorResponse } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: { addressId: string } }
) {
  try {
    // Get authenticated customer
    const customer = await requireAuthenticatedCustomer();
    const body = await req.json() as any;
    const addressId = parseInt(params.addressId);

    // Validate address exists and belongs to customer
    const existingAddress = await prisma.address.findFirst({
      where: { 
        id: addressId,
        customerId: customer.id 
      }
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    const { label, locationType, contactNumber } = body;
    
    if (!label?.trim()) {
      return NextResponse.json(
        { error: "Label is required" },
        { status: 400 }
      );
    }

    if (!contactNumber?.trim()) {
      return NextResponse.json(
        { error: "Contact number is required" },
        { status: 400 }
      );
    }

    // Format address based on location type
    let addressLine1 = '';
    let city = 'Bahrain'; // Default city

    // Check if this is a Google address (has googleAddress or addressLine1 field)
    if (body.googleAddress?.trim() || body.addressLine1?.trim()) {
      // Use Google address as the primary address - all other fields are optional
      addressLine1 = (body.googleAddress || body.addressLine1).trim();
      city = body.city || 'Bahrain';
      // Skip all location-specific validation when Google address is provided
    } else {
      // Fall back to location-specific address formatting
      switch (locationType) {
        case 'hotel':
          if (!body.hotelName?.trim() || !body.roomNumber?.trim()) {
            return NextResponse.json(
              { error: "Hotel name and room number are required" },
              { status: 400 }
            );
          }
          addressLine1 = `${body.hotelName}, Room ${body.roomNumber}`;
          if (body.collectionMethod) {
            addressLine1 += ` (${body.collectionMethod})`;
          }
          break;

        case 'home':
          if (!body.house?.trim() || !body.road?.trim()) {
            return NextResponse.json(
              { error: "House and road are required" },
              { status: 400 }
            );
          }
          addressLine1 = `${body.house}, ${body.road}`;
          if (body.block?.trim()) {
            addressLine1 += `, Block ${body.block}`;
          }
          break;

        case 'flat':
          if (!body.building?.trim() || !body.flatNumber?.trim()) {
            return NextResponse.json(
              { error: "Building and flat number are required" },
              { status: 400 }
            );
          }
          addressLine1 = `${body.building}`;
          if (body.road?.trim()) {
            addressLine1 += `, ${body.road}`;
          }
          if (body.block?.trim()) {
            addressLine1 += `, Block ${body.block}`;
          }
          addressLine1 += `, Flat ${body.flatNumber}`;
          break;

        case 'office':
          if (!body.building?.trim() || !body.officeNumber?.trim()) {
            return NextResponse.json(
              { error: "Building and office number are required" },
              { status: 400 }
            );
          }
          addressLine1 = `${body.building}`;
          if (body.road?.trim()) {
            addressLine1 += `, ${body.road}`;
          }
          if (body.block?.trim()) {
            addressLine1 += `, Block ${body.block}`;
          }
          addressLine1 += `, Office ${body.officeNumber}`;
          break;

        default:
          return NextResponse.json(
            { error: "Invalid location type" },
            { status: 400 }
          );
      }
    }

    // Update the address
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        label: label.trim(),
        address: addressLine1,
        addressLine1,
        city,
        locationType,
        contactNumber: contactNumber.trim(),
        area: body.road?.trim() || null,
        building: body.building?.trim() || body.hotelName?.trim() || null,
        floor: body.flatNumber?.trim() || body.roomNumber?.trim() || null,
        apartment: body.officeNumber?.trim() || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
      }
    });

    return NextResponse.json({
      success: true,
      address: updatedAddress,
      message: "Address updated successfully"
    });

  } catch (error) {
    console.error("Error updating address:", error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to update address" },
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
        customerId: customer.id 
      }
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    // Check if this is the default address
    if (existingAddress.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default address. Please set another address as default first." },
        { status: 400 }
      );
    }

    // Delete the address
    await prisma.address.delete({
      where: { id: addressId }
    });

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting address:", error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
