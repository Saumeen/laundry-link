import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

// Type definitions for request body
interface UpdateAssignmentBody {
  assignmentId: number;
  status: string;
  notes?: string;
  photoUrl?: string;
  photoType?: string;
  latitude?: number;
  longitude?: number;
}

// GET - Fetch driver assignments for the logged-in driver
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    
    // Ensure the user is a driver
    if (admin.role !== "DRIVER") {
      return NextResponse.json({ error: "Access denied. Driver role required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assignmentType = searchParams.get("type");

    const whereClause: any = {
      driverId: admin.id,
    };

    if (status) {
      whereClause.status = status;
    }

    if (assignmentType) {
      whereClause.assignmentType = assignmentType;
    }

    const assignments = await prisma.driverAssignment.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            customer: true,
            address: true,
          },
        },
        photos: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching driver assignments:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

// POST - Update driver assignment status
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    
    // Ensure the user is a driver
    if (admin.role !== "DRIVER") {
      return NextResponse.json({ error: "Access denied. Driver role required." }, { status: 403 });
    }

    const body = await request.json() as UpdateAssignmentBody;
    const { assignmentId, status, notes, photoUrl, photoType, latitude, longitude } = body;

    // Verify the assignment belongs to this driver
    const assignment = await prisma.driverAssignment.findFirst({
      where: {
        id: assignmentId,
        driverId: admin.id,
      },
      include: {
        order: {
          include: {
            driverAssignments: {
              where: {
                assignmentType: 'pickup'
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Validation: For delivery assignments, ensure pickup has been completed first
    if (assignment.assignmentType === 'delivery') {
      const pickupAssignment = assignment.order.driverAssignments.find(
        da => da.assignmentType === 'pickup'
      );
      
      if (!pickupAssignment) {
        return NextResponse.json({ 
          error: "Cannot start delivery. Pickup assignment not found for this order." 
        }, { status: 400 });
      }
      
      if (pickupAssignment.status !== 'completed') {
        return NextResponse.json({ 
          error: "Cannot start delivery. Pickup must be completed first. Current pickup status: " + pickupAssignment.status 
        }, { status: 400 });
      }
    }

    // Update assignment status
    const updatedAssignment = await prisma.driverAssignment.update({
      where: { id: assignmentId },
      data: {
        status,
        notes,
        actualTime: status === "completed" ? new Date() : undefined,
      },
    });

    // Add photo if provided
    if (photoUrl && photoType) {
      await prisma.driverPhoto.create({
        data: {
          driverAssignmentId: assignmentId,
          photoUrl,
          photoType,
          description: notes,
          latitude,
          longitude,
        },
      });
    }

    // Create order update
    await prisma.orderUpdate.create({
      data: {
        orderId: assignment.orderId,
        staffId: admin.id,
        status: `${assignment.assignmentType.toUpperCase()}: ${status}`,
        notes,
      },
    });

    return NextResponse.json({ 
      success: true, 
      assignment: updatedAssignment 
    });
  } catch (error) {
    console.error("Error updating driver assignment:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
} 