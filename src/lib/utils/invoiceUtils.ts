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

interface ProfessionalInvoiceEmailData {
  order: OrderWithRelations;
  invoiceData: InvoiceData;
  paymentDetails?: {
    paymentStatus: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentDate?: Date;
  };
  includePaymentLink?: boolean;
  paymentLink?: string;
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

    // Prepare invoice data with service and item details
    const invoiceData: InvoiceData = {
      totalAmount: order.invoiceTotal || subtotal,
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
    doc.text(`Date: ${getCurrentBahrainDate()}`, 20, 60);
    doc.text(`Customer: ${order.customer.firstName} ${order.customer.lastName}`, 20, 70);
    doc.text(`Email: ${order.customer.email}`, 20, 80);

    // Add pickup and delivery times in Bahrain time
    const pickupTime = formatUTCForDisplay(order.pickupStartTime.toISOString());
    const deliveryTime = formatUTCForDisplay(order.deliveryStartTime.toISOString());
    doc.text(`Pickup: ${pickupTime}`, 20, 90);
    doc.text(`Delivery: ${deliveryTime}`, 20, 100);

    // Add address if available
    if (order.address?.addressLine1) {
      doc.text(`Address: ${order.address.addressLine1}`, 20, 110);
    }

    // Add special instructions if available
    if (order.specialInstructions) {
      doc.text(`Special Instructions: ${order.specialInstructions}`, 20, 120);
    }

    // Prepare table data with dedicated item column
    const tableData = invoiceData.items.map(item => [
      item.serviceName,
      item.itemName,
      item.quantity.toString(),
      `${item.unitPrice.toFixed(3)} BD`,
      `${item.totalPrice.toFixed(3)} BD`,
      item.notes || ''
    ]);

    // Add items table
    autoTable(doc, {
      startY: 140,
      head: [['Service', 'Item', 'Quantity', 'Unit Price', 'Total', 'Notes']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 30 }
      }
    });

    // Add total and payment status
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont('', 'bold');
    doc.text(`Total Amount: ${invoiceData.totalAmount.toFixed(3)} BD`, 20, finalY);
    
    // Add payment status if available
    if (order.paymentStatus) {
      const paymentStatus = order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING';
      const statusColor = order.paymentStatus === 'PAID' ? [34, 197, 94] : [245, 158, 11];
      doc.setFontSize(12);
      doc.text(`Payment Status: ${paymentStatus}`, 20, finalY + 15);
    }

    // Add footer
    doc.setFontSize(10);
    doc.setFont('', 'normal');
    doc.text('Thank you for choosing Laundry Link!', 105, finalY + 20, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    return { pdfBuffer, invoiceData };
  } catch (error) {
    logger.error('Error generating invoice PDF:', error);
    return null;
  }
}

/**
 * Generate professional invoice email content
 * @param data - Invoice email data
 * @returns Promise<string> - HTML email content
 */
