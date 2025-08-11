import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { formatUTCForDisplay, formatUTCForDateDisplay } from '@/lib/utils/timezone';
import emailService from '@/lib/emailService';

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

    // Fetch order with all related data
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId.toString()) },
      include: {
        customer: true,
        address: true,
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true,
          },
        },
        paymentRecords: {
          where: {
            paymentStatus: 'PAID',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Create PDF
    const doc = new jsPDF();

    // Set font
    doc.setFont('helvetica');

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Laundry Link Services', 20, 40);
    doc.text('Professional Laundry & Dry Cleaning', 20, 47);

    // Order details on the right
    doc.setFont('helvetica', 'bold');
    doc.text(`Order #${order.orderNumber}`, 120, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Date: ${formatUTCForDateDisplay(order.createdAt.toISOString())}`,
      120,
      40
    );
    doc.text(
      `Due Date: ${formatUTCForDateDisplay(order.deliveryEndTime.toISOString())}`,
      120,
      47
    );

    // Company and customer info
    doc.setFont('helvetica', 'bold');
    doc.text('From:', 20, 70);
    doc.setFont('helvetica', 'normal');
    doc.text('Laundry Link Services', 20, 80);
    doc.text('123 Business Street', 20, 87);
    doc.text('Manama, Bahrain', 20, 94);
    doc.text('Phone: +973 1234 5678', 20, 101);
    doc.text('Email: info@laundrylink.bh', 20, 108);

    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 120, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(`${order.customer.firstName} ${order.customer.lastName}`, 120, 80);
    doc.text(order.customer.email, 120, 87);
    doc.text(order.customer.phone || '', 120, 94);

    if (order.address) {
      doc.text(order.address.addressLine1, 120, 101);
      if (order.address.addressLine2) {
        doc.text(order.address.addressLine2, 120, 108);
      }
      doc.text(order.address.city, 120, 115);
      if (order.address.area) {
        doc.text(`Area: ${order.address.area}`, 120, 122);
      }
    }

    // Order details
    doc.setFont('helvetica', 'bold');
    doc.text('Order Details:', 20, 140);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pickup: ${formatUTCForDisplay(order.pickupStartTime.toISOString())}`, 20, 150);
    doc.text(
      `Delivery: ${formatUTCForDisplay(order.deliveryEndTime.toISOString())}`,
      20,
      157
    );

    // Payment information
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information:', 20, 170);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${order.paymentStatus || 'Pending'}`, 20, 180);
    if (order.paymentMethod) {
      doc.text(`Method: ${order.paymentMethod}`, 20, 187);
    }
    
         // Add transaction details if payment is completed
     if (order.paymentStatus === 'PAID' && order.paymentRecords && order.paymentRecords.length > 0) {
       const paymentRecord = order.paymentRecords[0];
       
       // Add transaction ID if available
       if (paymentRecord.tapTransactionId) {
         doc.text(`Transaction ID: ${paymentRecord.tapTransactionId}`, 20, 194);
       } else if (paymentRecord.tapChargeId) {
         doc.text(`Charge ID: ${paymentRecord.tapChargeId}`, 20, 194);
       }
       
       // Add payment source
       if (paymentRecord.cardBrand && paymentRecord.cardLastFour) {
         doc.text(`Payment Source: ${paymentRecord.cardBrand} ****${paymentRecord.cardLastFour}`, 20, 201);
       } else if (paymentRecord.paymentMethod) {
         doc.text(`Payment Source: ${paymentRecord.paymentMethod}`, 20, 201);
       }
     }

    let yPosition = 220;



    // Order items table
    const allOrderItems = order.orderServiceMappings.flatMap(
      mapping => mapping.orderItems || []
    );

    if (allOrderItems.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Order Items', 20, yPosition);
      yPosition += 10;

      const itemsData = allOrderItems.map(item => {
        // Find the service mapping for this item
        const serviceMapping = order.orderServiceMappings.find(mapping => 
          mapping.orderItems.some(orderItem => orderItem.id === item.id)
        );
        const serviceName = serviceMapping?.service.displayName || 'N/A';
        
        return [
          item.itemName,
          serviceName,
          item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1),
          item.quantity.toString(),
          `${item.pricePerItem.toFixed(3)} BD`,
          `${item.totalPrice.toFixed(3)} BD`,
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Item', 'Service', 'Type', 'Quantity', 'Unit Price', 'Total']],
        body: itemsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 35 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Special instructions
    if (order.specialInstructions) {
      doc.setFont('helvetica', 'bold');
      doc.text('Special Instructions:', 20, yPosition);
      doc.setFont('helvetica', 'normal');

      // Split long text into multiple lines
      const maxWidth = 170;
      const words = order.specialInstructions.split(' ');
      let line = '';
      let lineY = yPosition + 10;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testWidth = doc.getTextWidth(testLine);

        if (testWidth > maxWidth && i > 0) {
          doc.text(line, 20, lineY);
          line = words[i] + ' ';
          lineY += 7;
        } else {
          line = testLine;
        }
      }
      doc.text(line, 20, lineY);
      yPosition = lineY + 15;
    }

    // Calculate totals
    let subtotal = 0;

    // Add order items costs
    if (order.orderServiceMappings) {
      order.orderServiceMappings.forEach(mapping => {
        if (mapping.orderItems) {
          mapping.orderItems.forEach(item => {
            subtotal += item.totalPrice;
          });
        }
      });
    }

    const total = order.invoiceTotal || subtotal;

    // Totals section
    const totalsY = Math.max(yPosition, 250);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 130, totalsY);
    doc.text(`${subtotal.toFixed(3)} BD`, 170, totalsY);

    if (order.minimumOrderApplied) {
      doc.text('Minimum Order Applied:', 130, totalsY + 10);
      doc.text('Yes', 170, totalsY + 10);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 130, totalsY + 20);
    doc.text(`${total.toFixed(3)} BD`, 170, totalsY + 20);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Thank you for choosing Laundry Link Services!', 20, 280);
    doc.text(
      'For any questions, please contact us at info@laundrylink.bh',
      20,
      287
    );

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    // If sendEmail is true, send the invoice via email
    if (sendEmail) {
      try {
        // Prepare invoice data for email
        const invoiceData = {
          totalAmount: order.invoiceTotal || subtotal,
          items: order.orderServiceMappings.flatMap(mapping => 
            mapping.orderItems.map(item => ({
              serviceName: mapping.service.displayName,
              quantity: item.quantity,
              unitPrice: item.pricePerItem,
              totalPrice: item.totalPrice,
              notes: item.notes || undefined,
            }))
          ),
        };

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
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"`,
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
