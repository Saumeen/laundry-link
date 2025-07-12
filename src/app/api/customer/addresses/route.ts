import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedCustomer, createAuthErrorResponse } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Get authenticated customer
    const customer = await requireAuthenticatedCustomer();

    const addresses = await prisma.address.findMany({
      where: { customerId: customer.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ 
      addresses 
    });

  } catch (error) {
    console.error("Error fetching addresses:", error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Get authenticated customer
    const customer = await requireAuthenticatedCustomer();
    const body = await req.json() as any;

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

    // Check if this is a Google address (has googleAddress field)
    if (body.googleAddress?.trim()) {
      // Use Google address as the primary address
      addressLine1 = body.googleAddress.trim();
      city = body.city || 'Bahrain';
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
    }

    // Check if this is the first address (make it default)
    const existingAddresses = await prisma.address.findMany({
      where: { customerId: customer.id }
    });

    const isFirstAddress = existingAddresses.length === 0;

    // Create the address
    const newAddress = await prisma.address.create({
      data: {
        customerId: customer.id,
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
        isDefault: isFirstAddress,
      }
    });

    return NextResponse.json({
      success: true,
      address: newAddress,
      message: "Address created successfully"
    });

  } catch (error) {
    console.error("Error creating address:", error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
