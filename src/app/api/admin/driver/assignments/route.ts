import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import { DriverAssignmentStatus, OrderStatus } from '@prisma/client';
import { OrderTrackingService } from '@/lib/orderTracking';
import emailService from '@/lib/emailService';
import logger from '@/lib/logger';

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

// Constants for better maintainability
const TIME_WINDOWS = {
  EARLIEST_START_MINUTES: 30,
  LATEST_START_HOURS: 2,
  DEV_LATEST_START_HOURS: 24,
} as const;

const ERROR_MESSAGES = {
  INVALID_DRIVER_STATUS: 'Invalid driver status',
  DRIVER_NOT_FOUND: 'Driver not found or inactive',
  ASSIGNMENT_EXISTS: 'Assignment already exists for this order and type',
  ASSIGNMENT_NOT_FOUND: 'Assignment not found',
  ACCESS_DENIED: 'Access denied. You can only update your own assignments.',
  TIME_WINDOW_EXPIRED:
    'Cannot start assignment. Time window has expired. Please contact support.',
  PHOTO_REQUIRED: 'Photo evidence is required when marking as dropped off',
  INVALID_STATUS_TRANSITION:
    'Cannot mark as dropped off. Assignment must be in progress first.',
} as const;

// Helper functions
const validateDriverStatus = (status: DriverAssignmentStatus): boolean => {
  return Object.values(DriverAssignmentStatus).includes(status);
};

const validateTimeWindow = (
  estimatedTime: Date | null,
  assignmentType: string,
  isDev: boolean
): { isValid: boolean; error?: string } => {
  if (!estimatedTime) {
    return { isValid: true };
  }

  const now = new Date();
  const earliestStart = isDev
    ? new Date()
    : new Date(
        estimatedTime.getTime() -
          TIME_WINDOWS.EARLIEST_START_MINUTES * 60 * 1000
      );
  const latestStart = isDev
    ? new Date(
        estimatedTime.getTime() +
          TIME_WINDOWS.DEV_LATEST_START_HOURS * 60 * 60 * 1000
      )
    : new Date(
        estimatedTime.getTime() +
          TIME_WINDOWS.LATEST_START_HOURS * 60 * 60 * 1000
      );

  if (now < earliestStart) {
    return {
      isValid: false,
      error: `Cannot start ${assignmentType} yet. Earliest start time is ${earliestStart.toLocaleString()}`,
    };
  }

  if (now > latestStart) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.TIME_WINDOW_EXPIRED,
    };
  }

  return { isValid: true };
};

const getOrderStatusForAssignment = (
  assignmentType: string,
  status: DriverAssignmentStatus
): OrderStatus | undefined => {
  if (assignmentType === 'pickup') {
    switch (status) {
      case 'IN_PROGRESS':
        return OrderStatus.PICKUP_IN_PROGRESS;
      case 'COMPLETED':
        return OrderStatus.PICKUP_COMPLETED;
      case 'DROPPED_OFF':
        return OrderStatus.DROPPED_OFF;
      case 'FAILED':
        return OrderStatus.PICKUP_FAILED;
      default:
        return undefined;
    }
  } else if (assignmentType === 'delivery') {
    switch (status) {
      case 'IN_PROGRESS':
        return OrderStatus.DELIVERY_IN_PROGRESS;
      case 'COMPLETED':
        return OrderStatus.DELIVERED;
      case 'DROPPED_OFF':
        return OrderStatus.DROPPED_OFF;
      case 'FAILED':
        return OrderStatus.DELIVERY_FAILED;
      default:
        return undefined;
    }
  }
  return undefined;
};

const getStatusNotes = (
  assignmentType: string,
  status: DriverAssignmentStatus,
  notes?: string
): string => {
  if (status === 'DROPPED_OFF') {
    const baseMessage =
      assignmentType === 'pickup'
        ? 'Pickup dropped off at facility'
        : 'Delivery dropped off at customer location';
    return notes ? `${baseMessage} - ${notes}` : baseMessage;
  }
  return notes || '';
};