export async function generateProfessionalInvoiceEmail(data: ProfessionalInvoiceEmailData): Promise<string> {
  const { order, invoiceData, paymentDetails, includePaymentLink, paymentLink } = data;
  
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
  const isPaymentCompleted = paymentDetails?.paymentStatus === 'PAID';
  const hasPaymentLink = includePaymentLink && paymentLink;
  
  // Convert dates to Bahrain time using timezone utility
  const pickupTime = convertUTCToBahrainDisplay(order.pickupStartTime.toISOString());
  const deliveryTime = convertUTCToBahrainDisplay(order.deliveryStartTime.toISOString());
  const invoiceDate = formatUTCForDateDisplay(new Date().toISOString());

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
        <h1 style="color: #3b82f6; margin: 0; font-size: 28px; font-weight: bold;">Laundry Link</h1>
        <h2 style="color: #374151; margin: 10px 0; font-size: 24px;">Professional Invoice</h2>
        <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">Professional Laundry Services</p>
      </div>
      
      <!-- Status Banner -->
      <div style="background-color: ${isPaymentCompleted ? '#10b981' : '#3b82f6'}; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
        <h3 style="margin: 0; font-size: 18px;">
          ${isPaymentCompleted ? '✅ Payment Confirmed' : '🧾 Invoice Generated'}
        </h3>
        <p style="margin: 5px 0 0 0; font-size: 14px;">
          ${isPaymentCompleted ? 'Your payment has been received and confirmed' : 'Your invoice has been prepared and is ready for review'}
        </p>
      </div>
      
      <!-- Customer Greeting -->
      <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear ${customerName},</p>
      <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">
        ${isPaymentCompleted 
          ? 'Thank you for your payment! Your order has been confirmed and is being processed. Please find your detailed invoice below.'
          : 'Thank you for choosing Laundry Link! Your invoice has been generated and is ready for review. Please ensure your account balance is maintained to avoid any delays in service.'
        }
      </p>
      
      <!-- Invoice Summary -->
      <div style="background-color: #f8fafc; padding: 25px; border-radius: 10px; margin: 25px 0; border: 2px solid #e2e8f0;">
        <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; font-size: 20px;">📋 Invoice Summary</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
          <div>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Invoice Number:</strong></p>
            <p style="margin: 5px 0; color: #1f2937; font-weight: bold;">${order.orderNumber}</p>
          </div>
          <div>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Invoice Date:</strong></p>
            <p style="margin: 5px 0; color: #1f2937;">${invoiceDate}</p>
          </div>
          <div>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Pickup Date:</strong></p>
            <p style="margin: 5px 0; color: #1f2937;">${pickupTime}</p>
          </div>
          <div>
            <p style="margin: 5px 0; color: #6b7280;"><strong>Delivery Date:</strong></p>
            <p style="margin: 5px 0; color: #1f2937;">${deliveryTime}</p>
          </div>
        </div>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 5px 0; color: #6b7280;"><strong>Total Amount:</strong></p>
          <p style="margin: 5px 0; color: #059669; font-weight: bold; font-size: 24px;">${invoiceData.totalAmount.toFixed(3)} BD</p>
        </div>
      </div>

      <!-- Service Details -->
      ${invoiceData.items.length > 0 ? `
      <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; margin: 25px 0; border: 2px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; font-size: 20px;">🧾 Service Details</h3>
        <div style="max-height: 400px; overflow-y: auto;">
                     ${invoiceData.items.map(item => `
             <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 15px 0; border-bottom: 1px solid #e2e8f0;">
               <div style="flex: 1;">
                 <p style="margin: 0; font-weight: 600; color: #374151; font-size: 16px;">${item.serviceName}</p>
                 <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${item.itemName}</p>
                 ${item.notes ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280; font-style: italic;">${item.notes}</p>` : ''}
               </div>
               <div style="text-align: right; min-width: 120px;">
                 <p style="margin: 0; color: #6b7280; font-size: 14px;">Qty: ${item.quantity}</p>
                 <p style="margin: 0; color: #6b7280; font-size: 14px;">@ ${item.unitPrice.toFixed(3)} BD</p>
                 <p style="margin: 5px 0 0 0; font-weight: 600; color: #374151; font-size: 16px;">${item.totalPrice.toFixed(3)} BD</p>
               </div>
             </div>
           `).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-top: 2px solid #3b82f6; margin-top: 15px;">
          <span style="font-size: 20px; font-weight: bold; color: #1f2937;">Total Amount</span>
          <span style="font-size: 24px; font-weight: bold; color: #059669;">${invoiceData.totalAmount.toFixed(3)} BD</span>
        </div>
      </div>
      ` : ''}
      
             <!-- Payment Information -->
       ${paymentDetails || order.paymentStatus ? `
       <div style="background-color: ${isPaymentCompleted || order.paymentStatus === 'PAID' ? '#d1fae5' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid ${isPaymentCompleted || order.paymentStatus === 'PAID' ? '#059669' : '#f59e0b'};">
         <h4 style="margin: 0; color: ${isPaymentCompleted || order.paymentStatus === 'PAID' ? '#065f46' : '#92400e'}; font-size: 18px;">
           ${isPaymentCompleted || order.paymentStatus === 'PAID' ? '✅ Payment Confirmed' : '💰 Payment Information'}
         </h4>
         <div style="margin-top: 10px;">
           ${isPaymentCompleted || order.paymentStatus === 'PAID' ? `
             <p style="margin: 5px 0; color: #065f46;"><strong>Payment Status:</strong> Confirmed</p>
             <p style="margin: 5px 0; color: #065f46;"><strong>Payment Method:</strong> ${paymentDetails?.paymentMethod || 'Account Balance'}</p>
             ${paymentDetails?.transactionId ? `<p style="margin: 5px 0; color: #065f46;"><strong>Transaction ID:</strong> ${paymentDetails.transactionId}</p>` : ''}
             ${paymentDetails?.paymentDate ? `<p style="margin: 5px 0; color: #065f46;"><strong>Payment Date:</strong> ${formatUTCForDateDisplay(paymentDetails.paymentDate.toISOString())}</p>` : ''}
             <p style="margin: 5px 0; color: #065f46;"><strong>Amount Paid:</strong> ${invoiceData.totalAmount.toFixed(3)} BD</p>
           ` : `
             <p style="margin: 5px 0; color: #92400e;"><strong>Payment Status:</strong> Pending</p>
             <p style="margin: 5px 0; color: #92400e;"><strong>Amount Due:</strong> ${invoiceData.totalAmount.toFixed(3)} BD</p>
             <p style="margin: 10px 0 0 0; color: #92400e;">Please ensure your account balance is maintained to avoid any delays in service.</p>
           `}
         </div>
       </div>
       ` : ''}
      
      <!-- Payment Link -->
      ${hasPaymentLink ? `
      <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0277bd;">
        <h4 style="margin: 0; color: #0277bd; font-size: 18px;">💳 Secure Payment Link</h4>
        <p style="margin: 10px 0; color: #0277bd;">Click the button below to complete your payment securely:</p>
        <div style="text-align: center; margin-top: 15px;">
          <a href="${paymentLink}" style="display: inline-block; background-color: #0277bd; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Pay Now - ${invoiceData.totalAmount.toFixed(3)} BD
          </a>
        </div>
      </div>
      ` : ''}
      
      <!-- Next Steps -->
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
        <h4 style="margin: 0; color: #0c4a6e; font-size: 18px;">📱 Next Steps</h4>
        <p style="margin: 10px 0 0 0; color: #0c4a6e;">
          ${isPaymentCompleted 
            ? 'Your order has been confirmed and is now in our processing queue. We\'ll notify you at each stage of the process, from pickup to delivery. You can track your order status in your account dashboard.'
            : 'Your order is being processed. We\'ll notify you once it\'s ready for delivery. You can track your order status in your account dashboard.'
          }
        </p>
      </div>
      
      <!-- Action Buttons -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/customer/dashboard" 
           style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 10px;">
          View Order Details
        </a>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/customer/wallet" 
           style="display: inline-block; background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 10px;">
          Manage Wallet
        </a>
      </div>
      
      <!-- Contact Information -->
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">Need help? Contact us on WhatsApp:</p>
        <a href="https://wa.me/97333440841" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          📱 +973 3344 0841
        </a>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Thank you for choosing Laundry Link!</p>
        <p style="color: #9ca3af; font-size: 12px;">This is an automated invoice. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}

/**
 * Send professional invoice email to customer
 * @param orderId - The order ID
 * @param paymentDetails - Optional payment details
 * @param includePaymentLink - Whether to include payment link
 * @param paymentLink - Optional payment link URL
 * @returns Promise<boolean> - Success status
 */
export async function sendProfessionalInvoiceEmail(
  orderId: number,
  paymentDetails?: {
    paymentStatus: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentDate?: Date;
  },
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

    // Generate invoice data
    const subtotal = order.orderServiceMappings.reduce((total, mapping) => {
      return total + mapping.orderItems.reduce((itemTotal, item) => {
        return itemTotal + item.totalPrice;
      }, 0);
    }, 0);

    const invoiceData: InvoiceData = {
      totalAmount: order.invoiceTotal || subtotal,
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
      order,
      invoiceData,
      paymentDetails,
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
