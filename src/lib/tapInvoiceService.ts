import prisma from '@/lib/prisma';
import { tapConfig } from '@/lib/config/tapConfig';
import logger from './logger';

export interface TapInvoiceResult {
  requiresPayment: boolean;
  tapInvoice?: any;
  walletBalance: number;
  invoiceTotal: number;
  amountToCharge?: number;
}

export class TapInvoiceService {
  /**
   * Create Tap invoice if payment is required
   */
  static async createTapInvoiceIfNeeded(orderId: number): Promise<TapInvoiceResult> {
    try {
      logger.info(`Creating Tap invoice for order ${orderId}`);
      
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
        },
      });

      if (!order) {
        logger.error(`Order not found: ${orderId}`);
        throw new Error('Order not found');
      }

      // Check if customer has sufficient wallet balance
      const customerWallet = await prisma.wallet.findUnique({
        where: { customerId: order.customerId },
      });

      const walletBalance = customerWallet?.balance || 0;
      const invoiceTotal = order.invoiceTotal || 0;
      const requiresPayment = walletBalance < invoiceTotal;

      logger.info(`Order ${orderId} - Wallet balance: ${walletBalance}, Invoice total: ${invoiceTotal}, Requires payment: ${requiresPayment}`);

      if (!requiresPayment) {
        logger.info(`Order ${orderId} - No payment required, sufficient wallet balance`);
        return {
          requiresPayment: false,
          walletBalance,
          invoiceTotal,
        };
      }

      // Calculate amount to charge
      const amountToCharge = invoiceTotal - walletBalance;
      logger.info(`Order ${orderId} - Amount to charge: ${amountToCharge}`);

      // Create Tap invoice
      const tapInvoice = await this.createTapInvoice(order, amountToCharge);

      // Update order with Tap invoice information
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PENDING',
          paymentMethod: 'TAP_INVOICE',
          notes: order.notes 
            ? `${order.notes}\nTap Invoice ID: ${tapInvoice.id}`
            : `Tap Invoice ID: ${tapInvoice.id}`,
        },
      });

      // Create payment record
      await prisma.paymentRecord.create({
        data: {
          orderId: orderId,
          customerId: order.customerId,
          amount: amountToCharge,
          currency: 'BHD',
          paymentMethod: 'TAP_INVOICE',
          paymentStatus: 'PENDING',
          tapReference: tapInvoice.id,
          metadata: JSON.stringify({
            tapInvoiceId: tapInvoice.id,
            tapInvoiceUrl: tapInvoice.url,
            walletBalance,
            invoiceTotal,
            amountToCharge,
          }),
        },
      });

      logger.info(`Order ${orderId} - Tap invoice created successfully: ${tapInvoice.id}`);

      return {
        requiresPayment: true,
        tapInvoice,
        walletBalance,
        invoiceTotal,
        amountToCharge,
      };
    } catch (error) {
      logger.error(`Error creating Tap invoice for order ${orderId}:`, error);
      // Fallback to requiring payment
      return {
        requiresPayment: true,
        walletBalance: 0,
        invoiceTotal: 0,
      };
    }
  }

  /**
   * Create Tap invoice via Tap API
   */
  private static async createTapInvoice(order: any, amount: number): Promise<any> {
    logger.info(`Creating Tap invoice for order ${order.id} with amount ${amount}`);
    
    // Prepare phone number - only include if it's a Bahrain number
    let phoneData = undefined;
    if (order.customer.phone && order.customer.phone.trim()) {
      let cleanPhone = order.customer.phone.trim();
      
      // Check if it's a Bahrain number (starts with +973 or 973)
      const isBahrainNumber = cleanPhone.startsWith('+973') || cleanPhone.startsWith('973');
      
      if (isBahrainNumber) {
        // Remove country code prefixes for Bahrain numbers
        if (cleanPhone.startsWith('+973')) {
          cleanPhone = cleanPhone.substring(4);
        } else if (cleanPhone.startsWith('973')) {
          cleanPhone = cleanPhone.substring(3);
        }
        
        // Remove any non-digit characters except for spaces
        cleanPhone = cleanPhone.replace(/[^\d\s]/g, '').trim();
        
        if (cleanPhone && cleanPhone.length > 0) {
          phoneData = {
            country_code: '973',
            number: cleanPhone
          };
          logger.info(`Phone data for Tap API (Bahrain): ${JSON.stringify(phoneData)}`);
        }
      } else {
        // For non-Bahrain numbers, log but don't include in API call
        logger.info(`Non-Bahrain phone number detected, omitting from Tap API: ${cleanPhone}`);
      }
    }

    // Validate customer data
    if (!order.customer.firstName || !order.customer.lastName || !order.customer.email) {
      logger.error(`Customer data incomplete for order ${order.id}. Required: firstName, lastName, email`);
      throw new Error('Customer data is incomplete. First name, last name, and email are required.');
    }

    // Validate and format amount
    if (!amount || amount <= 0) {
      logger.error(`Invalid amount for invoice creation: ${amount}`);
      throw new Error('Invalid amount for invoice creation');
    }

    const invoiceData = {
      amount: parseFloat(amount.toFixed(3)), // Ensure proper decimal format
      currency: 'BHD',
      customer: {
        first_name: order.customer.firstName.trim(),
        last_name: order.customer.lastName.trim(),
        email: order.customer.email.trim(),
        phone: phoneData,
      },
      source: {
        id: 'src_all', // Allow all payment methods
      },
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/orders?orderId=${order.id}`,
      },
      post: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/tap-webhook`,
      },
      reference: {
        transaction: order.orderNumber,
        order: order.orderNumber,
      },
      description: `Payment for order ${order.orderNumber} - Laundry Link Services`,
      metadata: {
        orderId: order.id.toString(),
        orderNumber: order.orderNumber,
        customerId: order.customerId.toString(),
      },
    };

    logger.info(`Sending invoice data to Tap API for order ${order.id}:`, JSON.stringify(invoiceData, null, 2));

    const response = await fetch('https://api.tap.company/v2/invoices/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tapConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Tap API error for order ${order.id}: ${errorText}`);
      logger.error(`Request data that failed for order ${order.id}:`, JSON.stringify(invoiceData, null, 2));
      throw new Error(`Failed to create Tap invoice: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    logger.info(`Tap API response for order ${order.id}:`, data);
    return data;
  }
} 