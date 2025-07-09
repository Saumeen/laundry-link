// src/app/api/debug/database-structure/route.ts - Debug endpoint to check actual database
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Try to get the first address to see what fields exist
    const firstAddress = await prisma.address.findFirst();
    
    if (firstAddress) {
      return NextResponse.json({
        message: "Found address record",
        fields: Object.keys(firstAddress),
        sampleData: firstAddress
      });
    } else {
      // If no addresses exist, try to create a minimal one to see what fields are required
      try {
        // First get a customer to use
        const customer = await prisma.customer.findFirst();
        if (!customer) {
          return NextResponse.json({
            error: "No customers found. Please create a customer first."
          });
        }

        // Try to create with minimal fields to see what's required
        const testAddress = await prisma.address.create({
          data: {
            customerId: customer.id,
            label: "Test Address"
            // We'll see what other fields are required from the error
          }
        });

        // If successful, delete it and return the structure
        await prisma.address.delete({
          where: { id: testAddress.id }
        });

        return NextResponse.json({
          message: "Successfully created test address",
          fields: Object.keys(testAddress),
          requiredFields: "All fields were accepted"
        });

      } catch (createError: any) {
        return NextResponse.json({
          message: "Error creating test address - this shows required fields",
          error: createError.message,
          code: createError.code
        });
      }
    }

  } catch (error: any) {
    return NextResponse.json({
      error: "Database error",
      message: error.message,
      code: error.code
    });
  }
}

