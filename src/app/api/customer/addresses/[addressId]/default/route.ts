// src/app/api/customer/addresses/[addressId]/default/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedCustomer, createAuthErrorResponse } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: { addressId: string } }
) {
  try {
    const { addressId } =  params;
    const addressIdInt = parseInt(addressId);
    
    if (isNaN(addressIdInt)) {
      return NextResponse.json(
        { error: "Invalid address ID" },
        { status: 400 }
      );
    }

    // Get authenticated customer
    const customer = await requireAuthenticatedCustomer();

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
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to set default address" },
      { status: 500 }
    );
  }
}
