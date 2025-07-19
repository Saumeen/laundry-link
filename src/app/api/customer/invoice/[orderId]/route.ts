import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import prisma from '@/lib/prisma';
import { requireAuthenticatedCustomer, createAuthErrorResponse } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Get authenticated customer
    const authenticatedCustomer = await requireAuthenticatedCustomer();
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Fetch order with all related data, ensuring it belongs to the customer
    const order = await prisma.order.findFirst({
      where: { 
        id: parseInt(orderId),
        customerId: authenticatedCustomer.id
      },
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

    // Check if order is ready for delivery
    if (order.status !== 'Cleaning Complete') {
      return NextResponse.json({ 
        error: `Invoice is not available yet. Current status: ${order.status}. Invoice will be available when your order is ready for delivery.` 
      }, { status: 400 });
    }

    // Check if invoice is generated (has order items)
    const hasOrderItems = order.orderServiceMappings.some(mapping => 
      mapping.orderItems && mapping.orderItems.length > 0
    );

    if (!hasOrderItems) {
      return NextResponse.json({ 
        error: 'Invoice not yet generated. Please wait for admin to process your order.' 
      }, { status: 400 });
    }

    // Create PDF with proper margins
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Professional header with logo area
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Company name in header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LAUNDRY LINK', 20, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Laundry & Dry Cleaning Services', 20, 30);
    
    // Invoice title and number on the right
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 120, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${order.orderNumber}`, 120, 30);
    
    // Reset text color for rest of document
    doc.setTextColor(0, 0, 0);
    
    // Company and customer info section
    let yPosition = 60;
    
    // Company info on the left
    doc.setFont('helvetica', 'bold');
    doc.text('FROM:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text('Laundry Link Services', 20, yPosition + 10);
    doc.text('123 Business Street', 20, yPosition + 17);
    doc.text('Manama, Bahrain', 20, yPosition + 24);
    doc.text('Phone: +973 1234 5678', 20, yPosition + 31);
    doc.text('Email: info@laundrylink.bh', 20, yPosition + 38);
    
    // Customer info on the right
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 120, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${order.customer.firstName} ${order.customer.lastName}`, 120, yPosition + 10);
    doc.text(order.customer.email, 120, yPosition + 17);
    doc.text(order.customer.phone || '', 120, yPosition + 24);
    
    let addressY = yPosition + 31;
    if (order.address) {
      doc.text(order.address.addressLine1, 120, addressY);
      addressY += 7;
      if (order.address.addressLine2) {
        doc.text(order.address.addressLine2, 120, addressY);
        addressY += 7;
      }
      doc.text(order.address.city, 120, addressY);
      addressY += 7;
      if (order.address.area) {
        doc.text(`Area: ${order.address.area}`, 120, addressY);
        addressY += 7;
      }
    }
    
    // Order details and totals section
    yPosition = Math.max(yPosition + 50, addressY + 20);
    
    // Order details on the left
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER DETAILS:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, yPosition + 10);
    doc.text(`Due Date: ${new Date(order.deliveryTime).toLocaleDateString()}`, 20, yPosition + 17);
    doc.text(`Pickup: ${new Date(order.pickupTime).toLocaleString()}`, 20, yPosition + 24);
    doc.text(`Delivery: ${new Date(order.deliveryTime).toLocaleString()}`, 20, yPosition + 31);
    doc.text(`Status: ${order.status}`, 20, yPosition + 38);
    
    // Calculate total
    let total = 0;
    if (order.orderServiceMappings) {
      order.orderServiceMappings.forEach(mapping => {
        total += mapping.quantity * mapping.price;
        if (mapping.orderItems) {
          mapping.orderItems.forEach(item => {
            total += item.totalPrice;
          });
        }
      });
    }
    total = order.invoiceTotal || total;
    
    // Totals on the right
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 120, yPosition);
    doc.setFontSize(16);
    doc.text(`${total.toFixed(3)} BD`, 120, yPosition + 10);
    doc.setFontSize(12);
    
    if (order.minimumOrderApplied) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Minimum Order Applied', 120, yPosition + 25);
      doc.text('Yes', 170, yPosition + 25);
    }
    
    // Items table
    yPosition += 60;
    
    // Order items table (only actual order items, no services)
    const allOrderItems = order.orderServiceMappings
      .flatMap(mapping => mapping.orderItems || []);
    
    if (allOrderItems.length > 0) {
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text('ORDER ITEMS:', 20, yPosition);
      yPosition += 10;
      
      const itemsData = allOrderItems.map(item => [
        item.itemName,
        item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1),
        item.quantity.toString(),
        `${item.pricePerItem.toFixed(3)} BD`,
        `${item.totalPrice.toFixed(3)} BD`
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Item', 'Type', 'Qty', 'Unit Price', 'Total']],
        body: itemsData,
        theme: 'grid',
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 35 },
          4: { cellWidth: 35 }
        },
        margin: { top: 10, right: 20, bottom: 10, left: 20 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Special instructions
    if (order.specialInstructions) {
      // Check if we need a new page
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text('SPECIAL INSTRUCTIONS:', 20, yPosition);
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
          
          // Check if we need a new page for long instructions
          if (lineY > 270) {
            doc.addPage();
            lineY = 30;
          }
        } else {
          line = testLine;
        }
      }
      doc.text(line, 20, lineY);
      yPosition = lineY + 15;
    }
    
    // Footer
    const footerY = Math.min(280, (doc as any).internal.pageSize.height - 20);
    doc.setFillColor(59, 130, 246);
    doc.rect(0, footerY - 10, 210, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Thank you for choosing Laundry Link Services!', 20, footerY - 3);
    doc.text('For any questions, please contact us at info@laundrylink.bh', 20, footerY + 3);
    
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
    console.error('Error generating customer invoice PDF:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }
    
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
} 