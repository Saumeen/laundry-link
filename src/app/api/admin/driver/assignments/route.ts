import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin } from "@/lib/adminAuth";
import { DriverAssignmentStatus, OrderStatus } from "@prisma/client";
import { OrderTrackingService } from "@/lib/orderTracking";

interface DriverAssignmentRequest {
  orderId: number;
  driverId: number;
  assignmentType: 'pickup' | 'delivery';
  status: DriverAssignmentStatus;
  estimatedTime?: Date;
  notes?: string;
}

interface DriverAssignmentUpdateRequest {
  assignmentId: number;
  status: DriverAssignmentStatus;
  notes?: string;
  photoUrl?: string;
  photoType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const body: DriverAssignmentRequest = await request.json();
    
    const {
      orderId,
      driverId,
      assignmentType,
      status,
      estimatedTime,
      notes
    } = body;

    // Validate enum values
    const validStatuses = Object.values(DriverAssignmentStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid driver status" }, { status: 400 });
    }

    // Check if driver exists and is active
    const driver = await prisma.staff.findFirst({
      where: {
        id: driverId,
        role: {
          name: 'DRIVER'
        },
        isActive: true
      }
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found or inactive" }, { status: 404 });
    }

    // Check if assignment already exists for this order and type
    const existingAssignment = await prisma.driverAssignment.findFirst({
      where: {
        orderId,
        assignmentType
      }
    });

    if (existingAssignment) {
      return NextResponse.json({ error: "Assignment already exists for this order and type" }, { status: 400 });
    }

    // Create driver assignment
    const assignment = await prisma.driverAssignment.create({
      data: {
        orderId,
        driverId,
        assignmentType,
        status,
        estimatedTime,
        notes
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        order: {
          include: {
            customer: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: "Driver assignment created successfully",
      assignment 
    });

  } catch (error) {
    console.error("Error creating driver assignment:", error);
    return NextResponse.json(
      { error: "Failed to create driver assignment" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuthenticatedAdmin();
    const body: DriverAssignmentUpdateRequest = await request.json();
    
    const {
      assignmentId,
      status,
      notes,
      photoUrl,
      photoType
    } = body;

    if (!assignmentId || !status) {
      return NextResponse.json({ error: "Assignment ID and status are required" }, { status: 400 });
    }

    // Validate enum values
    const validStatuses = Object.values(DriverAssignmentStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid driver status" }, { status: 400 });
    }

    // Update the assignment
    const updatedAssignment = await prisma.driverAssignment.update({
      where: { id: assignmentId },
      data: {
        status,
        notes: notes || null,
        actualTime: new Date()
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        order: true,
        photos: true
      }
    });

    // --- Update Order Status if needed ---
    if (status && updatedAssignment.order) {
      let newOrderStatus: OrderStatus | undefined;
      if (updatedAssignment.assignmentType === 'pickup') {
        if (status === 'IN_PROGRESS') newOrderStatus = OrderStatus.PICKUP_IN_PROGRESS;
        else if (status === 'COMPLETED') newOrderStatus = OrderStatus.PICKUP_COMPLETED;
        else if (status === 'FAILED') newOrderStatus = OrderStatus.PICKUP_FAILED;
      } else if (updatedAssignment.assignmentType === 'delivery') {
        if (status === 'IN_PROGRESS') newOrderStatus = OrderStatus.DELIVERY_IN_PROGRESS;
        else if (status === 'COMPLETED') newOrderStatus = OrderStatus.DELIVERED;
        else if (status === 'FAILED') newOrderStatus = OrderStatus.DELIVERY_FAILED;
      }
      if (newOrderStatus) {
        await OrderTrackingService.updateOrderStatus({
          orderId: updatedAssignment.orderId,
          newStatus: newOrderStatus,
          notes,
        });
      }
    }
    // --- End update order status ---

    // If photo is provided, save it
    if (photoUrl && photoType) {
      await prisma.driverPhoto.create({
        data: {
          driverAssignmentId: assignmentId,
          photoUrl,
          photoType,
          description: notes || null
        }
      });
    }

    return NextResponse.json({ 
      message: "Driver assignment updated successfully",
      assignment: updatedAssignment 
    });

  } catch (error) {
    console.error("Error updating driver assignment:", error);
    return NextResponse.json(
      { error: "Failed to update driver assignment" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedAdmin();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as DriverAssignmentStatus;
    const driverId = searchParams.get('driverId');
    const orderId = searchParams.get('orderId');

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (driverId) {
      where.driverId = parseInt(driverId);
    }
    
    if (orderId) {
      where.orderId = parseInt(orderId);
    }

    const assignments = await prisma.driverAssignment.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        order: {
          include: {
            customer: true,
            address: true
          }
        },
        photos: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(assignments);

  } catch (error) {
    console.error("Error fetching driver assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver assignments" },
      { status: 500 }
    );
  }
} 