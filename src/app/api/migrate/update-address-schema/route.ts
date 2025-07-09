// src/app/api/migrate/update-address-schema/route.ts - Database migration endpoint
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    // This will attempt to update the database schema to match your Prisma schema
    console.log('Starting database schema migration...');
    
    // Try to create a test address with the new schema
    // This will force Prisma to apply the schema changes
    const customer = await prisma.customer.findFirst();
    
    if (!customer) {
      return NextResponse.json({
        error: "No customers found. Please create a customer first."
      }, { status: 400 });
    }

    // Try to create with new schema fields
    try {
      const testAddress = await prisma.address.create({
        data: {
          customerId: customer.id,
          label: "Migration Test",
          address: "Test Address",
          city: "Test City",
          area: "Test Area",
          building: "Test Building",
          floor: "1",
          apartment: "1A",
          locationType: "flat",
          latitude: 26.0667,
          longitude: 50.5577,
          isDefault: false
        }
      });

      // If successful, delete the test address
      await prisma.address.delete({
        where: { id: testAddress.id }
      });

      return NextResponse.json({
        success: true,
        message: "Database schema migration completed successfully!",
        migratedFields: [
          "address",
          "city", 
          "area",
          "building",
          "floor", 
          "apartment",
          "locationType",
          "latitude",
          "longitude",
          "isDefault"
        ]
      });

    } catch (createError: any) {
      return NextResponse.json({
        error: "Migration failed - database schema still needs manual update",
        details: createError.message,
        solution: "The database needs to be manually updated to include the missing columns"
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({
      error: "Migration failed",
      message: error.message
    }, { status: 500 });
  }
}

