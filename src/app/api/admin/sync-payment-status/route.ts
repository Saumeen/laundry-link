import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from '@/lib/adminAuth';
import { recalculateOrderPaymentStatus, calculatePaymentSummary } from '@/lib/utils/paymentUtils';
import { getInvoice } from '@/lib/tapInvoiceManagement';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    await requireAuthenticatedAdmin();
    
    const body = await request.json();
    const { orderId } = body as { orderId: number };

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order with payment records
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentRecords: {
          where: {
            paymentMethod: 'TAP_INVOICE',
            paymentStatus: 'PENDING'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // If there's a pending TAP_INVOICE payment, check its status via TAP API
    if (order.paymentRecords.length > 0) {
      const pendingInvoicePayment = order.paymentRecords[0];
      if (pendingInvoicePayment.tapReference) {
        try {
          logger.info(`Checking TAP invoice status for payment ${pendingInvoicePayment.id}, invoice ID: ${pendingInvoicePayment.tapReference}`);
          
          const invoice = await getInvoice(pendingInvoicePayment.tapReference);
          
          // Map invoice status to payment status
          let newPaymentStatus: 'PENDING' | 'PAID' | 'FAILED';
          switch (invoice.status?.toUpperCase()) {
            case 'PAID':
            case 'CLOSED':
              newPaymentStatus = 'PAID';
              break;
            case 'CANCELLED':
            case 'EXPIRED':
              newPaymentStatus = 'FAILED';
              break;
            default:
              newPaymentStatus = 'PENDING';
          }

          // Update payment record if status changed
          if (newPaymentStatus !== pendingInvoicePayment.paymentStatus) {
            await prisma.paymentRecord.update({
              where: { id: pendingInvoicePayment.id },
              data: {
                paymentStatus: newPaymentStatus,
                processedAt: newPaymentStatus === 'PAID' ? new Date() : null,
                tapResponse: JSON.stringify(invoice),
                updatedAt: new Date()
              }
            });

            logger.info(`Updated payment ${pendingInvoicePayment.id} status from ${pendingInvoicePayment.paymentStatus} to ${newPaymentStatus}`);
          }
        } catch (error) {
          logger.error(`Error checking TAP invoice status:`, error);
          // Continue with recalculation even if invoice check fails
        }
      }
    }

    // Recalculate order payment status based on all payment records
    await recalculateOrderPaymentStatus(orderId);

    // Get updated order with payment summary
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentRecords: {
          include: {
            walletTransaction: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to fetch updated order' },
        { status: 500 }
      );
    }

    // Calculate payment summary using standardized function
    const invoiceTotal = updatedOrder.invoiceTotal || 0;
    const paymentSummary = calculatePaymentSummary(updatedOrder.paymentRecords, invoiceTotal);

    return NextResponse.json({
      success: true,
      message: 'Payment status synced successfully',
      paymentSummary,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        paymentStatus: updatedOrder.paymentStatus,
        paymentMethod: updatedOrder.paymentMethod
      }
    });
  } catch (error) {
    logger.error('Error syncing payment status:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to sync payment status' },
      { status: 500 }
    );
  }
}

