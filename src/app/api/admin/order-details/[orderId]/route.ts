// src/app/api/admin/order-details/[orderId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';
import { formatTimeSlotRange } from '@/lib/utils/timezone';

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

    // Calculate payment summary on the backend
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

/**
 * Calculate payment summary from payment records
 */
function calculatePaymentSummary(paymentRecords: any[], invoiceTotal: number) {
  // Separate original payments from refund payments
  const originalPayments = paymentRecords.filter(payment => 
    !payment.metadata || !JSON.parse(payment.metadata || '{}').isRefund
  );
  
  const refundPayments = paymentRecords.filter(payment => 
    payment.metadata && JSON.parse(payment.metadata || '{}').isRefund
  );

  // Calculate total paid from original payments
  const totalPaid = originalPayments
    .filter(payment => payment.paymentStatus === 'PAID')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate total refunded from refund payment records
  const totalRefunded = refundPayments
    .filter(payment => payment.paymentStatus === 'PAID')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate total pending from original payments
  const totalPending = originalPayments
    .filter(payment => payment.paymentStatus === 'PENDING')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate total failed from original payments
  const totalFailed = originalPayments
    .filter(payment => payment.paymentStatus === 'FAILED')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const availableForRefund = totalPaid - totalRefunded;
  const netAmountPaid = totalPaid - totalRefunded;
  const outstandingAmount = invoiceTotal - netAmountPaid;

  return {
    totalPaid,
    totalRefunded,
    totalPending,
    totalFailed,
    availableForRefund,
    netAmountPaid,
    outstandingAmount,
    paymentRecordsCount: paymentRecords.length,
    invoiceTotal
  };
}
