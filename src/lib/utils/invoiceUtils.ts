import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import emailService from '@/lib/emailService';
import { 
  formatUTCForDisplay, 
  formatUTCForDateDisplay, 
  getCurrentBahrainDate,
  convertUTCToBahrainDisplay 
} from '@/lib/utils/timezone';

interface InvoiceData {
  totalAmount: number;
  subtotal: number;
  tax: number;
  discount: number;
  items: Array<{
    serviceName: string;
    itemName: string;
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
  paymentStatus?: string;
  createdAt: Date;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postalCode?: string;
  } | null;
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

interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  transactionDate: Date;
  reference?: string;
  gateway?: string;
}

interface ProfessionalInvoiceEmailData {
  order: OrderWithRelations;
  invoiceData: InvoiceData;
  paymentTransaction?: PaymentTransaction;
  includePaymentLink?: boolean;
  paymentLink?: string;
}

/**
 * Generate professional PDF invoice for an order
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

    // Calculate invoice data
    const subtotal = order.orderServiceMappings.reduce((total, mapping) => {
      return total + mapping.orderItems.reduce((itemTotal, item) => {
        return itemTotal + item.totalPrice;
      }, 0);
    }, 0);

    const tax = 0; // No tax for now
    const discount = 0; // No discount for now
    const totalAmount = order.invoiceTotal || subtotal;

    const invoiceData: InvoiceData = {
      totalAmount,
      subtotal,
      tax,
      discount,
      items: order.orderServiceMappings.flatMap(mapping =>
        mapping.orderItems.map(item => ({
          serviceName: mapping.service.displayName,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.pricePerItem,
          totalPrice: item.totalPrice,
          notes: item.notes || undefined,
        }))
      ),
    };

    // Create PDF document with professional layout
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
      title: `Invoice - ${order.orderNumber}`,
      subject: 'Laundry Link Invoice',
      author: 'Laundry Link',
      creator: 'Laundry Link System'
    });

    // Professional color scheme
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
    const secondaryColor: [number, number, number] = [107, 114, 128]; // Gray
    const accentColor: [number, number, number] = [16, 185, 129]; // Green
    const warningColor: [number, number, number] = [245, 158, 11]; // Orange
    const dangerColor: [number, number, number] = [239, 68, 68]; // Red

    // Header Section
    const headerY = 20;
    
    // Company Logo/Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Company name and tagline
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('LAUNDRY LINK', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Laundry Services', 105, 25, { align: 'center' });
    doc.text('Bahrain', 105, 32, { align: 'center' });

    // Invoice title and number
    doc.setTextColor(...primaryColor);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 55, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${order.orderNumber}`, 105, 65, { align: 'center' });

    // Invoice details section
    const detailsY = 80;
    
    // Left column - Bill To
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, detailsY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
    doc.text(customerName, 20, detailsY + 8);
    doc.text(order.customer.email, 20, detailsY + 15);
    if (order.customer.phone) {
      doc.text(order.customer.phone, 20, detailsY + 22);
    }
    
    // Address if available
    if (order.address?.addressLine1) {
      doc.text(order.address.addressLine1, 20, detailsY + 29);
      if (order.address.addressLine2) {
        doc.text(order.address.addressLine2, 20, detailsY + 36);
      }
      if (order.address.city) {
        doc.text(order.address.city, 20, detailsY + 43);
      }
    }

    // Right column - Invoice details
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE DETAILS:', 120, detailsY);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${getCurrentBahrainDate()}`, 120, detailsY + 8);
    doc.text(`Due Date: ${getCurrentBahrainDate()}`, 120, detailsY + 15);
    doc.text(`Status: ${order.paymentStatus || 'PENDING'}`, 120, detailsY + 22);
    
    // Service schedule
    const pickupTime = formatUTCForDisplay(order.pickupStartTime.toISOString());
    const deliveryTime = formatUTCForDisplay(order.deliveryStartTime.toISOString());
    doc.text(`Pickup: ${pickupTime}`, 120, detailsY + 29);
    doc.text(`Delivery: ${deliveryTime}`, 120, detailsY + 36);

    // Special instructions if available
    if (order.specialInstructions) {
      doc.text(`Notes: ${order.specialInstructions}`, 120, detailsY + 43);
    }

    // Items table
    const tableY = detailsY + 55;
    
    // Table header
    autoTable(doc, {
      startY: tableY,
      head: [['Service Type', 'Item Name', 'Qty', 'Unit Price', 'Total']],
      body: invoiceData.items.map(item => [
        item.serviceName,
        item.itemName + (item.notes ? `\n${item.notes}` : ''),
        item.quantity.toString(),
        `${item.unitPrice.toFixed(3)} BD`,
        `${item.totalPrice.toFixed(3)} BD`
      ]),
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 55 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    // Summary section
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Summary box
    const summaryX = 120;
    const summaryY = finalY;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(summaryX, summaryY - 5, 70, 60, 'F');
    doc.setDrawColor(...primaryColor);
    doc.rect(summaryX, summaryY - 5, 70, 60, 'S');
    
    // Summary content
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', summaryX + 35, summaryY, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Subtotal
    doc.text('Subtotal:', summaryX + 5, summaryY + 15);
    doc.text(`${invoiceData.subtotal.toFixed(3)} BD`, summaryX + 65, summaryY + 15, { align: 'right' });
    
    // Tax (if any)
    if (invoiceData.tax > 0) {
      doc.text('Tax:', summaryX + 5, summaryY + 25);
      doc.text(`${invoiceData.tax.toFixed(3)} BD`, summaryX + 65, summaryY + 25, { align: 'right' });
    }
    
    // Discount (if any)
    if (invoiceData.discount > 0) {
      doc.text('Discount:', summaryX + 5, summaryY + 35);
      doc.text(`-${invoiceData.discount.toFixed(3)} BD`, summaryX + 65, summaryY + 35, { align: 'right' });
    }
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('TOTAL:', summaryX + 5, summaryY + 50);
    doc.text(`${invoiceData.totalAmount.toFixed(3)} BD`, summaryX + 65, summaryY + 50, { align: 'right' });

    // Payment status indicator
    const statusY = summaryY + 70;
    const isPaid = order.paymentStatus === 'PAID';
    
    doc.setFillColor(...(isPaid ? accentColor : warningColor));
    doc.rect(20, statusY - 5, 60, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(isPaid ? 'PAID' : 'PENDING', 50, statusY + 5, { align: 'center' });
    
    // Payment details if available
    if (isPaid) {
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Payment Method: Account Balance', 20, statusY + 25);
      doc.text('Payment Date: ' + getCurrentBahrainDate(), 20, statusY + 32);
    }

    // Footer
    const footerY = 270;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(0, footerY, 210, 30, 'F');
    
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing Laundry Link!', 105, footerY + 10, { align: 'center' });
    doc.text('For support, contact us: +973 3344 0841 | info@laundrylink.net', 105, footerY + 18, { align: 'center' });
    doc.text('This is a computer-generated invoice. No signature required.', 105, footerY + 26, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    return { pdfBuffer, invoiceData };
  } catch (error) {
    logger.error('Error generating invoice PDF:', error);
    return null;
  }
}

/**
 * Generate professional invoice email content with modern design
 * @param data - Invoice email data
 * @returns Promise<string> - HTML email content
 */
