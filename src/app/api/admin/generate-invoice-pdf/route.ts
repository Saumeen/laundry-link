import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import emailService from '@/lib/emailService';
import { generateInvoicePDF } from '@/lib/utils/invoiceUtils';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    await requireAuthenticatedAdmin();

    const body = await request.json();
    const { orderId, sendEmail = false } = body as { orderId: number; sendEmail?: boolean };

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Generate PDF using common function
    const result = await generateInvoicePDF(orderId);
    
    if (!result) {
      return NextResponse.json({ error: 'Failed to generate invoice PDF' }, { status: 500 });
    }

    const { pdfBuffer, invoiceData } = result;

    // If sendEmail is true, send the invoice via email
    if (sendEmail) {
      try {
        // Fetch order for email
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            customer: true,
            orderServiceMappings: {
              include: {
                service: true,
                orderItems: true,
              },
            },
            address: true,
          },
        });

        if (!order) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Send invoice email with PDF attachment
        const emailSent = await emailService.sendInvoiceGeneratedNotification(
          order,
          order.customer.email,
          `${order.customer.firstName} ${order.customer.lastName}`,
          invoiceData,
          pdfBuffer
        );

        if (emailSent) {
          // Update order to mark invoice as generated
          await prisma.order.update({
            where: { id: order.id },
            data: { invoiceGenerated: true },
          });

          return NextResponse.json({
            success: true,
            message: 'Invoice sent successfully to customer',
          });
        } else {
          return NextResponse.json(
            { error: 'Failed to send invoice email' },
            { status: 500 }
          );
        }
      } catch (emailError) {
        logger.error('Error sending invoice email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send invoice email' },
          { status: 500 }
        );
      }
    }

    // Return PDF as response for download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
