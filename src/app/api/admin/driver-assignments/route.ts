import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';
import { OrderStatus } from '@prisma/client';
import { OrderTrackingService } from '@/lib/orderTracking';

interface CreateDriverAssignmentRequest {
  orderId: number;
  driverId: number;
  assignmentType: 'pickup' | 'delivery';
  estimatedTime?: string;
  notes?: string;
}

interface UpdateDriverAssignmentRequest {
  status?:
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'DROPPED_OFF'
    | 'CANCELLED'
    | 'RESCHEDULED'
    | 'FAILED';
  estimatedTime?: string;
  actualTime?: string;
  notes?: string;
}

interface ReassignDriverAssignmentRequest {
  assignmentId: string;
  newDriverId: string;
  estimatedTime?: string;
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
        { error: 'Order ID is required' },
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
    console.error('Error fetching driver assignments:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to fetch driver assignments' },
      { status: 500 }
    );
  }
}

// POST - Create a new driver assignment
export async function POST(req: Request) {
  try {
    await requireAuthenticatedAdmin();

    const {
      orderId,
      driverId,
      assignmentType,
      estimatedTime,
      notes,
    }: CreateDriverAssignmentRequest = await req.json();

    // Validate required fields
    if (!orderId || !driverId || !assignmentType) {
      return NextResponse.json(
        { error: 'Order ID, driver ID, and assignment type are required' },
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
        { error: 'Driver not found or not active' },
        { status: 404 }
      );
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if assignment already exists for this order and type
    const existingAssignment = await prisma.driverAssignment.findFirst({
      where: {
        orderId,
        assignmentType,
        status: {
          not: 'CANCELLED',
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        {
          error: `A ${assignmentType} assignment already exists for this order`,
        },
        { status: 409 }
      );
    }

    // Validation: For delivery assignments, en sure pickup has been completed first
    if (assignmentType === 'delivery') {
      const pickupAssignment = await prisma.driverAssignment.findFirst({
        where: {
          orderId,
          assignmentType: 'pickup',
          status: 'COMPLETED',
        },
      });

      if (!pickupAssignment) {
        return NextResponse.json(
          {
            error:
              'Cannot create delivery assignment. Pickup must be completed first.',
          },
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
        status: 'ASSIGNED',
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

    // Update order status based on assignment type
    let newOrderStatus: OrderStatus;
    if (assignmentType === 'pickup') {
      newOrderStatus = OrderStatus.PICKUP_ASSIGNED;
    } else if (assignmentType === 'delivery') {
      newOrderStatus = OrderStatus.DELIVERY_ASSIGNED;
    } else {
      newOrderStatus = OrderStatus.PICKUP_ASSIGNED; // fallback
    }

    await OrderTrackingService.updateOrderStatus({
      orderId: assignment.orderId,
      newStatus: newOrderStatus,
      notes: `Driver assigned for ${assignmentType}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Driver assigned successfully',
      assignment,
    });
  } catch (error) {
    console.error('Error creating driver assignment:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to create driver assignment' },
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
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    const {
      status,
      estimatedTime,
      actualTime,
      notes,
    }: UpdateDriverAssignmentRequest = await req.json();

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
        order: true,
      },
    });

    // --- Update Order Status if needed ---
    if (status && assignment.order) {
      let newOrderStatus: OrderStatus | undefined;
      if (assignment.assignmentType === 'pickup') {
        if (status === 'IN_PROGRESS')
          newOrderStatus = OrderStatus.PICKUP_IN_PROGRESS;
        else if (status === 'COMPLETED')
          newOrderStatus = OrderStatus.PICKUP_COMPLETED;
        else if (status === 'DROPPED_OFF')
          newOrderStatus = OrderStatus.DROPPED_OFF;
        else if (status === 'FAILED')
          newOrderStatus = OrderStatus.PICKUP_FAILED;
      } else if (assignment.assignmentType === 'delivery') {
        if (status === 'IN_PROGRESS')
          newOrderStatus = OrderStatus.DELIVERY_IN_PROGRESS;
        else if (status === 'COMPLETED') newOrderStatus = OrderStatus.DELIVERED;
        else if (status === 'DROPPED_OFF')
          newOrderStatus = OrderStatus.DROPPED_OFF;
        else if (status === 'FAILED')
          newOrderStatus = OrderStatus.DELIVERY_FAILED;
      }
      if (newOrderStatus) {
        await OrderTrackingService.updateOrderStatus({
          orderId: assignment.orderId,
          newStatus: newOrderStatus,
          notes,
        });
      }
    }
    // --- End update order status ---

    return NextResponse.json({
      success: true,
      message: 'Driver assignment updated successfully',
      assignment,
    });
  } catch (error) {
    console.error('Error updating driver assignment:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to update driver assignment' },
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
        { error: 'Assignment ID is required' },
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
        { error: 'Driver assignment not found' },
        { status: 404 }
      );
    }

    // If action is 'delete', actually delete the record
    if (action === 'delete') {
      // Determine what status to revert to based on assignment type and current order status
      let revertStatus: OrderStatus | undefined;

      if (
        existingAssignment.assignmentType === 'pickup' &&
        existingAssignment.order.status === OrderStatus.PICKUP_ASSIGNED
      ) {
        revertStatus = OrderStatus.CONFIRMED;
      } else if (
        existingAssignment.assignmentType === 'delivery' &&
        existingAssignment.order.status === OrderStatus.DELIVERY_ASSIGNED
      ) {
        revertStatus = OrderStatus.READY_FOR_DELIVERY;
      }

      // Delete the assignment
      await prisma.driverAssignment.delete({
        where: {
          id: parseInt(assignmentId),
        },
      });

      // Revert order status if needed
      if (revertStatus) {
        await OrderTrackingService.updateOrderStatus({
          orderId: existingAssignment.orderId,
          newStatus: revertStatus,
          notes: `Driver assignment deleted - reverted to ${revertStatus.replace(/_/g, ' ').toLowerCase()}`,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Driver assignment deleted successfully',
      });
    }

    // Otherwise, cancel the assignment (set status to 'cancelled')
    // Check if the assignment can be cancelled based on its current status
    if (existingAssignment.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Driver assignment is already cancelled' },
        { status: 400 }
      );
    }

    if (existingAssignment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed driver assignment' },
        { status: 400 }
      );
    }

    // Additional business logic: Check if the order status allows cancellation
    const orderStatus = existingAssignment.order.status;
    const assignmentType = existingAssignment.assignmentType;

    // For pickup assignments, check if order is still in early stages
    if (assignmentType === 'pickup') {
      const nonCancellablePickupStatuses: OrderStatus[] = [
        OrderStatus.PICKUP_COMPLETED,
        OrderStatus.RECEIVED_AT_FACILITY,
        OrderStatus.PROCESSING_STARTED,
        OrderStatus.PROCESSING_COMPLETED,
        OrderStatus.QUALITY_CHECK,
        OrderStatus.READY_FOR_DELIVERY,
        OrderStatus.DELIVERY_ASSIGNED,
        OrderStatus.DELIVERY_IN_PROGRESS,
        OrderStatus.DELIVERED,
      ];

      if (nonCancellablePickupStatuses.includes(orderStatus)) {
        return NextResponse.json(
          {
            error: `Cannot cancel pickup assignment. Order is already ${orderStatus.replace(/_/g, ' ').toLowerCase()}`,
          },
          { status: 400 }
        );
      }
    }

    // For delivery assignments, check if order is still in processing stages
    if (assignmentType === 'delivery') {
      const nonCancellableDeliveryStatuses: OrderStatus[] = [
        OrderStatus.DELIVERY_IN_PROGRESS,
        OrderStatus.DELIVERED,
      ];

      if (nonCancellableDeliveryStatuses.includes(orderStatus)) {
        return NextResponse.json(
          {
            error: `Cannot cancel delivery assignment. Order is already ${orderStatus.replace(/_/g, ' ').toLowerCase()}`,
          },
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
        status: 'CANCELLED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Driver assignment cancelled successfully',
      assignment: {
        ...existingAssignment,
        status: 'CANCELLED',
      },
    });
  } catch (error) {
    console.error('Error processing driver assignment:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to process driver assignment' },
      { status: 500 }
    );
  }
}

// PATCH - Reassign failed driver assignment to a new driver
export async function PATCH(req: Request) {
  try {
    await requireAuthenticatedAdmin();

    const {
      assignmentId,
      newDriverId,
      estimatedTime,
      notes,
    }: ReassignDriverAssignmentRequest = await req.json();

    if (!assignmentId || !newDriverId) {
      return NextResponse.json(
        { error: 'Assignment ID and new driver ID are required' },
        { status: 400 }
      );
    }

    // Get the existing assignment
    const existingAssignment = await prisma.driverAssignment.findUnique({
      where: { id: parseInt(assignmentId) },
      include: {
        order: true,
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

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Driver assignment not found' },
        { status: 404 }
      );
    }

    // Check if the assignment is in a failed state
    if (existingAssignment.status !== 'FAILED') {
      return NextResponse.json(
        { error: 'Only failed assignments can be reassigned' },
        { status: 400 }
      );
    }

    // Check if the new driver exists and is active
    const newDriver = await prisma.staff.findFirst({
      where: {
        id: parseInt(newDriverId.toString()),
        isActive: true,
        role: {
          name: 'DRIVER',
        },
      },
    });

    if (!newDriver) {
      return NextResponse.json(
        { error: 'New driver not found or not active' },
        { status: 404 }
      );
    }

    // Check if there's already an active assignment for this order and type
    const activeAssignment = await prisma.driverAssignment.findFirst({
      where: {
        orderId: existingAssignment.orderId,
        assignmentType: existingAssignment.assignmentType,
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS'],
        },
      },
    });

    if (activeAssignment) {
      return NextResponse.json(
        {
          error:
            'There is already an active assignment for this order and type',
        },
        { status: 409 }
      );
    }

    // Update the assignment with new driver and reset status
    const updatedAssignment = await prisma.driverAssignment.update({
      where: { id: parseInt(assignmentId) },
      data: {
        driverId: parseInt(newDriverId.toString()),
        status: 'ASSIGNED',
        estimatedTime: estimatedTime
          ? new Date(estimatedTime)
          : existingAssignment.estimatedTime,
        notes: notes || existingAssignment.notes,
        actualTime: null, // Reset actual time since it's a new assignment
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
        order: true,
      },
    });

    // Update order status based on assignment type
    let newOrderStatus: OrderStatus;
    if (updatedAssignment.assignmentType === 'pickup') {
      newOrderStatus = OrderStatus.PICKUP_ASSIGNED;
    } else if (updatedAssignment.assignmentType === 'delivery') {
      newOrderStatus = OrderStatus.DELIVERY_ASSIGNED;
    } else {
      newOrderStatus = OrderStatus.PICKUP_ASSIGNED; // fallback
    }

    await OrderTrackingService.updateOrderStatus({
      orderId: updatedAssignment.orderId,
      newStatus: newOrderStatus,
      notes: `Driver reassigned for ${updatedAssignment.assignmentType} - Previous driver: ${existingAssignment.driver.firstName} ${existingAssignment.driver.lastName}, New driver: ${updatedAssignment.driver.firstName} ${updatedAssignment.driver.lastName}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Driver assignment reassigned successfully',
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error('Error reassigning driver assignment:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to reassign driver assignment' },
      { status: 500 }
    );
  }
}
