import jsPDF from 'jspdf';
import 'jspdf-autotable';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

interface InvoiceData {
  totalAmount: number;
  items: Array<{
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }>;
}

interface OrderWithRelations {
  id: number;
  orderNumber: string;
  customerId: number;
  pickupStartTime: Date;
  pickupEndTime: Date;
  deliveryStartTime: Date;
  deliveryEndTime: Date;
  specialInstructions?: string | null;
  customerAddress: string;
  invoiceTotal?: number | null;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  orderServiceMappings: Array<{
    id: number;
    quantity: number;
    price: number;
    service: {
      id: number;
      displayName: string;
      name: string;
    };
    orderItems: Array<{
      id: number;
      itemName: string;
      quantity: number;
      pricePerItem: number;
      totalPrice: number;
      notes?: string | null;
    }>;
  }>;
}

/**
 * Generate PDF invoice for an order
 * @param orderId - The order ID
 * @returns Promise<{ pdfBuffer: ArrayBuffer; invoiceData: InvoiceData } | null>
 */
export async function generateInvoicePDF(orderId: number): Promise<{ pdfBuffer: ArrayBuffer; invoiceData: InvoiceData } | null> {
  try {
    // Fetch order with all necessary relations
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
      logger.error('Order not found for invoice generation:', { orderId });
      return null;
    }

    // Calculate subtotal from order items
    const subtotal = order.orderServiceMappings.reduce((total, mapping) => {
      return total + mapping.orderItems.reduce((itemTotal, item) => {
        return itemTotal + item.totalPrice;
      }, 0);
    }, 0);

    // Prepare invoice data
    const invoiceData: InvoiceData = {
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

    // Create PDF document
    const doc = new jsPDF();

    // Add header
    doc.setFontSize(20);
    doc.text('Laundry Link', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('INVOICE', 105, 30, { align: 'center' });

    // Add order details
    doc.setFontSize(12);
    doc.text(`Order Number: ${order.orderNumber}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
    doc.text(`Customer: ${order.customer.firstName} ${order.customer.lastName}`, 20, 70);
    doc.text(`Email: ${order.customer.email}`, 20, 80);

    // Add pickup and delivery times
    doc.text(`Pickup: ${order.pickupStartTime.toLocaleDateString()} ${order.pickupStartTime.toLocaleTimeString()}`, 20, 90);
    doc.text(`Delivery: ${order.deliveryStartTime.toLocaleDateString()} ${order.deliveryStartTime.toLocaleTimeString()}`, 20, 100);

    // Add address if available
    if (order.address?.addressLine1) {
      doc.text(`Address: ${order.address.addressLine1}`, 20, 110);
    }

    // Add special instructions if available
    if (order.specialInstructions) {
      doc.text(`Special Instructions: ${order.specialInstructions}`, 20, 120);
    }

    // Prepare table data
    const tableData = invoiceData.items.map(item => [
      item.serviceName,
      item.quantity.toString(),
      `${item.unitPrice.toFixed(3)} BD`,
      `${item.totalPrice.toFixed(3)} BD`,
      item.notes || ''
    ]);

    // Add items table
    (doc as any).autoTable({
      startY: 140,
      head: [['Service', 'Quantity', 'Unit Price', 'Total', 'Notes']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 40 }
      }
    });

    // Add total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Amount: ${invoiceData.totalAmount.toFixed(3)} BD`, 20, finalY);

    // Add footer
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for choosing Laundry Link!', 105, finalY + 20, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    return { pdfBuffer, invoiceData };
  } catch (error) {
    logger.error('Error generating invoice PDF:', error);
    return null;
  }
}
