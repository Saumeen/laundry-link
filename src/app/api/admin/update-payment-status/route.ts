import { NextResponse } from 'next/server';
import { OrderTrackingService } from '@/lib/orderTracking';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import { recalculateOrderPaymentStatus } from '@/lib/utils/paymentUtils';

export async function POST(req: Request) {
  try {
    // Check authentication - only admins can update payment status
    const admin = await requireAuthenticatedAdmin();
    
    const body = await req.json();
    const { orderId, paymentStatus, amount, notes } = body as {
      orderId: number;
      paymentStatus: PaymentStatus;
      amount?: number;
      staffId?: number;
      notes?: string;
    };

    if (!orderId || !paymentStatus) {
      return NextResponse.json(
        { error: 'Order ID and payment status are required' },
        { status: 400 }
      );
    }

    // If payment status is PAID, amount is required
    if (paymentStatus === PaymentStatus.PAID && (!amount || amount <= 0)) {
      return NextResponse.json(
        { error: 'Payment amount is required when marking as PAID' },
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

    // Get current order to check existing status
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentRecords: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate current payment totals
    const currentTotalPaid = currentOrder.paymentRecords
      .filter(p => p.paymentStatus === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const invoiceTotal = currentOrder.invoiceTotal || 0;
    const outstandingAmount = invoiceTotal - currentTotalPaid;

    // Validate amount if provided
    if (amount) {
      if (amount <= 0) {
        return NextResponse.json(
          { error: 'Payment amount must be greater than 0' },
          { status: 400 }
        );
      }

      if (amount > outstandingAmount) {
        return NextResponse.json(
          { error: `Payment amount (${amount}) cannot exceed outstanding amount (${outstandingAmount})` },
          { status: 400 }
        );
      }
    }

    // Create new payment record instead of updating existing ones
    let newPaymentRecord = null;
    if (amount && amount > 0) {
      // Use CASH as payment method for manual entries
      // Payment method will be stored in metadata for reference
      const paymentMethodType = PaymentMethod.CASH;
      
      newPaymentRecord = await prisma.paymentRecord.create({
        data: {
          orderId: orderId,
          customerId: currentOrder.customerId,
          amount: amount,
          currency: 'BHD',
          paymentMethod: paymentMethodType,
          paymentStatus: paymentStatus,
          description: notes || `Manual payment entry - ${paymentStatus}`,
          processedAt: paymentStatus === PaymentStatus.PAID ? new Date() : null,
          metadata: JSON.stringify({
            manuallyAdded: true,
            addedBy: admin.id,
            addedAt: new Date().toISOString(),
            notes: notes || null,
            entryType: 'MANUAL',
          }),
        },
      });

      logger.info(`Created new payment record ${newPaymentRecord.id} for order ${orderId}: ${amount} BHD, status: ${paymentStatus}`);
    }

    // Recalculate order payment status based on all payment records (including the new one)
    await recalculateOrderPaymentStatus(orderId);

    // Get updated order to check final payment status
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        paymentRecords: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated order' },
        { status: 500 }
      );
    }

    // Add order history entry for audit trail
    const currentStatus = currentOrder.paymentStatus;
    await prisma.orderHistory.create({
      data: {
        orderId: orderId,
        staffId: admin.id,
        action: 'PAYMENT_MANUAL_ADD',
        oldValue: currentStatus,
        newValue: updatedOrder.paymentStatus,
        description: amount 
          ? `Manual payment of ${amount} BHD added (${paymentStatus})${notes ? `: ${notes}` : ''}`
          : `Payment status manually updated from ${currentStatus} to ${paymentStatus}${notes ? `: ${notes}` : ''}`,
        metadata: JSON.stringify({
          addedBy: admin.id,
          adminEmail: admin.email,
          amount: amount || null,
          paymentStatus: paymentStatus,
          paymentRecordId: newPaymentRecord?.id || null,
          notes: notes || null,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // If payment is received and order is in processing completed status, update to ready for delivery
    if (updatedOrder.paymentStatus === PaymentStatus.PAID) {
      await OrderTrackingService.checkPaymentAndUpdateStatus(orderId);
    }

    logger.info(`Manual payment added for order ${orderId} by admin ${admin.id}`, {
      orderId,
      amount: amount || 0,
      paymentStatus,
      paymentRecordId: newPaymentRecord?.id || null,
      oldOrderStatus: currentStatus,
      newOrderStatus: updatedOrder.paymentStatus,
      adminId: admin.id,
      notes: notes || 'No notes provided',
    });

    return NextResponse.json({
      message: amount 
        ? `Payment of ${amount} BHD added successfully`
        : 'Payment status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    logger.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
