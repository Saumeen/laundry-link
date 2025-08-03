import { NextResponse } from 'next/server';
import { OrderTrackingService } from '@/lib/orderTracking';
import { PaymentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, paymentStatus } = body as {
      orderId: number;
      paymentStatus: PaymentStatus;
      staffId?: number;
      notes?: string;
    };

    if (!orderId || !paymentStatus) {
      return NextResponse.json(
        { error: 'Order ID and payment status are required' },
        { status: 400 }
      );
    }

    // Validate payment status
    const validPaymentStatuses = Object.values(PaymentStatus);
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      );
    }

    // Update payment status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        updatedAt: new Date(),
      },
      include: {
        customer: true,
      },
    });

    // If payment is received and order is in processing completed status, update to ready for delivery
    if (paymentStatus === PaymentStatus.PAID) {
      await OrderTrackingService.checkPaymentAndUpdateStatus(orderId);
    }

    logger.info(`Payment status updated for order ${orderId}: ${paymentStatus}`
    );

    return NextResponse.json({
      message: 'Payment status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    logger.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
