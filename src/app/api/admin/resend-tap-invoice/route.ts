import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import { tapConfig } from '@/lib/config/tapConfig';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { resendInvoice } from '@/lib/tapInvoiceManagement';

interface ResendTapInvoiceRequest {
  orderId: number;
  paymentRecordId: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    await requireAuthenticatedAdmin();

    const body = await request.json();
    const { orderId, paymentRecordId } = body as ResendTapInvoiceRequest;

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
    const data = await resendInvoice(tapInvoiceId, ['SMS', 'EMAIL']);
    logger.info(`TAP invoice ${tapInvoiceId} resent successfully`);

    // Update payment record with resend information
    await prisma.paymentRecord.update({
      where: { id: paymentRecordId },
      data: {
        metadata: JSON.stringify({
          ...(paymentRecord.metadata ? JSON.parse(paymentRecord.metadata) : {}),
          lastResentAt: new Date().toISOString(),
          resendCount: (paymentRecord.metadata ? 
            (JSON.parse(paymentRecord.metadata).resendCount || 0) : 0) + 1,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invoice resent successfully',
      tapResponse: data,
    });
  } catch (error) {
    logger.error('Error resending Tap invoice:', error);
    return NextResponse.json(
      { error: 'Failed to resend Tap invoice' },
      { status: 500 }
    );
  }
} 