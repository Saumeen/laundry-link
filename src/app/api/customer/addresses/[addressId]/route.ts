import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { addressId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('email');
    const body = await request.json();
    const addressId = parseInt(params.addressId);

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }

    if (isNaN(addressId)) {
      return NextResponse.json(
        { error: "Invalid address ID" },
        { status: 400 }
      );
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email: customerEmail }
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Find address
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
        if (!body.building?.trim() || !body.road?.trim()) {
          return NextResponse.json(
            { error: "Building and road are required" },
            { status: 400 }
          );
        }
        addressLine1 = `${body.building}, ${body.road}`;
        if (body.block?.trim()) {
          addressLine1 += `, Block ${body.block}`;
        }
        if (body.flatNumber?.trim()) {
          addressLine1 += `, Flat ${body.flatNumber}`;
        }
        break;

      case 'office':
        if (!body.building?.trim() || !body.road?.trim()) {
          return NextResponse.json(
            { error: "Building and road are required" },
            { status: 400 }
          );
        }
        addressLine1 = `${body.building}, ${body.road}`;
        if (body.block?.trim()) {
          addressLine1 += `, Block ${body.block}`;
        }
        if (body.officeNumber?.trim()) {
          addressLine1 += `, Office ${body.officeNumber}`;
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid location type" },
          { status: 400 }
        );
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
      }
    });

    return NextResponse.json({
      success: true,
      address: updatedAddress,
      message: "Address updated successfully"
    });

  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { addressId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('email');
    const addressId = parseInt(params.addressId);

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }

    if (isNaN(addressId)) {
      return NextResponse.json(
        { error: "Invalid address ID" },
        { status: 400 }
      );
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email: customerEmail }
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Find address
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

    // Delete the address
    await prisma.address.delete({
      where: { id: addressId }
    });

    // If this was the default address, make another address default
    if (existingAddress.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'asc' }
      });

      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
