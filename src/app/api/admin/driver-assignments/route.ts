import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

interface CreateDriverAssignmentRequest {
  orderId: number;
  driverId: number;
  assignmentType: 'pickup' | 'delivery';
  estimatedTime?: string;
  notes?: string;
}

interface UpdateDriverAssignmentRequest {
  status?: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  estimatedTime?: string;
  actualTime?: string;
  notes?: string;
}

// GET - Fetch driver assignments for an order
export async function GET(req: Request) {
  try {
    await requireAuthenticatedAdmin();
    
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const assignments = await prisma.driverAssignment.findMany({
      where: {
        orderId: parseInt(orderId),
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error("Error fetching driver assignments:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch driver assignments" },
      { status: 500 }
    );
  }
}

// POST - Create a new driver assignment
export async function POST(req: Request) {
  try {
    await requireAuthenticatedAdmin();
    
    const { orderId, driverId, assignmentType, estimatedTime, notes }: CreateDriverAssignmentRequest = await req.json();

    // Validate required fields
    if (!orderId || !driverId || !assignmentType) {
      return NextResponse.json(
        { error: "Order ID, driver ID, and assignment type are required" },
        { status: 400 }
      );
    }

    // Check if driver exists and is active
    const driver = await prisma.staff.findFirst({
      where: {
        id: driverId,
        isActive: true,
        role: {
          name: 'DRIVER',
        },
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Driver not found or not active" },
        { status: 404 }
      );
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if assignment already exists for this order and type
    const existingAssignment = await prisma.driverAssignment.findFirst({
      where: {
        orderId,
        assignmentType,
        status: {
          not: 'cancelled',
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: `A ${assignmentType} assignment already exists for this order` },
        { status: 409 }
      );
    }

    // Validation: For delivery assignments, ensure pickup has been completed first
    if (assignmentType === 'delivery') {
      const pickupAssignment = await prisma.driverAssignment.findFirst({
        where: {
          orderId,
          assignmentType: 'pickup',
          status: 'completed'
        }
      });
      
      if (!pickupAssignment) {
        return NextResponse.json(
          { error: "Cannot create delivery assignment. Pickup must be completed first." },
          { status: 400 }
        );
      }
    }

    // Create the assignment
    const assignment = await prisma.driverAssignment.create({
      data: {
        orderId,
        driverId,
        assignmentType,
        estimatedTime: estimatedTime ? new Date(estimatedTime) : null,
        notes,
        status: 'assigned',
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Driver assigned successfully",
      assignment,
    });
  } catch (error) {
    console.error("Error creating driver assignment:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to create driver assignment" },
      { status: 500 }
    );
  }
}

// PUT - Update a driver assignment
export async function PUT(req: Request) {
  try {
    await requireAuthenticatedAdmin();
    
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('id');
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const { status, estimatedTime, actualTime, notes }: UpdateDriverAssignmentRequest = await req.json();

    const assignment = await prisma.driverAssignment.update({
      where: {
        id: parseInt(assignmentId),
      },
      data: {
        ...(status && { status }),
        ...(estimatedTime && { estimatedTime: new Date(estimatedTime) }),
        ...(actualTime && { actualTime: new Date(actualTime) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Driver assignment updated successfully",
      assignment,
    });
  } catch (error) {
    console.error("Error updating driver assignment:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to update driver assignment" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel or delete a driver assignment
export async function DELETE(req: Request) {
  try {
    await requireAuthenticatedAdmin();
    
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('id');
    const action = searchParams.get('action');
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const existingAssignment = await prisma.driverAssignment.findUnique({
      where: {
        id: parseInt(assignmentId),
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Driver assignment not found" },
        { status: 404 }
      );
    }

    // If action is 'delete', actually delete the record
    if (action === 'delete') {
      await prisma.driverAssignment.delete({
        where: {
          id: parseInt(assignmentId),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Driver assignment deleted successfully",
      });
    }

    // Otherwise, cancel the assignment (set status to 'cancelled')
    // Check if the assignment can be cancelled based on its current status
    if (existingAssignment.status === 'cancelled') {
      return NextResponse.json(
        { error: "Driver assignment is already cancelled" },
        { status: 400 }
      );
    }

    if (existingAssignment.status === 'completed') {
      return NextResponse.json(
        { error: "Cannot cancel a completed driver assignment" },
        { status: 400 }
      );
    }

    // Additional business logic: Check if the order status allows cancellation
    const orderStatus = existingAssignment.order.status;
    const assignmentType = existingAssignment.assignmentType;
    
    // For pickup assignments, check if order is still in early stages
    if (assignmentType === 'pickup') {
      const nonCancellablePickupStatuses = [
        'Picked Up', 'Processing', 'Cleaning Complete', 'Quality Check', 
        'Invoice Generated', 'Driver Assigned for Delivery', 'Out for Delivery', 'Delivered'
      ];
      
      if (nonCancellablePickupStatuses.includes(orderStatus)) {
        return NextResponse.json(
          { error: `Cannot cancel pickup assignment. Order is already ${orderStatus.toLowerCase()}` },
          { status: 400 }
        );
      }
    }
    
    // For delivery assignments, check if order is still in processing stages
    if (assignmentType === 'delivery') {
      const nonCancellableDeliveryStatuses = [
        'Out for Delivery', 'Delivered'
      ];
      
      if (nonCancellableDeliveryStatuses.includes(orderStatus)) {
        return NextResponse.json(
          { error: `Cannot cancel delivery assignment. Order is already ${orderStatus.toLowerCase()}` },
          { status: 400 }
        );
      }
    }

    // Cancel the assignment
    await prisma.driverAssignment.update({
      where: {
        id: parseInt(assignmentId),
      },
      data: {
        status: 'cancelled',
      },
    });

    return NextResponse.json({
      success: true,
      message: "Driver assignment cancelled successfully",
      assignment: {
        ...existingAssignment,
        status: 'cancelled',
      },
    });
  } catch (error) {
    console.error("Error processing driver assignment:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to process driver assignment" },
      { status: 500 }
    );
  }
} 