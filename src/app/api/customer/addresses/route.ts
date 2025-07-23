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

    // Always validate location-specific fields regardless of Google address
    switch (locationType) {
      case 'hotel':
        if (!body.hotelName?.trim() || !body.roomNumber?.trim()) {
          return NextResponse.json(
            { error: "Hotel name and room number are required" },
            { status: 400 }
          );
        }
        break;

      case 'home':
        if (!body.house?.trim()) {
          return NextResponse.json(
            { error: "House number is required" },
            { status: 400 }
          );
        }
        break;

      case 'flat':
        if (!body.building?.trim() || !body.flatNumber?.trim()) {
          return NextResponse.json(
            { error: "Building name/number and flat number are required" },
            { status: 400 }
          );
        }
        break;

      case 'office':
        if (!body.building?.trim() || !body.officeNumber?.trim()) {
          return NextResponse.json(
            { error: "Building name/number and office name/number are required" },
            { status: 400 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid location type" },
          { status: 400 }
        );
    }

    // Check if this is the first address (make it default)
    const existingAddresses = await prisma.address.findMany({
      where: { customerId: customer.id }
    });

    const isFirstAddress = existingAddresses.length === 0;

    // Prepare address data based on location type
    let addressLine1Data = '';
    let addressLine2Data = '';
    let buildingData = '';
    let floorData = '';
    let apartmentData = '';
    let areaData = '';

    // Set Google address as primary if available
    if (body.googleAddress?.trim()) {
      addressLine1Data = body.googleAddress.trim();
      city = body.city || 'Bahrain';
    }

    // Add location-specific details to addressLine2
    switch (locationType) {
      case 'hotel':
        buildingData = body.hotelName?.trim() || '';
        floorData = body.roomNumber?.trim() || '';
        if (buildingData && floorData) {
          addressLine2Data = `${buildingData}, Room ${floorData}`;
          if (body.collectionMethod) {
            addressLine2Data += ` (${body.collectionMethod})`;
          }
        }
        break;

      case 'home':
        buildingData = body.house?.trim() || '';
        areaData = body.road?.trim() || '';
        if (buildingData) {
          addressLine2Data = buildingData;
          if (areaData) {
            addressLine2Data += `, ${areaData}`;
          }
          if (body.block?.trim()) {
            addressLine2Data += `, Block ${body.block.trim()}`;
          }
        }
        break;

      case 'flat':
        buildingData = body.building?.trim() || '';
        floorData = body.flatNumber?.trim() || '';
        areaData = body.road?.trim() || '';
        if (buildingData && floorData) {
          addressLine2Data = `${buildingData}`;
          if (areaData) {
            addressLine2Data += `, ${areaData}`;
          }
          if (body.block?.trim()) {
            addressLine2Data += `, Block ${body.block.trim()}`;
          }
          addressLine2Data += `, Flat ${floorData}`;
        }
        break;

      case 'office':
        buildingData = body.building?.trim() || '';
        apartmentData = body.officeNumber?.trim() || '';
        areaData = body.road?.trim() || '';
        if (buildingData && apartmentData) {
          addressLine2Data = `${buildingData}`;
          if (areaData) {
            addressLine2Data += `, ${areaData}`;
          }
          if (body.block?.trim()) {
            addressLine2Data += `, Block ${body.block.trim()}`;
          }
          addressLine2Data += `, Office ${apartmentData}`;
        }
        break;
    }

    // Create the address with proper field structure
    const newAddress = await prisma.address.create({
      data: {
        customerId: customer.id,
        label: label.trim(),
        addressLine1: addressLine1Data || addressLine2Data, // Use Google address or location details
        addressLine2: addressLine1Data && addressLine2Data ? addressLine2Data : null, // Only if both exist
        city,
        locationType,
        contactNumber: contactNumber.trim(),
        area: areaData || body.area?.trim() || null,
        building: buildingData || null,
        floor: floorData || null,
        apartment: apartmentData || null,
        landmark: body.landmark?.trim() || null,
        googleAddress: body.googleAddress?.trim() || null,
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
