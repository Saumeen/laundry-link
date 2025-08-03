import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import { tapConfig } from '@/lib/config/tapConfig';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { getInvoice } from '@/lib/tapInvoiceManagement';

interface GetTapInvoiceRequest {
  orderId: number;
  paymentRecordId: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    await requireAuthenticatedAdmin();

    const body = await request.json();
    const { orderId, paymentRecordId } = body as GetTapInvoiceRequest;

    if (!orderId || !paymentRecordId) {
      return NextResponse.json(
        { error: 'Order ID and Payment Record ID are required' },
        { status: 400 }
      );
    }

    // Get the payment record
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { id: paymentRecordId },
      include: {
        order: {
          include: {
            customer: true,
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

    if (paymentRecord.paymentMethod !== 'TAP_INVOICE') {
      return NextResponse.json(
        { error: 'Payment record is not a TAP invoice' },
        { status: 400 }
      );
    }

    // Get the TAP invoice ID from metadata
    let tapInvoiceId = paymentRecord.tapReference;
    if (paymentRecord.metadata) {
      try {
        const metadata = JSON.parse(paymentRecord.metadata);
        tapInvoiceId = metadata.tapInvoiceId || tapInvoiceId;
      } catch (error) {
        logger.error('Error parsing payment metadata:', error);
      }
    }

    if (!tapInvoiceId) {
      return NextResponse.json(
        { error: 'TAP invoice ID not found' },
        { status: 400 }
      );
    }

    // Use the tapInvoiceManagement function
    const invoiceData = await getInvoice(tapInvoiceId);
    logger.info(`TAP invoice ${tapInvoiceId} retrieved successfully`);

    return NextResponse.json({
      success: true,
      invoice: invoiceData,
    });
  } catch (error) {
    logger.error('Error getting Tap invoice:', error);
    return NextResponse.json(
      { error: 'Failed to get Tap invoice' },
      { status: 500 }
    );
  }
} 