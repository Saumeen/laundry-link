import { tapConfig } from '@/lib/config/tapConfig';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export interface TapInvoiceData {
  id: string;
  url: string;
  status: string;
  amount: number;
  currency: string;
  created: number;
  due?: number;
  expiry?: number;
  track?: {
    status: string;
    link: string;
  };
  transactions?: Array<{
    id: string;
    status: string;
    amount: number;
  }>;
}

export interface TapInvoiceRequest {
  amount: number;
  currency: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: {
      country_code: string;
      number: string;
    };
  };
  order: {
    amount: number;
    currency: string;
    items: Array<{
      name: string;
      description: string;
      currency: string;
      amount: number;
      quantity: number;
    }>;
  };
  redirect: {
    url: string;
  };
  post: {
    url: string;
  };
  reference: {
    invoice: string;
    order: string;
  };
  description: string;
  metadata: Record<string, any>;
  notifications?: {
    dispatch: boolean;
    channels: string[];
  };
  due?: number;
  expiry?: number;
}

const API_BASE_URL = 'https://api.tap.company/v2';

/**
 * Create a new TAP invoice
 */
export const createInvoice = async (invoiceData: TapInvoiceRequest): Promise<any> => {
  try {
    logger.info('Creating TAP invoice:', JSON.stringify(invoiceData, null, 2));

    const response = await fetch(`${API_BASE_URL}/invoices/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tapConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    logger.info(`TAP API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`TAP API error for creating invoice: ${errorText}`);
      
      // Try to parse the error response as JSON for better error handling
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && errorJson.errors.length > 0) {
          const firstError = errorJson.errors[0];
          throw new Error(`TAP API Error (${firstError.code}): ${firstError.description}`);
        }
      } catch (parseError) {
        // If parsing fails, use the raw error text
      }
      
      throw new Error(`Failed to create TAP invoice: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    logger.info('TAP invoice created successfully:', data.id);
    return data;
  } catch (error) {
    logger.error('Error creating TAP invoice:', error);
    throw error;
  }
};

/**
 * Retrieve a TAP invoice by ID
 */
export const getInvoice = async (invoiceId: string): Promise<TapInvoiceData> => {
  try {
    logger.info(`Retrieving TAP invoice: ${invoiceId}`);

    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tapConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`TAP API error for getting invoice ${invoiceId}: ${errorText}`);
      throw new Error(`Failed to get TAP invoice: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    logger.info(`TAP invoice ${invoiceId} retrieved successfully`);

    return {
      id: data.id,
      url: data.url,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      created: data.created,
      due: data.due,
      expiry: data.expiry,
      track: data.trackable ? {
        status: data.trackable.status,
        link: data.trackable.link,
      } : undefined,
      transactions: data.transactions?.map((tx: any) => ({
        id: tx.id,
        status: tx.status,
        amount: tx.amount,
      })) || [],
    };
  } catch (error) {
    logger.error(`Error getting TAP invoice ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * Update a TAP invoice
 */
export const updateInvoice = async (invoiceId: string, updateData: Partial<TapInvoiceRequest>): Promise<any> => {
  try {
    logger.info(`Updating TAP invoice ${invoiceId}:`, JSON.stringify(updateData, null, 2));

    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tapConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`TAP API error for updating invoice ${invoiceId}: ${errorText}`);
      throw new Error(`Failed to update TAP invoice: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    logger.info(`TAP invoice ${invoiceId} updated successfully`);
    return data;
  } catch (error) {
    logger.error(`Error updating TAP invoice ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * Cancel a TAP invoice
 */
export const cancelInvoice = async (invoiceId: string): Promise<any> => {
  try {
    logger.info(`Cancelling TAP invoice: ${invoiceId}`);

    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tapConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`TAP API error for cancelling invoice ${invoiceId}: ${errorText}`);
      throw new Error(`Failed to cancel TAP invoice: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    logger.info(`TAP invoice ${invoiceId} cancelled successfully`);
    return data;
  } catch (error) {
    logger.error(`Error cancelling TAP invoice ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * Resend a TAP invoice notification
 */
export const resendInvoice = async (invoiceId: string, channels: string[] = ['SMS', 'EMAIL']): Promise<any> => {
  try {
    logger.info(`Resending TAP invoice ${invoiceId} via channels:`, channels);

    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/remind`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tapConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notifications: {
          channels,
          dispatch: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`TAP API error for resending invoice ${invoiceId}: ${errorText}`);
      throw new Error(`Failed to resend TAP invoice: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    logger.info(`TAP invoice ${invoiceId} resent successfully`);
    return data;
  } catch (error) {
    logger.error(`Error resending TAP invoice ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * List all TAP invoices with optional filters
 */
export const listInvoices = async (filters?: {
  limit?: number;
  skip?: number;
  date?: {
    from?: string;
    to?: string;
  };
  status?: string;
}): Promise<any> => {
  try {
    logger.info('Listing TAP invoices with filters:', filters);

    const response = await fetch(`${API_BASE_URL}/invoices/list`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tapConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters || {}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`TAP API error for listing invoices: ${errorText}`);
      throw new Error(`Failed to list TAP invoices: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    logger.info(`Retrieved ${data.data?.length || 0} TAP invoices`);
    return data;
  } catch (error) {
    logger.error('Error listing TAP invoices:', error);
    throw error;
  }
};

/**
 * Finalize a draft TAP invoice
 */
export const finalizeInvoice = async (invoiceId: string): Promise<any> => {
  try {
    logger.info(`Finalizing TAP invoice: ${invoiceId}`);

    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/finalize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tapConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`TAP API error for finalizing invoice ${invoiceId}: ${errorText}`);
      throw new Error(`Failed to finalize TAP invoice: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    logger.info(`TAP invoice ${invoiceId} finalized successfully`);
    return data;
  } catch (error) {
    logger.error(`Error finalizing TAP invoice ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * Get invoice tracking information
 */
export const getInvoiceTracking = async (invoiceId: string): Promise<any> => {
  try {
    logger.info(`Getting tracking info for TAP invoice: ${invoiceId}`);

    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tapConfig.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`TAP API error for getting invoice tracking ${invoiceId}: ${errorText}`);
      throw new Error(`Failed to get TAP invoice tracking: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    logger.info(`TAP invoice ${invoiceId} tracking retrieved successfully`);
    return data.trackable || null;
  } catch (error) {
    logger.error(`Error getting TAP invoice tracking ${invoiceId}:`, error);
    throw error;
  }
};

/**
 * Format phone number for TAP API
 */
const formatPhoneForTap = (phone: string): { country_code: string; number: string } | undefined => {
  if (!phone || !phone.trim()) return undefined;
  
  let cleanPhone = phone.trim();
  
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
      // Validate phone number format (should be 8 digits for Bahrain)
      if (!/^\d{8}$/.test(cleanPhone)) {
        logger.warn(`Invalid Bahrain phone number format: ${cleanPhone}. Expected 8 digits.`);
        return undefined;
      }
      
      // Limit phone number length for TAP API
      const limitedPhone = cleanPhone.substring(0, 15);
      return {
        country_code: '973',
        number: limitedPhone
      };
    }
  }
  
  return undefined;
};

/**
 * Validate customer data for invoice creation
 */
const validateCustomerData = (customer: any): void => {
  if (!customer) {
    throw new Error('Customer data is missing. Order must include customer information.');
  }
  
  if (!customer.firstName || !customer.lastName || !customer.email) {
    throw new Error(`Customer data is incomplete. Required fields: firstName=${!!customer.firstName}, lastName=${!!customer.lastName}, email=${!!customer.email}`);
  }

  // Check if names are not empty after trimming
  if (!customer.firstName.trim() || !customer.lastName.trim() || !customer.email.trim()) {
    throw new Error(`Customer data is incomplete after trimming. Required fields: firstName="${customer.firstName}", lastName="${customer.lastName}", email="${customer.email}"`);
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer.email)) {
    throw new Error(`Invalid email format: ${customer.email}`);
  }

  // Validate email length
  if (customer.email.length > 100) {
    throw new Error(`Email is too long: ${customer.email.length} characters. Maximum length is 100 characters.`);
  }

  // Validate name format (should contain only letters, spaces, hyphens, and apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(customer.firstName)) {
    throw new Error(`Invalid first name format: ${customer.firstName}`);
  }
  if (!nameRegex.test(customer.lastName)) {
    throw new Error(`Invalid last name format: ${customer.lastName}`);
  }

  // Validate name length
  if (customer.firstName.length > 50) {
    throw new Error(`First name is too long: ${customer.firstName.length} characters. Maximum length is 50 characters.`);
  }
  if (customer.lastName.length > 50) {
    throw new Error(`Last name is too long: ${customer.lastName.length} characters. Maximum length is 50 characters.`);
  }
};

/**
 * Validate amount for invoice creation
 */
const validateAmount = (amount: number): void => {
  if (amount === null || amount === undefined) {
    throw new Error('Amount is required for invoice creation');
  }
  
  if (amount <= 0) {
    throw new Error(`Invalid amount for invoice creation: ${amount}. Amount must be greater than 0.`);
  }
  
  // Ensure amount is a valid number
  if (isNaN(amount) || !isFinite(amount)) {
    throw new Error(`Invalid amount format: ${amount}`);
  }

  // Ensure amount is not too small (TAP API minimum is typically 0.100 BHD)
  if (amount < 0.1) {
    throw new Error(`Amount ${amount} is too small. Minimum amount is 0.100 BHD.`);
  }

  // Ensure amount is not too large (TAP API maximum is typically 50,000 BHD)
  if (amount > 50000) {
    throw new Error(`Amount ${amount} is too large. Maximum amount is 50,000 BHD.`);
  }
};

/**
 * Create invoice for an order with proper customer data formatting
 */
export const createInvoiceForOrder = async (order: any, amount: number): Promise<any> => {
  try {
    // Log the order data for debugging
    logger.info(`Creating invoice for order: ${JSON.stringify({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customer: order.customer ? {
        firstName: order.customer.firstName,
        lastName: order.customer.lastName,
        email: order.customer.email,
        phone: order.customer.phone
      } : 'MISSING_CUSTOMER_DATA'
    }, null, 2)}`);

    // Validate customer data
    validateCustomerData(order.customer);
    
    // Validate and format amount
    validateAmount(amount);

    // Format phone number
    const phoneData = formatPhoneForTap(order.customer.phone);
    if (phoneData) {
      logger.info(`Phone data for Tap API (Bahrain): ${JSON.stringify(phoneData)}`);
    } else if (order.customer.phone) {
      logger.info(`Non-Bahrain phone number detected, omitting from Tap API: ${order.customer.phone}`);
    }

    // Validate order number
    if (!order.orderNumber || order.orderNumber.trim() === '') {
      throw new Error('Order number is required for TAP invoice creation');
    }

    // Validate order number format (should be alphanumeric)
    if (!/^[a-zA-Z0-9_-]+$/.test(order.orderNumber.trim())) {
      throw new Error('Order number contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed.');
    }

    // Validate order number length
    if (order.orderNumber.length > 50) {
      throw new Error(`Order number is too long: ${order.orderNumber.length} characters. Maximum length is 50 characters.`);
    }

    // Validate customer ID
    if (!order.customerId || order.customerId <= 0) {
      throw new Error('Valid customer ID is required for TAP invoice creation');
    }

    // Validate order ID
    if (!order.id || order.id <= 0) {
      throw new Error('Valid order ID is required for TAP invoice creation');
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');
    }

    // Validate URL format
    try {
      new URL(process.env.NEXT_PUBLIC_APP_URL);
    } catch (error) {
      throw new Error(`Invalid NEXT_PUBLIC_APP_URL format: ${process.env.NEXT_PUBLIC_APP_URL}`);
    }

    // Validate TAP configuration
    if (!tapConfig.secretKey || tapConfig.secretKey.trim() === '') {
      throw new Error('TAP secret key is not configured or is empty');
    }

    // Prepare order items for TAP API
    const orderItems = order.orderServiceMappings?.flatMap((mapping: any) => 
      mapping.orderItems?.map((item: any) => ({
        name: item.itemName.substring(0, 100), // Limit name length
        description: `Laundry service for ${item.itemName}`.substring(0, 200), // Limit description length
        currency: 'BHD',
        amount: Math.round(item.pricePerItem * 1000) / 1000, // Ensure proper decimal format
        quantity: item.quantity,
      })) || []
    ) || [];

    logger.info(`Order ${order.id} - Prepared ${orderItems.length} items for TAP API`);
    logger.info(`Order ${order.id} - Order items: ${JSON.stringify(orderItems, null, 2)}`);

    // Calculate total from items
    const itemsTotal = orderItems.reduce((total: number, item: any) => total + (item.amount * item.quantity), 0);

    // Validate that we have order items
    if (orderItems.length === 0) {
      throw new Error('No order items found. Cannot create TAP invoice without items.');
    }

    // Validate each item
    orderItems.forEach((item: any, index: number) => {
      if (!item.name || item.name.trim() === '') {
        throw new Error(`Item ${index + 1} has no name`);
      }
      if (!item.amount || item.amount <= 0) {
        throw new Error(`Item ${index + 1} has invalid amount: ${item.amount}`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Item ${index + 1} has invalid quantity: ${item.quantity}`);
      }
    });

    // Validate items total
    if (itemsTotal <= 0) {
      throw new Error(`Invalid items total: ${itemsTotal}. Items total must be greater than 0.`);
    }

    // Validate that the amount matches the items total (with small tolerance for rounding)
    const amountDifference = Math.abs(amount - itemsTotal);
    if (amountDifference > 0.001) {
      logger.warn(`Amount mismatch: requested amount ${amount} vs items total ${itemsTotal}, difference: ${amountDifference}`);
    }

    // Calculate due date and expiry - 24 hours from now
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const dueTimestamp = currentTimestamp + (24 * 60 * 60); // 24 hours from now
    const expiryTimestamp = currentTimestamp + (24 * 60 * 60); // 24 hours from now (same as due for simplicity)
    
    logger.info(`Due/Expiry date calculation: current=${currentTimestamp}, due=${dueTimestamp}, expiry=${expiryTimestamp}, difference=${dueTimestamp - currentTimestamp} seconds`);
    logger.info(`Due/Expiry date in human readable: current=${new Date(currentTimestamp * 1000).toISOString()}, due=${new Date(dueTimestamp * 1000).toISOString()}, expiry=${new Date(expiryTimestamp * 1000).toISOString()}`);

    // Validate due date is in the future
    if (dueTimestamp <= currentTimestamp) {
      throw new Error(`Invalid due date: due timestamp (${dueTimestamp}) must be greater than current timestamp (${currentTimestamp})`);
    }

    // Validate due date is not too far in the future (max 30 days)
    const maxDueTimestamp = currentTimestamp + (30 * 24 * 60 * 60); // 30 days from now
    if (dueTimestamp > maxDueTimestamp) {
      throw new Error(`Due date too far in the future: ${dueTimestamp} (max allowed: ${maxDueTimestamp})`);
    }

    const invoiceData: TapInvoiceRequest = {
      amount: Math.round(amount * 1000) / 1000, // Ensure proper decimal format (3 decimal places)
      currency: 'BHD',
      customer: {
        first_name: order.customer.firstName.trim().substring(0, 50), // Limit first name length
        last_name: order.customer.lastName.trim().substring(0, 50), // Limit last name length
        email: order.customer.email.trim().substring(0, 100), // Limit email length
        phone: phoneData,
      },
      order: {
        amount: Math.round(itemsTotal * 1000) / 1000, // Total from items
        currency: 'BHD',
        items: orderItems,
      },
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/orders?orderId=${order.id}`,
      },
      post: {
        url: `${process.env.WEBHOOK_URL}/api/payment/tap-webhook`,
      },
      reference: {
        invoice: `inv_${order.orderNumber.trim()}`,
        order: order.orderNumber.trim(),
      },
      description: `Payment for order ${order.orderNumber.trim()} - Laundry Link Services`,
      metadata: {
        orderId: order.id.toString(),
        orderNumber: order.orderNumber.trim(),
        customerId: order.customerId.toString(),
      },
      notifications: {
        dispatch: true,
        channels: ['SMS', 'EMAIL'],
      },
      due: dueTimestamp * 1000, // Convert to milliseconds for TAP API
      expiry: expiryTimestamp * 1000 // Convert to milliseconds for TAP API
    };

    // Log the invoice data being sent to TAP API
    logger.info(`Sending invoice data to TAP API: ${JSON.stringify(invoiceData, null, 2)}`);

    // Additional validation before sending to TAP API
    if (!invoiceData.amount || invoiceData.amount <= 0) {
      throw new Error(`Invalid amount for TAP API: ${invoiceData.amount}`);
    }

    if (!invoiceData.customer.first_name || !invoiceData.customer.last_name || !invoiceData.customer.email) {
      throw new Error('Customer data is incomplete for TAP API');
    }

    if (!invoiceData.reference.invoice || !invoiceData.reference.order) {
      throw new Error('Reference data is incomplete for TAP API');
    }

    return await createInvoice(invoiceData);
  } catch (error) {
    logger.error(`Error creating invoice for order ${order.id}:`, error);
    throw error;
  }
}; 