const sendDeliveryConfirmationEmail = async (
  assignment: any,
  orderWithInvoice: any
): Promise<void> => {
  try {
    const invoiceData = {
      totalAmount: orderWithInvoice.invoiceTotal || 0,
      items: orderWithInvoice.orderServiceMappings.map((mapping: any) => ({
        serviceName: mapping.service.displayName,
        quantity: mapping.quantity,
        unitPrice: mapping.price,
        totalPrice: mapping.price * mapping.quantity,
        notes:
          mapping.orderItems.length > 0
            ? mapping.orderItems.map((item: any) => item.itemName).join(', ')
            : undefined,
      })),
    };

    await emailService.sendDeliveryConfirmationWithInvoice(
      orderWithInvoice,
      orderWithInvoice.customer.email,
      `${orderWithInvoice.customer.firstName} ${orderWithInvoice.customer.lastName}`,
      invoiceData
    );

    logger.info(`Delivery confirmation email sent for order #${orderWithInvoice.orderNumber}`
    );
  } catch (emailError) {
    logger.error('Error sending delivery confirmation email:', emailError);
    // Don't fail the request if email fails
  }
};

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const body: DriverAssignmentRequest = await request.json();

    const { orderId, driverId, assignmentType, status, estimatedTime, notes } =
      body;

    if (!validateDriverStatus(status)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_DRIVER_STATUS },
        { status: 400 }
      );
    }

    // Check if driver exists and is active
    const driver = await prisma.staff.findFirst({
      where: {
        id: driverId,
        role: { name: 'DRIVER' },
        isActive: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.DRIVER_NOT_FOUND },
        { status: 404 }
      );
    }

    // Check if assignment already exists for this order and type
    const existingAssignment = await prisma.driverAssignment.findFirst({
      where: { orderId, assignmentType },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.ASSIGNMENT_EXISTS },
        { status: 400 }
      );
    }

    // Create driver assignment
    const assignment = await prisma.driverAssignment.create({
      data: {
        orderId,
        driverId,
        assignmentType,
        status,
        estimatedTime,
        notes,
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        order: {
          include: { customer: true },
        },
      },
    });

    // Update order status based on assignment type
    const newOrderStatus =
      assignmentType === 'pickup'
        ? OrderStatus.PICKUP_ASSIGNED
        : OrderStatus.DELIVERY_ASSIGNED;

    await OrderTrackingService.updateOrderStatus({
      orderId: assignment.orderId,
      newStatus: newOrderStatus,
      notes: `Driver assigned for ${assignmentType}`,
    });

    return NextResponse.json({
      message: 'Driver assignment created successfully',
      assignment,
    });
  } catch (error) {
    logger.error('Error creating driver assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create driver assignment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const body: DriverAssignmentUpdateRequest = await request.json();

    const { assignmentId, status, notes, photoUrl, photoType } = body;

    if (!assignmentId || !status) {
      return NextResponse.json(
        { error: 'Assignment ID and status are required' },
        { status: 400 }
      );
    }

    if (!validateDriverStatus(status)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_DRIVER_STATUS },
        { status: 400 }
      );
    }

    // Get the assignment to check time validation
    const assignment = await prisma.driverAssignment.findUnique({
      where: { id: assignmentId },
      include: { order: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.ASSIGNMENT_NOT_FOUND },
        { status: 404 }
      );
    }

    // Ensure only the assigned driver can update the assignment
    if (assignment.driverId !== admin.id) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.ACCESS_DENIED },
        { status: 403 }
      );
    }

    // Time validation for starting assignments
    if (status === 'IN_PROGRESS') {
      const isDev = process.env.NODE_ENV === 'development';
      const timeValidation = validateTimeWindow(
        assignment.estimatedTime ? new Date(assignment.estimatedTime) : null,
        assignment.assignmentType,
        isDev
      );

      if (!timeValidation.isValid) {
        return NextResponse.json(
          { error: timeValidation.error },
          { status: 400 }
        );
      }
    }

    // Validation for DROPPED_OFF status
    if (status === 'DROPPED_OFF') {
      if (assignment.status !== 'COMPLETED') {
        return NextResponse.json(
          {
            error: `${ERROR_MESSAGES.INVALID_STATUS_TRANSITION} Current status: ${assignment.status}`,
          },
          { status: 400 }
        );
      }
    }

    // Update the assignment
    const updatedAssignment = await prisma.driverAssignment.update({
      where: { id: assignmentId },
      data: {
        status,
        notes: notes || null,
        actualTime: new Date(),
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        order: {
          include: { customer: true },
        },
        photos: true,
      },
    });

    // Update Order Status if needed
    if (status && updatedAssignment.order) {
      const newOrderStatus = getOrderStatusForAssignment(
        updatedAssignment.assignmentType,
        status
      );

      if (newOrderStatus) {
        const statusNotes = getStatusNotes(
          updatedAssignment.assignmentType,
          status,
          notes
        );

        await OrderTrackingService.updateOrderStatusWithEmail({
          orderId: updatedAssignment.orderId,
          newStatus: newOrderStatus,
          notes: statusNotes,
          shouldSendEmail: true,
        });
      }
    }

    // If photo is provided, save it
    if (photoUrl && photoType) {
      await prisma.driverPhoto.create({
        data: {
          driverAssignmentId: assignmentId,
          photoUrl,
          photoType,
          description: notes || null,
        },
      });
    }

    // Log dropped off status for audit purposes
    if (status === 'DROPPED_OFF') {
      logger.info(`Order #${updatedAssignment.order?.orderNumber} marked as dropped off by driver ${admin.firstName} ${admin.lastName} for ${updatedAssignment.assignmentType}`
      );
    }



    // Send delivery confirmation email with invoice when delivery is completed
    if (
      updatedAssignment.assignmentType === 'delivery' &&
      status === 'COMPLETED' &&
      updatedAssignment.order?.customer
    ) {
      const orderWithInvoice = await prisma.order.findUnique({
        where: { id: updatedAssignment.orderId },
        include: {
          customer: true,
          orderServiceMappings: {
            include: {
              service: true,
              orderItems: true,
            },
          },
        },
      });

      if (orderWithInvoice && orderWithInvoice.customer) {
        await sendDeliveryConfirmationEmail(
          updatedAssignment,
          orderWithInvoice
        );
      }
    }

    return NextResponse.json({
      message: 'Driver assignment updated successfully',
      assignment: updatedAssignment,
    });
  } catch (error) {
    logger.error('Error updating driver assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update driver assignment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();

    // Ensure the user is a driver
    if (admin.role !== 'DRIVER') {
      return NextResponse.json(
        { error: 'Access denied. Driver role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as DriverAssignmentStatus;
    const orderId = searchParams.get('orderId');
    const showCompleted = searchParams.get('showCompleted') === 'true';

    const where: Record<string, unknown> = {
      driverId: admin.id, // Only show assignments for the current driver
    };

    if (status) {
      where.status = status;
    }

    if (orderId) {
      where.orderId = parseInt(orderId);
    }

    // Filter out completed, dropped off, and failed assignments unless explicitly requested
    if (!showCompleted) {
      where.status = {
        notIn: [
          DriverAssignmentStatus.DROPPED_OFF,
          DriverAssignmentStatus.FAILED,
        ],
      };
    }

    // Filter out delivery assignments where order status is DELIVERED and delivery is completed
    where.OR = [
      // Include all non-delivery assignments
      { assignmentType: { not: 'delivery' } },
      // Include delivery assignments that are not completed
      {
        assignmentType: 'delivery',
        status: { not: 'COMPLETED' },
      },
      // Include delivery assignments that are completed but order is not delivered
      {
        assignmentType: 'delivery',
        status: 'COMPLETED',
        order: {
          status: { not: 'DELIVERED' },
        },
      },
    ];

    const assignments = await prisma.driverAssignment.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        order: {
          include: {
            customer: true,
            address: true,
          },
        },
        photos: true,
      },
      orderBy: [
        { estimatedTime: 'asc' }, // Sort by estimated time for today's assignments
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(assignments);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error fetching driver assignments:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch driver assignments' },
      { status: 500 }
    );
  }
}
