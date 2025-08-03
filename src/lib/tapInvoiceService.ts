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
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if customer has sufficient wallet balance
      const customerWallet = await prisma.wallet.findUnique({
        where: { customerId: order.customerId },
      });

      const walletBalance = customerWallet?.balance || 0;
      const invoiceTotal = order.invoiceTotal || 0;
      const requiresPayment = walletBalance < invoiceTotal;

      if (!requiresPayment) {
        return {
          requiresPayment: false,
          walletBalance,
          invoiceTotal,
        };
      }

      // Calculate amount to charge
      const amountToCharge = invoiceTotal - walletBalance;

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

      return {
        requiresPayment: true,
        tapInvoice,
        walletBalance,
        invoiceTotal,
        amountToCharge,
      };
    } catch (error) {
      console.error('Error creating Tap invoice:', error);
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
          console.log('Phone data for Tap API (Bahrain):', phoneData);
        }
      } else {
        // For non-Bahrain numbers, log but don't include in API call
        console.log('Non-Bahrain phone number detected, omitting from Tap API:', cleanPhone);
      }
    }

    // Validate customer data
    if (!order.customer.firstName || !order.customer.lastName || !order.customer.email) {
      throw new Error('Customer data is incomplete. First name, last name, and email are required.');
    }

    // Validate and format amount
    if (!amount || amount <= 0) {
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

    console.log('Sending invoice data to Tap API:', JSON.stringify(invoiceData, null, 2));

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
      console.error('Tap API error:', errorText);
      console.error('Request data that failed:', JSON.stringify(invoiceData, null, 2));
      throw new Error(`Failed to create Tap invoice: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Tap API response:', data);
    return data;
  }
} 