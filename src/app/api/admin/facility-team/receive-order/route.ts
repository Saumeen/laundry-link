import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import { OrderStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const body = (await request.json()) as {
      orderId: number;
    };

    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check if order exists and is in the correct status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        driverAssignments: {
          where: {
            assignmentType: 'pickup',
            status: 'COMPLETED',
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order is in a valid status for receiving
    if (
      order.status !== OrderStatus.PICKUP_COMPLETED &&
      order.status !== OrderStatus.PICKUP_IN_PROGRESS
    ) {
      return NextResponse.json(
        {
          error:
            'Order must be in PICKUP_COMPLETED or PICKUP_IN_PROGRESS status to be received at facility',
        },
        { status: 400 }
      );
    }

    // Update order status to RECEIVED_AT_FACILITY
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.RECEIVED_AT_FACILITY },
    });

    // Create order history entry
    await prisma.orderHistory.create({
      data: {
        orderId,
        staffId: admin.id,
        action: 'status_update',
        oldValue: order.status,
        newValue: OrderStatus.RECEIVED_AT_FACILITY,
        description: 'Order received at facility',
        metadata: JSON.stringify({
          receivedBy: `${admin.firstName} ${admin.lastName}`,
          receivedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      message: 'Order marked as received at facility',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error marking order as received:', error);
    return NextResponse.json(
      { error: 'Failed to mark order as received' },
      { status: 500 }
    );
  }
}