export async function generateProfessionalInvoiceEmail(data: ProfessionalInvoiceEmailData): Promise<string> {
  const { order, invoiceData, paymentTransaction, includePaymentLink, paymentLink } = data;
  
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
  const isPaymentCompleted = order.paymentStatus === 'PAID' || paymentTransaction?.status === 'completed';
  const hasPaymentLink = includePaymentLink && paymentLink;
  
  // Convert dates to Bahrain time
  const pickupTime = convertUTCToBahrainDisplay(order.pickupStartTime.toISOString());
  const deliveryTime = convertUTCToBahrainDisplay(order.deliveryStartTime.toISOString());
  const invoiceDate = formatUTCForDateDisplay(new Date().toISOString());
  const orderDate = formatUTCForDateDisplay(order.createdAt.toISOString());

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${order.orderNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; background: #fff; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; font-weight: 300; }
        .header p { font-size: 1.1em; opacity: 0.9; }
        .invoice-badge { background: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 25px; display: inline-block; margin-top: 15px; }
        .content { padding: 40px 30px; }
                 .status-banner { background: ${isPaymentCompleted ? '#10b981' : '#f59e0b'}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
         .status-banner h3 { font-size: 1.2em; margin-bottom: 5px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 30px 0; }
        .card { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; }
        .card h3 { color: #1f2937; margin-bottom: 20px; font-size: 1.2em; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .info-label { color: #6b7280; font-weight: 500; }
        .info-value { color: #1f2937; font-weight: 600; }
        .total-amount { font-size: 2em; color: #059669; font-weight: bold; text-align: center; margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { background: #3b82f6; color: white; padding: 15px; text-align: left; }
        .items-table td { padding: 15px; border-bottom: 1px solid #e2e8f0; }
        .items-table tr:nth-child(even) { background: #f8fafc; }
        .payment-section { background: ${isPaymentCompleted ? '#d1fae5' : '#fef3c7'}; border-left: 4px solid ${isPaymentCompleted ? '#059669' : '#f59e0b'}; padding: 20px; border-radius: 8px; margin: 30px 0; }
        .payment-section h4 { color: ${isPaymentCompleted ? '#065f46' : '#92400e'}; margin-bottom: 15px; }
        .btn { display: inline-block; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-success { background: #10b981; color: white; }
        .btn-whatsapp { background: #25d366; color: white; }
        .contact-section { text-align: center; margin: 40px 0; }
        .footer { background: #1f2937; color: white; text-align: center; padding: 30px; }
        .footer p { margin-bottom: 10px; }
        @media (max-width: 768px) {
          .grid-2, .grid-3 { grid-template-columns: 1fr; }
          .header { padding: 30px 20px; }
          .content { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>LAUNDRY LINK</h1>
          <p>Professional Laundry Services</p>
          <div class="invoice-badge">
            <strong>INVOICE #${order.orderNumber}</strong>
          </div>
        </div>

        <!-- Content -->
        <div class="content">
                     <!-- Status Banner -->
           <div class="status-banner">
             <h3>${isPaymentCompleted ? 'Payment Confirmed' : 'Invoice Generated'}</h3>
           </div>

          <!-- Customer Greeting -->
          <p style="font-size: 1.1em; margin-bottom: 30px;">Dear <strong>${customerName}</strong>,</p>
          <p style="font-size: 1.1em; margin-bottom: 30px;">
            ${isPaymentCompleted 
              ? 'Thank you for your payment! Your order has been confirmed and is now in our processing queue. We\'ll keep you updated at every step.'
              : 'Thank you for choosing Laundry Link! Your invoice has been generated and is ready for review. Please ensure payment is completed to avoid any delays.'
            }
          </p>

                     <!-- Invoice Summary -->
           <div class="card">
             <h3>Invoice Summary</h3>
            <div class="grid-3">
              <div>
                <div class="info-row">
                  <span class="info-label">Invoice Number:</span>
                  <span class="info-value">#${order.orderNumber}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Invoice Date:</span>
                  <span class="info-value">${invoiceDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Order Date:</span>
                  <span class="info-value">${orderDate}</span>
                </div>
              </div>
              <div>
                <div class="info-row">
                  <span class="info-label">Pickup Date:</span>
                  <span class="info-value">${pickupTime}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Delivery Date:</span>
                  <span class="info-value">${deliveryTime}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Status:</span>
                  <span class="info-value" style="color: ${isPaymentCompleted ? '#059669' : '#f59e0b'}">${isPaymentCompleted ? 'PAID' : 'PENDING'}</span>
                </div>
              </div>
              <div>
                <div class="info-row">
                  <span class="info-label">Customer:</span>
                  <span class="info-value">${customerName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${order.customer.email}</span>
                </div>
                ${order.customer.phone ? `
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${order.customer.phone}</span>
                </div>
                ` : ''}
              </div>
            </div>
            <div class="total-amount">
              Total Amount: ${invoiceData.totalAmount.toFixed(3)} BD
            </div>
          </div>

                     <!-- Service Details -->
           ${invoiceData.items.length > 0 ? `
           <div class="card">
             <h3>Service & Item Details</h3>
             <table class="items-table">
               <thead>
                 <tr>
                   <th>Service Type</th>
                   <th>Item Name</th>
                   <th>Qty</th>
                   <th>Unit Price</th>
                   <th>Total</th>
                 </tr>
               </thead>
               <tbody>
                 ${invoiceData.items.map(item => `
                   <tr>
                     <td><strong>${item.serviceName}</strong></td>
                     <td>
                       <strong>${item.itemName}</strong>
                       ${item.notes ? `<br><small style="color: #6b7280; font-style: italic;">${item.notes}</small>` : ''}
                     </td>
                     <td style="text-align: center;">${item.quantity}</td>
                     <td style="text-align: right;">${item.unitPrice.toFixed(3)} BD</td>
                     <td style="text-align: right;"><strong>${item.totalPrice.toFixed(3)} BD</strong></td>
                   </tr>
                 `).join('')}
               </tbody>
             </table>
            
            <!-- Summary -->
            <div style="text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #3b82f6;">
              <div class="info-row">
                <span class="info-label">Subtotal:</span>
                <span class="info-value">${invoiceData.subtotal.toFixed(3)} BD</span>
              </div>
              ${invoiceData.tax > 0 ? `
              <div class="info-row">
                <span class="info-label">Tax:</span>
                <span class="info-value">${invoiceData.tax.toFixed(3)} BD</span>
              </div>
              ` : ''}
              ${invoiceData.discount > 0 ? `
              <div class="info-row">
                <span class="info-label">Discount:</span>
                <span class="info-value">-${invoiceData.discount.toFixed(3)} BD</span>
              </div>
              ` : ''}
              <div class="info-row" style="font-size: 1.2em; font-weight: bold; color: #059669;">
                <span class="info-label">Total:</span>
                <span class="info-value">${invoiceData.totalAmount.toFixed(3)} BD</span>
              </div>
            </div>
          </div>
          ` : ''}

                     <!-- Payment Information -->
           ${paymentTransaction || order.paymentStatus ? `
           <div class="payment-section">
             <h4>${isPaymentCompleted ? 'Payment Confirmed' : 'Payment Information'}</h4>
            ${isPaymentCompleted ? `
              <div class="grid-2">
                <div>
                                     <div class="info-row">
                     <span class="info-label">Payment Status:</span>
                     <span class="info-value" style="color: #059669;">Confirmed</span>
                   </div>
                   <div class="info-row">
                     <span class="info-label">Payment Method:</span>
                     <span class="info-value">${paymentTransaction?.paymentMethod || 'Account Balance'}</span>
                   </div>
                   ${paymentTransaction?.id ? `
                   <div class="info-row">
                     <span class="info-label">Transaction ID:</span>
                     <span class="info-value">${paymentTransaction.id}</span>
                   </div>
                   ` : ''}
                   ${paymentTransaction?.gateway ? `
                   <div class="info-row">
                     <span class="info-label">Payment Gateway:</span>
                     <span class="info-value">${paymentTransaction.gateway}</span>
                   </div>
                   ` : ''}
                </div>
                <div>
                  ${paymentTransaction?.reference ? `
                  <div class="info-row">
                    <span class="info-label">Transaction Reference:</span>
                    <span class="info-value">${paymentTransaction.reference}</span>
                  </div>
                  ` : ''}
                  ${paymentTransaction?.transactionDate ? `
                  <div class="info-row">
                    <span class="info-label">Payment Date:</span>
                    <span class="info-value">${formatUTCForDateDisplay(paymentTransaction.transactionDate.toISOString())}</span>
                  </div>
                  ` : ''}
                  <div class="info-row">
                    <span class="info-label">Amount Paid:</span>
                    <span class="info-value" style="color: #059669; font-weight: bold;">${invoiceData.totalAmount.toFixed(3)} BD</span>
                  </div>
                </div>
              </div>
            ` : `
              <div class="grid-2">
                <div>
                  <div class="info-row">
                    <span class="info-label">Payment Status:</span>
                    <span class="info-value" style="color: #f59e0b;">Pending</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Amount Due:</span>
                    <span class="info-value" style="color: #f59e0b; font-weight: bold;">${invoiceData.totalAmount.toFixed(3)} BD</span>
                  </div>
                </div>
                <div>
                  <p style="color: #92400e; margin: 0;">Please ensure your account balance is maintained to avoid any delays in service.</p>
                </div>
              </div>
            `}
          </div>
          ` : ''}

                     <!-- Payment Link -->
           ${hasPaymentLink ? `
           <div class="card" style="background: #e0f2fe; border-color: #0277bd;">
             <h3 style="color: #0277bd;">Secure Payment Link</h3>
            <p style="color: #0277bd; margin-bottom: 20px;">Click the button below to complete your payment securely:</p>
            <div style="text-align: center;">
              <a href="${paymentLink}" class="btn btn-primary">
                Pay Now - ${invoiceData.totalAmount.toFixed(3)} BD
              </a>
            </div>
          </div>
          ` : ''}

                     <!-- Next Steps -->
           <div class="card" style="background: #f0f9ff; border-color: #0ea5e9;">
             <h3 style="color: #0c4a6e;">Next Steps</h3>
            <p style="color: #0c4a6e; margin-bottom: 15px;">
              ${isPaymentCompleted 
                ? 'Your order has been confirmed and is now in our processing queue. We\'ll notify you at each stage of the process, from pickup to delivery.'
                : 'Your order is being processed. We\'ll notify you once it\'s ready for delivery.'
              }
            </p>
            <p style="color: #0c4a6e;">You can track your order status in your account dashboard at any time.</p>
          </div>

          <!-- Action Buttons -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/customer/dashboard" class="btn btn-primary">
              View Order Details
            </a>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/customer/wallet" class="btn btn-success">
              Manage Wallet
            </a>
          </div>

                     <!-- Contact Information -->
           <div class="contact-section">
             <p style="font-size: 1.1em; margin-bottom: 20px;">Need help? Contact us on WhatsApp:</p>
             <a href="https://wa.me/97333440841" class="btn btn-whatsapp">
               +973 3344 0841
             </a>
           </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Laundry Link</strong></p>
          <p>Professional Laundry Services in Bahrain</p>
          <p>Email: info@laundrylink.net | Phone: +973 3344 0841</p>
          <p style="font-size: 0.9em; opacity: 0.8;">This is an automated invoice. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send professional invoice email to customer
 * @param orderId - The order ID
 * @param paymentTransaction - Optional payment transaction details
 * @param includePaymentLink - Whether to include payment link
 * @param paymentLink - Optional payment link URL
 * @returns Promise<boolean> - Success status
 */
export async function sendProfessionalInvoiceEmail(
  orderId: number,
  paymentTransaction?: PaymentTransaction,
  includePaymentLink?: boolean,
  paymentLink?: string
): Promise<boolean> {
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

    if (!order || !order.customer?.email) {
      logger.error('Order not found or customer email missing for invoice email:', { orderId });
      return false;
    }

    // Calculate invoice data
    const subtotal = order.orderServiceMappings.reduce((total, mapping) => {
      return total + mapping.orderItems.reduce((itemTotal, item) => {
        return itemTotal + item.totalPrice;
      }, 0);
    }, 0);

    const tax = 0; // No tax for now
    const discount = 0; // No discount for now
    const totalAmount = order.invoiceTotal || subtotal;

    const invoiceData: InvoiceData = {
      totalAmount,
      subtotal,
      tax,
      discount,
      items: order.orderServiceMappings.flatMap(mapping =>
        mapping.orderItems.map(item => ({
          serviceName: mapping.service.displayName,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.pricePerItem,
          totalPrice: item.totalPrice,
          notes: item.notes || undefined,
        }))
      ),
    };

    // Generate PDF for attachment
    const pdfResult = await generateInvoicePDF(orderId);
    const pdfBuffer = pdfResult?.pdfBuffer;

    // Generate email content
    const emailContent = await generateProfessionalInvoiceEmail({
      order: order as OrderWithRelations,
      invoiceData,
      paymentTransaction,
      includePaymentLink,
      paymentLink,
    });

    // Send email using existing email service
    const success = await emailService.sendInvoiceGeneratedNotification(
      order,
      order.customer.email,
      `${order.customer.firstName} ${order.customer.lastName}`,
      invoiceData,
      pdfBuffer
    );

    if (success) {
      logger.info(`Professional invoice email sent successfully for order: ${order.orderNumber}`);
    } else {
      logger.error(`Failed to send professional invoice email for order: ${order.orderNumber}`);
    }

    return success;
  } catch (error) {
    logger.error('Error sending professional invoice email:', error);
    return false;
  }
}

/**
 * Generate and download professional invoice PDF
 * @param orderId - The order ID
 * @returns Promise<ArrayBuffer | null> - PDF buffer or null if failed
 */
export async function generateProfessionalInvoicePDF(orderId: number): Promise<ArrayBuffer | null> {
  try {
    const result = await generateInvoicePDF(orderId);
    return result?.pdfBuffer || null;
  } catch (error) {
    logger.error('Error generating professional invoice PDF:', error);
    return null;
  }
}
