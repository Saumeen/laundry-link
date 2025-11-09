import prisma from '@/lib/prisma';
import { tapConfig } from '@/lib/config/tapConfig';
import logger from './logger';
import { createInvoiceForOrder, getInvoice, cancelInvoice } from './tapInvoiceManagement';

export interface TapInvoiceResult {
  requiresPayment: boolean;
  tapInvoice?: any;
  walletBalance: number;
  invoiceTotal: number;
  amountToCharge?: number;
}

/**
 * Create Tap invoice if payment is required
 */
export const createTapInvoiceIfNeeded = async (orderId: number): Promise<TapInvoiceResult> => {
  try {
    logger.info(`Creating Tap invoice for order ${orderId}`);
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderServiceMappings: {
          include: {
            orderItems: true,
          },
        },
      },
    });

    if (!order) {
      logger.error(`Order not found: ${orderId}`);
      throw new Error('Order not found');
    }

    // Validate order has required fields
    if (!order.orderNumber) {
      logger.error(`Order ${orderId} missing orderNumber`);
      throw new Error('Order is missing order number');
    }

    if (!order.customer) {
      logger.error(`Order ${orderId} missing customer data`);
      throw new Error('Order is missing customer information');
    }

    if (!order.customer.firstName || !order.customer.lastName || !order.customer.email) {
      logger.error(`Order ${orderId} has incomplete customer data: firstName=${!!order.customer.firstName}, lastName=${!!order.customer.lastName}, email=${!!order.customer.email}`);
      throw new Error('Order has incomplete customer information');
    }

    // Check if order has service mappings
    if (order.orderServiceMappings.length === 0) {
      logger.error(`Order ${orderId} has no service mappings`);
      throw new Error('Order has no services. Cannot create invoice for order without services.');
    }

    // Check if order has items
    const hasItems = order.orderServiceMappings.some(mapping => 
      mapping.orderItems && mapping.orderItems.length > 0
    );
    
    logger.info(`Order ${orderId} - Service mappings: ${order.orderServiceMappings.length}, Has items: ${hasItems}`);
    
    if (!hasItems) {
      logger.error(`Order ${orderId} has no items`);
      throw new Error('Order has no items. Cannot create invoice for empty order.');
    }

    // Check if customer has sufficient wallet balance
    const customerWallet = await prisma.wallet.findUnique({
      where: { customerId: order.customerId },
    });

    const walletBalance = customerWallet?.balance || 0;
    let invoiceTotal = order.invoiceTotal || 0;
    
    // If invoice total is 0 or invalid, calculate it from order items
    if (invoiceTotal <= 0) {
      const calculatedTotal = order.orderServiceMappings.reduce((total, mapping) => {
        const mappingTotal = mapping.orderItems.reduce((itemTotal, item) => {
          return itemTotal + item.totalPrice;
        }, 0);
        return total + mappingTotal;
      }, 0);
      
      if (calculatedTotal > 0) {
        invoiceTotal = calculatedTotal;
        logger.info(`Order ${orderId} - Calculated invoice total from items: ${invoiceTotal}`);
      } else {
        logger.error(`Order ${orderId} has invalid invoice total: ${invoiceTotal}, calculated: ${calculatedTotal}`);
        throw new Error('Order has invalid invoice total. Invoice total must be greater than 0.');
      }
    }
    
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

    // Check for existing TAP_INVOICE payment records for this order
    const existingPaymentRecords = await prisma.paymentRecord.findMany({
      where: {
        orderId: orderId,
        paymentMethod: 'TAP_INVOICE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingPaymentRecords.length > 0) {
      // Check the most recent payment record
      const latestPayment = existingPaymentRecords[0];
      
      // If there's a pending payment, check if the invoice is still valid
      if (latestPayment.paymentStatus === 'PENDING' && latestPayment.tapReference) {
        try {
          logger.info(`Order ${orderId} - Found existing pending TAP_INVOICE payment ${latestPayment.id}, checking invoice status`);
          
          // Check invoice status via TAP API
          const invoice = await getInvoice(latestPayment.tapReference);
          const invoiceStatus = invoice.status?.toUpperCase();
          
          logger.info(`Order ${orderId} - Existing invoice ${latestPayment.tapReference} status: ${invoiceStatus}`);
          
          // If invoice is still pending/active, return existing invoice
          if (invoiceStatus === 'PENDING' || invoiceStatus === 'SENT' || invoiceStatus === 'OPEN') {
            logger.info(`Order ${orderId} - Existing invoice is still valid, returning existing invoice`);
            
            // Parse metadata to get invoice details
            let metadata: any = {};
            try {
              metadata = JSON.parse(latestPayment.metadata || '{}');
            } catch (e) {
              // If metadata parsing fails, create basic metadata
              metadata = {
                tapInvoiceId: latestPayment.tapReference,
                tapInvoiceUrl: invoice.url || '',
                walletBalance,
                invoiceTotal,
                amountToCharge,
              };
            }
            
            return {
              requiresPayment: true,
              tapInvoice: {
                id: latestPayment.tapReference,
                url: invoice.url || metadata.tapInvoiceUrl || '',
                status: invoiceStatus,
                amount: latestPayment.amount,
                currency: latestPayment.currency,
              },
              walletBalance,
              invoiceTotal,
              amountToCharge,
            };
          }
          
          // If invoice is paid/closed, payment should have been updated, but check anyway
          if (invoiceStatus === 'PAID' || invoiceStatus === 'CLOSED') {
            logger.warn(`Order ${orderId} - Existing invoice is ${invoiceStatus} but payment record is still PENDING, updating payment record`);
            
            // Update payment record to PAID
            await prisma.paymentRecord.update({
              where: { id: latestPayment.id },
              data: {
                paymentStatus: 'PAID',
                processedAt: new Date(),
                tapResponse: JSON.stringify(invoice),
              },
            });
            
            // Recalculate order payment status
            const { recalculateOrderPaymentStatus } = await import('@/lib/utils/paymentUtils');
            await recalculateOrderPaymentStatus(orderId);
            
            // Return that payment is complete
            return {
              requiresPayment: false,
              walletBalance,
              invoiceTotal,
            };
          }
          
          // If invoice is failed/expired/cancelled, we'll create a new one below
          if (invoiceStatus === 'FAILED' || invoiceStatus === 'EXPIRED' || invoiceStatus === 'CANCELLED') {
            logger.info(`Order ${orderId} - Existing invoice is ${invoiceStatus}, will create new invoice`);
            
            // Try to cancel the old invoice if it's not already cancelled
            if (invoiceStatus !== 'CANCELLED') {
              try {
                await cancelInvoice(latestPayment.tapReference);
                logger.info(`Order ${orderId} - Cancelled old invoice ${latestPayment.tapReference}`);
              } catch (cancelError) {
                logger.warn(`Order ${orderId} - Failed to cancel old invoice, continuing with new invoice creation:`, cancelError);
              }
            }
            
            // Update old payment record to FAILED
            await prisma.paymentRecord.update({
              where: { id: latestPayment.id },
              data: {
                paymentStatus: 'FAILED',
                tapResponse: JSON.stringify(invoice),
              },
            });
            
            // Continue to create new invoice below
          }
        } catch (invoiceCheckError) {
          logger.error(`Order ${orderId} - Error checking existing invoice status:`, invoiceCheckError);
          // If we can't check the invoice, assume it's invalid and create a new one
          logger.info(`Order ${orderId} - Unable to verify existing invoice, will create new invoice`);
        }
      } else if (latestPayment.paymentStatus === 'PAID') {
        // If payment is already paid, no need to create new invoice
        logger.info(`Order ${orderId} - Payment already completed, no invoice needed`);
        return {
          requiresPayment: false,
          walletBalance,
          invoiceTotal,
        };
      } else if (latestPayment.paymentStatus === 'FAILED' && latestPayment.tapReference) {
        // Check if the failed invoice is expired/cancelled and create new one
        try {
          const invoice = await getInvoice(latestPayment.tapReference);
          const invoiceStatus = invoice.status?.toUpperCase();
          
          if (invoiceStatus === 'EXPIRED' || invoiceStatus === 'CANCELLED') {
            logger.info(`Order ${orderId} - Previous invoice was ${invoiceStatus}, creating new invoice`);
            // Continue to create new invoice below
          } else {
            // Invoice might still be valid, return existing
            logger.info(`Order ${orderId} - Existing failed invoice status is ${invoiceStatus}, returning existing`);
            let metadata: any = {};
            try {
              metadata = JSON.parse(latestPayment.metadata || '{}');
            } catch (e) {
              metadata = {
                tapInvoiceId: latestPayment.tapReference,
                tapInvoiceUrl: invoice.url || '',
                walletBalance,
                invoiceTotal,
                amountToCharge,
              };
            }
            
            return {
              requiresPayment: true,
              tapInvoice: {
                id: latestPayment.tapReference,
                url: invoice.url || metadata.tapInvoiceUrl || '',
                status: invoiceStatus,
                amount: latestPayment.amount,
                currency: latestPayment.currency,
              },
              walletBalance,
              invoiceTotal,
              amountToCharge,
            };
          }
        } catch (error) {
          logger.error(`Order ${orderId} - Error checking failed invoice, creating new one:`, error);
          // Continue to create new invoice
        }
      }
    }

    // Create new Tap invoice (either no existing invoice or existing one is failed/expired)
    logger.info(`Order ${orderId} - Creating new TAP invoice`);
    const tapInvoice = await createTapInvoice(order, amountToCharge);

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
          isOrderPayment: true, // Mark as order payment for webhook handling
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
    
    // Provide more specific error handling
    if (error instanceof Error) {
      if (error.message.includes('Customer data is missing') || 
          error.message.includes('Customer data is incomplete') ||
          error.message.includes('Invalid email format')) {
        throw new Error(`Order ${orderId} has invalid customer data: ${error.message}`);
      }
      if (error.message.includes('Invalid amount')) {
        throw new Error(`Order ${orderId} has invalid amount: ${error.message}`);
      }
      if (error.message.includes('Order is empty')) {
        throw new Error(`Order ${orderId} data is incomplete for TAP API: ${error.message}`);
      }
    }
    
    // Re-throw the original error for better debugging
    throw error;
  }
};

/**
 * Create Tap invoice via Tap API
 */
const createTapInvoice = async (order: any, amount: number): Promise<any> => {
  logger.info(`Creating Tap invoice for order ${order.id} with amount ${amount}`);
  
  // Use the tapInvoiceManagement function
  return await createInvoiceForOrder(order, amount);
}; 