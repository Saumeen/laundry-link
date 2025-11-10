import { NextResponse } from 'next/server';
import { OrderTrackingService } from '@/lib/orderTracking';
import { PaymentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { requireAdminRole, createAdminAuthErrorResponse, createAdminForbiddenErrorResponse } from '@/lib/adminAuth';
import { recalculateOrderPaymentStatus, calculatePaymentSummary } from '@/lib/utils/paymentUtils';

export async function POST(req: Request) {
  try {
    // Check authentication - only super admins can update payment records
    const admin = await requireAdminRole('SUPER_ADMIN');
    
    const body = await req.json();
    const { paymentRecordId, amount, paymentStatus, notes } = body as {
      paymentRecordId: number;
      amount?: number;
      paymentStatus?: PaymentStatus;
      notes?: string;
    };

    if (!paymentRecordId) {
      return NextResponse.json(
        { error: 'Payment record ID is required' },
        { status: 400 }
      );
    }

    // Get the payment record
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { id: paymentRecordId },
      include: {
        order: {
          include: {
            paymentRecords: true,
          },
        },
      },
    });

    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    if (!paymentRecord.order) {
      return NextResponse.json(
        { error: 'Order not found for this payment record' },
        { status: 404 }
      );
    }

    const orderId = paymentRecord.orderId!;
    const oldAmount = paymentRecord.amount;
    const oldStatus = paymentRecord.paymentStatus;

    // Validate amount if provided
    if (amount !== undefined) {
      if (amount <= 0) {
        return NextResponse.json(
          { error: 'Payment amount must be greater than 0' },
          { status: 400 }
        );
      }
    }

    // Validate payment status if provided
    if (paymentStatus !== undefined) {
      const validPaymentStatuses = Object.values(PaymentStatus);
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          { error: 'Invalid payment status' },
          { status: 400 }
        );
      }
    }

    // Check if this is a refund payment
    let isRefund = false;
    try {
      const metadata = paymentRecord.metadata ? JSON.parse(paymentRecord.metadata) : {};
      isRefund = metadata.isRefund === true;
    } catch {
      // If metadata parsing fails, treat as original payment
    }

    // Calculate current payment summary BEFORE update
    const invoiceTotal = paymentRecord.order.invoiceTotal || 0;
    const currentPaymentSummary = calculatePaymentSummary(paymentRecord.order.paymentRecords, invoiceTotal);

    // Calculate what the new values would be
    const newAmount = amount !== undefined ? amount : oldAmount;
    const newStatus = paymentStatus !== undefined ? paymentStatus : oldStatus;

    // If updating amount or status, we need to recalculate the impact
    // For now, we'll update the record and then recalculate the order status
    // The validation will happen after recalculation

    // Update payment record
    const updatedPaymentRecord = await prisma.paymentRecord.update({
      where: { id: paymentRecordId },
      data: {
        ...(amount !== undefined && { amount: newAmount }),
        ...(paymentStatus !== undefined && { 
          paymentStatus: newStatus,
          processedAt: newStatus === PaymentStatus.PAID ? new Date() : paymentRecord.processedAt,
        }),
        description: notes ? notes : paymentRecord.description,
        metadata: JSON.stringify({
          ...(paymentRecord.metadata ? JSON.parse(paymentRecord.metadata) : {}),
          manuallyUpdated: true,
          updatedBy: admin.id,
          updatedAt: new Date().toISOString(),
          previousAmount: oldAmount,
          previousStatus: oldStatus,
          updateNotes: notes || null,
        }),
      },
    });

    logger.info(`Updated payment record ${paymentRecordId} for order ${orderId}`, {
      paymentRecordId,
      orderId,
      oldAmount,
      newAmount,
      oldStatus,
      newStatus,
      adminId: admin.id,
    });

    // Recalculate order payment status based on all payment records (including the updated one)
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

    // Calculate new payment summary
    const newPaymentSummary = calculatePaymentSummary(updatedOrder.paymentRecords, invoiceTotal);

    // Add order history entry for audit trail
    await prisma.orderHistory.create({
      data: {
        orderId: orderId,
        staffId: admin.id,
        action: 'PAYMENT_RECORD_UPDATED',
        oldValue: JSON.stringify({
          amount: oldAmount,
          status: oldStatus,
        }),
        newValue: JSON.stringify({
          amount: newAmount,
          status: newStatus,
        }),
        description: `Payment record ${paymentRecordId} updated: Amount ${oldAmount} → ${newAmount} BHD, Status ${oldStatus} → ${newStatus}${notes ? ` (${notes})` : ''}`,
        metadata: JSON.stringify({
          updatedBy: admin.id,
          adminEmail: admin.email,
          paymentRecordId: paymentRecordId,
          oldAmount,
          newAmount,
          oldStatus,
          newStatus,
          notes: notes || null,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // If payment is received and order is in processing completed status, update to ready for delivery
    if (updatedOrder.paymentStatus === PaymentStatus.PAID) {
      await OrderTrackingService.checkPaymentAndUpdateStatus(orderId);
    }

    return NextResponse.json({
      success: true,
      message: `Payment record updated successfully`,
      paymentRecord: updatedPaymentRecord,
      paymentSummary: newPaymentSummary,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        paymentStatus: updatedOrder.paymentStatus,
      },
    });
  } catch (error) {
    logger.error('Error updating payment record:', error);

    if (
      error instanceof Error &&
      (error.message === 'Admin authentication required' || error.message.includes('Access denied'))
    ) {
      if (error.message.includes('Access denied')) {
        return createAdminForbiddenErrorResponse('Only Super Administrators can update payment records');
      }
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update payment record' },
      { status: 500 }
    );
  }
}

