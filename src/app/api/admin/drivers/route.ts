import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

// GET - Fetch all active drivers
export async function GET(req: Request) {
  try {
    await requireAuthenticatedAdmin();
    
    const drivers = await prisma.staff.findMany({
      where: {
        isActive: true,
        role: {
          name: 'DRIVER',
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      drivers,
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 }
    );
  }
} 