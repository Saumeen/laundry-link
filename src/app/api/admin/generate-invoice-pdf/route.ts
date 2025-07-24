import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    await requireAuthenticatedAdmin();

    const body = await request.json();
    const { orderId } = body as { orderId: number };

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
      `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
      120,
      40
    );
    doc.text(
      `Due Date: ${new Date(order.deliveryTime).toLocaleDateString()}`,
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
    doc.text(`Status: ${order.status}`, 20, 150);
    doc.text(`Pickup: ${new Date(order.pickupTime).toLocaleString()}`, 20, 157);
    doc.text(
      `Delivery: ${new Date(order.deliveryTime).toLocaleString()}`,
      20,
      164
    );

    let yPosition = 180;

    // Services table
    if (order.orderServiceMappings && order.orderServiceMappings.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Services', 20, yPosition);
      yPosition += 10;

      const servicesData = order.orderServiceMappings.map(mapping => [
        mapping.service.displayName,
        mapping.quantity.toString(),
        `${mapping.price.toFixed(3)} BD`,
        `${(mapping.quantity * mapping.price).toFixed(3)} BD`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Service', 'Quantity', 'Unit Price', 'Total']],
        body: servicesData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Order items table
    const allOrderItems = order.orderServiceMappings.flatMap(
      mapping => mapping.orderItems || []
    );

    if (allOrderItems.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Order Items', 20, yPosition);
      yPosition += 10;

      const itemsData = allOrderItems.map(item => [
        item.itemName,
        item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1),
        item.quantity.toString(),
        `${item.pricePerItem.toFixed(3)} BD`,
        `${item.totalPrice.toFixed(3)} BD`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Item', 'Type', 'Quantity', 'Unit Price', 'Total']],
        body: itemsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
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

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
