// src/app/api/admin/order-details/[orderId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';
import { formatTimeSlotRange } from '@/lib/utils/timezone';
import { calculatePaymentSummary } from '@/lib/utils/paymentUtils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const { orderId } = await params;
    const orderIdOrNumber = orderId;
    const isNumeric = !isNaN(Number(orderIdOrNumber)) && orderIdOrNumber !== '';

    if (!orderIdOrNumber) {
      return NextResponse.json(
        { error: 'Invalid order ID or order number' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: isNumeric
        ? { id: parseInt(orderIdOrNumber) }
        : { orderNumber: orderIdOrNumber },
      include: {
        customer: {
          include: {
            wallet: true,
          },
        },
        address: true,
        paymentRecords: {
          include: {
            walletTransaction: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true,
          },
        },
        orderProcessing: {
          include: {
            staff: true,
            processingItems: {
              include: {
                orderServiceMapping: {
                  include: {
                    service: true,
                  },
                },
                processingItemDetails: {
                  include: {
                    orderItem: true,
                  },
                },
              },
            },
            issueReports: {
              include: {
                staff: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        driverAssignments: {
          include: {
            driver: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Calculate payment summary on the backend using shared utility
    const paymentSummary = calculatePaymentSummary(order.paymentRecords, order.invoiceTotal || 0);

    // Map the time fields to match frontend expectations with Bahrain timezone
    const mappedOrder = {
      ...order,
      pickupTime: order.pickupStartTime,
      deliveryTime: order.deliveryStartTime,
      pickupTimeSlot: formatTimeSlotRange(
        order.pickupStartTime,
        order.pickupEndTime
      ),
      deliveryTimeSlot: formatTimeSlotRange(
        order.deliveryStartTime,
        order.deliveryEndTime
      ),
      paymentSummary, // Add the calculated payment summary
    };

    return NextResponse.json({ order: mappedOrder });
  } catch (error) {
    logger.error('Error fetching order details:', error || 'Unknown error');

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

