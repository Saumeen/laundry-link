import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedCustomer } from '@/lib/auth';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const customer = await requireAuthenticatedCustomer();
    const body = await request.json();
    const { orderId } = body as { orderId: number };

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Verify the order belongs to the customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
        invoiceGenerated: true,
        paymentStatus: 'PENDING',
        paymentMethod: 'TAP_INVOICE',
      },
      include: {
        paymentRecords: {
          where: {
            paymentMethod: 'TAP_INVOICE',
            paymentStatus: 'PENDING',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or payment not required' },
        { status: 404 }
      );
    }

    // Get the latest payment record
    const paymentRecord = order.paymentRecords[0];
    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Parse metadata to get Tap invoice URL
    const metadata = JSON.parse(paymentRecord.metadata || '{}');
    const tapInvoiceUrl = metadata.tapInvoiceUrl;

    if (!tapInvoiceUrl) {
      return NextResponse.json(
        { error: 'Payment URL not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentUrl: tapInvoiceUrl,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    logger.error('Error processing payment request:', error);
    return NextResponse.json(
      { error: 'Failed to process payment request' },
      { status: 500 }
    );
  }
} 