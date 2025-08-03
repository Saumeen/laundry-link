import { NextResponse } from 'next/server';
import { OrderTrackingService } from '@/lib/orderTracking';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import { DriverAssignmentStatus } from '@prisma/client';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    // Get authenticated admin from session
    const admin = await requireAuthenticatedAdmin();

    const body = await req.json();
    const { orderId, action, photoUrl, notes } = body as {
      orderId: number;
      action:
        | 'start_pickup'
        | 'complete_pickup'
        | 'fail_pickup'
        | 'drop_off'
        | 'start_delivery'
        | 'complete_delivery'
        | 'fail_delivery';
      photoUrl?: string;
      notes?: string;
    };

    if (!orderId || !action) {
      return NextResponse.json(
        { error: 'Order ID and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = [
      'start_pickup',
      'complete_pickup',
      'fail_pickup',
      'drop_off',
      'start_delivery',
      'complete_delivery',
      'fail_delivery',
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Map action to driver assignment status
    let assignmentStatus: DriverAssignmentStatus;
    let assignmentType: 'pickup' | 'delivery';

    switch (action) {
      case 'start_pickup':
        assignmentStatus = 'IN_PROGRESS';
        assignmentType = 'pickup';
        break;
      case 'complete_pickup':
        assignmentStatus = 'COMPLETED';
        assignmentType = 'pickup';
        break;
      case 'fail_pickup':
        assignmentStatus = 'FAILED';
        assignmentType = 'pickup';
        break;
      case 'drop_off':
        assignmentStatus = 'COMPLETED';
        assignmentType = 'pickup';
        break;
      case 'start_delivery':
        assignmentStatus = 'IN_PROGRESS';
        assignmentType = 'delivery';
        break;
      case 'complete_delivery':
        assignmentStatus = 'COMPLETED';
        assignmentType = 'delivery';
        break;
      case 'fail_delivery':
        assignmentStatus = 'FAILED';
        assignmentType = 'delivery';
        break;
      default:
        assignmentStatus = 'ASSIGNED';
        assignmentType = 'pickup';
    }

    // Update driver assignment status
    const assignment = await prisma.driverAssignment.findFirst({
      where: {
        orderId,
        driverId: admin.id,
        assignmentType,
      },
    });

    if (assignment) {
      await prisma.driverAssignment.update({
        where: { id: assignment.id },
        data: {
          status: assignmentStatus,
          notes: notes || null,
          actualTime: new Date(),
        },
      });
    }

    // Store photo if provided
    if (photoUrl && assignment) {
      await prisma.driverPhoto.create({
        data: {
          driverAssignmentId: assignment.id,
          photoUrl,
          photoType: `${action}_photo`,
          description: `Photo taken during ${action.replace('_', ' ')}`,
        },
      });
    }

    // Handle driver action using the existing OrderTrackingService
    const result = await OrderTrackingService.handleDriverAction({
      orderId,
      driverId: admin.id, // Get driver ID from backend session
      action,
      photoUrl,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to handle driver action' },
        { status: 400 }
      );
    }

    logger.info(`Driver action completed: ${action} for order ${orderId} by driver ${admin.id}`
    );

    return NextResponse.json({
      message: 'Driver action completed successfully',
      action,
      orderId,
    });
  } catch (error) {
    logger.error('Error handling driver action:', error);
    return NextResponse.json(
      { error: 'Failed to handle driver action' },
      { status: 500 }
    );
  }
}
