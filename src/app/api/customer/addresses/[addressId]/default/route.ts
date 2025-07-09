// src/app/api/customer/addresses/[addressId]/default/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { addressId: string } }
) {
  try {
    const { addressId } = params;
    const { searchParams } = new URL(req.url);
    const customerEmail = searchParams.get('email');

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }

    const addressIdInt = parseInt(addressId);
    if (isNaN(addressIdInt)) {
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

    // Verify address belongs to customer
    const targetAddress = await prisma.address.findFirst({
      where: {
        id: addressIdInt,
        customerId: customer.id
      }
    });

    if (!targetAddress) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Remove default from all other addresses
      await tx.address.updateMany({
        where: {
          customerId: customer.id,
          id: { not: addressIdInt }
        },
        data: { isDefault: false }
      });

      // Set this address as default
      await tx.address.update({
        where: { id: addressIdInt },
        data: { isDefault: true }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Default address updated successfully"
    });

  } catch (error) {
    console.error("Error setting default address:", error);
    return NextResponse.json(
      { error: "Failed to set default address" },
      { status: 500 }
    );
  }
}
