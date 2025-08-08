import { processTapPaymentResponse, createWalletForCustomer, processWalletTransaction } from './walletUtils';
import prisma from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';
import logger from '@/lib/logger';

// Tap API Configuration
const TAP_API_BASE_URL = process.env.TAP_API_BASE_URL || 'https://api.tap.company/v2';
const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY;

if (!TAP_SECRET_KEY) {
  logger.error('TAP_SECRET_KEY environment variable is not configured');
  throw new Error('TAP payment gateway is not properly configured');
}

export interface TapChargeRequest {
  amount: number;
  currency: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  source: {
    id: string; // Token ID from Tap
  };
  redirect?: {
    url: string;
  };
  post?: {
    url: string; // Webhook URL
  };
  reference?: {
    transaction: string; // Your order number
    isWalletTopUp: boolean;
    isOrderPayment: boolean;
  };
  description?: string;
  metadata?: Record<string, any>;
  statement_descriptor?: string; // Appears on customer's statement
  receipt?: {
    email: boolean;
    sms: boolean;
  };
}

export interface TapAuthorizeRequest {
  amount: number;
  currency: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  source: {
    id: string; // Token ID from Tap
  };
  redirect?: {
    url: string;
  };
  post?: {
    url: string; // Webhook URL
  };
  reference?: {
    transaction: string; // Your order number
  };
  description?: string;
  metadata?: Record<string, any>;
  auto?: {
    type: 'AUTO' | 'VOID';
    time: number; // Hours
  };
}

export interface TapTokenRequest {
  card: {
    number: string;
    expiry: {
      month: number;
      year: number;
    };
    cvc: string;
    name: string;
  };
}

export interface TapEncryptedTokenRequest {
  encrypted_card: {
    number: string;
    expiry_month: string;
    expiry_year: string;
    cvc: string;
    name: string;
  };
}

/**
 * Create a Tap token for card details
 */
export async function createTapToken(tokenData: TapTokenRequest) {
  try {
    logger.info(`Creating Tap token: ${JSON.stringify(tokenData)}`);
    const response = await fetch(`${TAP_API_BASE_URL}/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenData)
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      const errorMessage = errorData.message || response.statusText;
      
      // Log the full error for debugging
      logger.error('Tap token creation failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      // Provide specific error message based on response status
      if (response.status === 401) {
        throw new Error(`Tap token creation failed: Unauthorized`);
      } else if (response.status === 400) {
        throw new Error(`Tap token creation failed: ${errorMessage}`);
      } else {
        throw new Error(`Tap token creation failed: ${errorMessage}`);
      }
    }

    return await response.json();
  } catch (error) {
    logger.error('Error creating Tap token:', error);
    
    // Re-throw the original error if it's already informative
    if (error instanceof Error && error.message.includes('Tap token creation failed')) {
      throw error;
    }
    
    throw new Error('Failed to create Tap token');
  }
}

/**
 * Create a Tap token for encrypted card details
 */
export async function createTapEncryptedToken(tokenData: TapEncryptedTokenRequest) {
  try {
    const response = await fetch(`${TAP_API_BASE_URL}/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenData)
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(`Tap encrypted token creation failed: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error creating Tap encrypted token:', error);
    throw new Error('Failed to create Tap encrypted token');
  }
}

/**
 * Create a Tap charge
 */
export async function createTapCharge(chargeData: TapChargeRequest) {
  try {
    logger.info('Creating Tap charge with data:', {
      amount: chargeData.amount,
      currency: chargeData.currency,
      customer: chargeData.customer,
      reference: chargeData.reference,
      description: chargeData.description,
      // Don't log sensitive data like source.id (token)
    });

    const response = await fetch(`${TAP_API_BASE_URL}/charges`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chargeData)
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      logger.error('Tap charge creation failed with error data:', {
        status: response.status,
        statusText: response.statusText,
        errorData: JSON.stringify(errorData) // Properly stringify the error object
      });
      
      // Provide more detailed error messages
      let errorMessage = `Tap charge creation failed: ${response.statusText}`;
      if (errorData) {
        if (errorData.message) {
          errorMessage = `Tap charge creation failed: ${errorData.message}`;
        } else if (errorData.error) {
          errorMessage = `Tap charge creation failed: ${errorData.error}`;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = `Tap charge creation failed: ${errorData.errors.join(', ')}`;
        } else if (typeof errorData === 'string') {
          errorMessage = `Tap charge creation failed: ${errorData}`;
        } else {
          // Handle case where errorData is an object but doesn't have expected properties
          errorMessage = `Tap charge creation failed: ${JSON.stringify(errorData)}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const responseData = await response.json() as { 
      id: string; 
      status: string; 
      reference?: { transaction: string }; 
      [key: string]: unknown 
    };
    
    logger.info('Tap charge created successfully:', {
      id: responseData.id,
      status: responseData.status,
      reference: responseData.reference
    });
    
    return responseData;
  } catch (error) {
    logger.error('Error creating Tap charge:', error);
    
    // Re-throw the original error if it's already a structured error
    if (error instanceof Error && error.message.includes('Tap charge creation failed')) {
      throw error;
    }
    
    throw new Error('Failed to create Tap charge');
  }
}

/**
 * Create a Tap authorization
 */
export async function createTapAuthorize(authorizeData: TapAuthorizeRequest) {
  try {
    const response = await fetch(`${TAP_API_BASE_URL}/authorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(authorizeData)
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(`Tap authorization failed: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error creating Tap authorization:', error);
    throw new Error('Failed to create Tap authorization');
  }
}

/**
 * Retrieve a Tap charge
 */
export async function getTapCharge(chargeId: string) {
  try {
    const response = await fetch(`${TAP_API_BASE_URL}/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(`Tap charge retrieval failed: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error retrieving Tap charge:', error);
    throw new Error('Failed to retrieve Tap charge');
  }
}

/**
 * Retrieve a Tap authorization
 */
export async function getTapAuthorize(authorizeId: string) {
  try {
    const response = await fetch(`${TAP_API_BASE_URL}/authorize/${authorizeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(`Tap authorization retrieval failed: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error retrieving Tap authorization:', error);
    throw new Error('Failed to retrieve Tap authorization');
  }
}

/**
 * List all Tap charges
 */
export async function listTapCharges(filters?: {
  limit?: number;
  skip?: number;
  date?: {
    from?: string;
    to?: string;
  };
  status?: string;
}) {
  try {
    const response = await fetch(`${TAP_API_BASE_URL}/charges`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filters || {})
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(`Tap charges listing failed: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error listing Tap charges:', error);
    throw new Error('Failed to list Tap charges');
  }
}

/**
 * Process payment with Tap
 */
export async function processTapPayment(
  customerId: number,
  orderId: number,
  amount: number,
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  },
  tokenId: string,
  description?: string,
  isWalletTopUp: boolean = false
) {
  try {
    // Create payment record
    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        customerId,
        orderId: orderId !== 0 ? orderId : null,
        amount,
        currency: 'BHD',
        paymentMethod: 'TAP_PAY',
        description: description || `Payment for order ${orderId}`,
        paymentStatus: PaymentStatus.IN_PROGRESS
      }
    });

    // If this is a wallet top-up, create a pending wallet transaction
    let pendingWalletTransaction = null;
    if (isWalletTopUp) {
      const wallet = await createWalletForCustomer(customerId);
      pendingWalletTransaction = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          transactionType: 'DEPOSIT',
          amount,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance, // Will be updated when payment is confirmed
          description: `Wallet top-up - ${description || `${amount} BHD`}`,
          reference: `Payment: ${paymentRecord.id}`,
          metadata: JSON.stringify({
            paymentRecordId: paymentRecord.id,
            status: 'PENDING',
            tapPaymentInProgress: true
          }),
          status: 'PENDING',
          processedAt: null
        }
      });

      // Link the payment record to the wallet transaction
      await prisma.paymentRecord.update({
        where: { id: paymentRecord.id },
        data: { walletTransactionId: pendingWalletTransaction.id }
      });
    }

    // Create Tap charge
    const chargeData: TapChargeRequest = {
      amount: amount * 1000, // Convert to fils (Tap uses smallest currency unit)
      currency: 'BHD',
      customer: {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone
      },
      source: {
        id: tokenId
      },
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?payment_id=${paymentRecord.id}`
      },
      post: {
        url: `${process.env.WEBHOOK_URL}/api/payment/tap-webhook`
      },
      reference: {
        transaction: isWalletTopUp ? `WALLET_TOPUP_${paymentRecord.id}` : `ORDER_${orderId}`,
        isWalletTopUp: isWalletTopUp,
        isOrderPayment: !isWalletTopUp
      },
      description: description || (isWalletTopUp ? 'Wallet top-up' : `Payment for order ${orderId}`),
      statement_descriptor: 'LAUNDRY LINK',
      receipt: {
        email: true,
        sms: false
      },
      metadata: {
        paymentRecordId: paymentRecord.id,
        orderId,
        customerId,
        isWalletTopUp,
        walletTransactionId: pendingWalletTransaction?.id
      }
    };

    logger.info('Creating Tap charge for payment record:', {
      paymentRecordId: paymentRecord.id,
      orderId,
      amount,
      isWalletTopUp
    });

    const tapResponse = await createTapCharge(chargeData) as any;

    if (!tapResponse) {
      throw new Error('Failed to create Tap charge - no response received');
    }

    logger.info('Tap charge created successfully:', {
      paymentRecordId: paymentRecord.id,
      tapTransactionId: tapResponse?.id,
      tapStatus: tapResponse?.status,
      orderId
    });

    // Update payment record with Tap response
    await processTapPaymentResponse(
      paymentRecord.id,
      tapResponse,
      tapResponse.status === 'CAPTURED' ? 'PAID' : 'PENDING',
      {
        paymentRecordId: paymentRecord.id,
        orderId,
        customerId,
        isWalletTopUp,
        isOrderPayment: !isWalletTopUp,
        walletTransactionId: pendingWalletTransaction?.id
      }
    );

    // If this is a wallet top-up and we have a pending transaction, update it with TAP ID
    if (isWalletTopUp && pendingWalletTransaction && tapResponse.id) {
      await prisma.walletTransaction.update({
        where: { id: pendingWalletTransaction.id },
        data: {
          metadata: JSON.stringify({
            paymentRecordId: paymentRecord.id,
            status: 'PENDING',
            tapPaymentInProgress: true,
            tapTransactionId: tapResponse.id,
            tapChargeId: tapResponse.charge?.id || null
          })
        }
      });
    }

    return {
      paymentRecord,
      tapResponse,
      redirectUrl: tapResponse.transaction?.url || tapResponse.redirect?.url,
      pendingWalletTransaction
    };
  } catch (error) {
    logger.error('Error processing Tap payment:', error);
    throw error;
  }
}

/**
 * Process card payment for orders (not wallet top-ups)
 * This function is specifically for order payments and doesn't create wallet transactions
 */
export async function processCardPayment(
  customerId: number,
  orderId: number,
  amount: number,
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  },
  tokenId: string,
  description?: string
) {
  try {
    // Create payment record
    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        customerId,
        orderId: orderId !== 0 ? orderId : null,
        amount,
        currency: 'BHD',
        paymentMethod: 'TAP_PAY',
        description: description || `Payment for order ${orderId}`,
        paymentStatus: PaymentStatus.IN_PROGRESS
      }
    });

    // Create Tap charge
    const chargeData: TapChargeRequest = {
      amount: amount * 1000, // Convert to fils (Tap uses smallest currency unit)
      currency: 'BHD',
      customer: {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone
      },
      source: {
        id: tokenId
      },
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?payment_id=${paymentRecord.id}`
      },
      post: {
        url: `${process.env.WEBHOOK_URL}/api/payment/tap-webhook`
      },
      reference: {
        transaction: `ORDER_${orderId}`,
        isWalletTopUp: false,
        isOrderPayment: true
      },
      description: description || `Payment for order ${orderId}`,
      statement_descriptor: 'LAUNDRY LINK',
      receipt: {
        email: true,
        sms: false
      },
      metadata: {
        paymentRecordId: paymentRecord.id,
        orderId,
        customerId,
        isWalletTopUp: false,
        isOrderPayment: true
      }
    };

    logger.info('Creating Tap charge for card payment:', {
      paymentRecordId: paymentRecord.id,
      orderId,
      amount
    });

    const tapResponse = await createTapCharge(chargeData) as any;

    if (!tapResponse) {
      throw new Error('Failed to create Tap charge - no response received');
    }

    logger.info('Tap charge created successfully for card payment:', {
      paymentRecordId: paymentRecord.id,
      tapTransactionId: tapResponse?.id,
      tapStatus: tapResponse?.status,
      orderId
    });

    // Update payment record with Tap response
    await processTapPaymentResponse(
      paymentRecord.id,
      tapResponse,
      tapResponse.status === 'CAPTURED' ? 'PAID' : 'PENDING',
      {
        paymentRecordId: paymentRecord.id,
        orderId,
        customerId,
        isWalletTopUp: false,
        isOrderPayment: true
      }
    );

    return {
      paymentRecord,
      tapResponse,
      redirectUrl: tapResponse.transaction?.url || tapResponse.redirect?.url,
      pendingWalletTransaction: null // No wallet transaction for card payments
    };
  } catch (error) {
    logger.error('Error processing card payment:', error);
    throw error;
  }
}

/**
 * Handle Tap webhook
 */
export async function handleTapWebhook(webhookData: any) {
  try {
    // Extract payment record ID from metadata
    const metadata = webhookData.metadata;
    const paymentRecordId = metadata?.paymentRecordId;
    const walletTransactionId = metadata?.walletTransactionId;

    if (!paymentRecordId) {
      throw new Error('Payment record ID not found in webhook metadata');
    }

    // Update payment record based on webhook status
    let status: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING';
    
    switch (webhookData.status) {
      case 'CAPTURED':
        status = 'PAID';
        break;
      case 'DECLINED':
      case 'CANCELLED':
      case 'FAILED':
        status = 'FAILED';
        break;
      default:
        status = 'PENDING';
    }

    await processTapPaymentResponse(paymentRecordId, webhookData, status, metadata);

    // Check if this is an order payment - if so, don't add money to wallet
    if (metadata?.isOrderPayment) {
      logger.info('Order payment detected in webhook - not adding money to wallet:', {
        paymentRecordId,
        amount: webhookData.amount / 1000,
        orderId: metadata.orderId
      });
      return { success: true, status };
    }

    // If this is a wallet top-up, handle the wallet transaction
    // Only process wallet transactions for wallet top-ups, not for order payments
    if (metadata?.isWalletTopUp && !metadata?.isOrderPayment && walletTransactionId) {
      const walletTransaction = await prisma.walletTransaction.findUnique({
        where: { id: walletTransactionId },
        include: {
          paymentRecords: true // Include linked payment records
        }
      });

      if (walletTransaction) {
        if (status === 'PAID') {
          // Update the pending wallet transaction to completed
          const wallet = await prisma.wallet.findUnique({
            where: { id: walletTransaction.walletId }
          });

          if (wallet) {
            const newBalance = wallet.balance + walletTransaction.amount;
            
            await prisma.$transaction(async (tx) => {
              // Update wallet transaction
              await tx.walletTransaction.update({
                where: { id: walletTransactionId },
                data: {
                  status: 'COMPLETED',
                  balanceAfter: newBalance,
                  processedAt: new Date(),
                  metadata: JSON.stringify({
                    paymentRecordId,
                    status: 'COMPLETED',
                    tapTransactionId: webhookData.id,
                    tapChargeId: webhookData.charge?.id || null,
                    processedAt: new Date().toISOString()
                  })
                }
              });

              // Update wallet balance
              await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                  balance: newBalance,
                  lastTransactionAt: new Date()
                }
              });

              // Update linked payment records
              for (const paymentRecord of walletTransaction.paymentRecords) {
                await tx.paymentRecord.update({
                  where: { id: paymentRecord.id },
                  data: {
                    paymentStatus: 'PAID',
                    processedAt: new Date(),
                    tapTransactionId: webhookData.id,
                    tapResponse: JSON.stringify(webhookData),
                    updatedAt: new Date()
                  }
                });

                // Update order payment status if this is an order payment
                if (paymentRecord.orderId) {
                  await tx.order.update({
                    where: { id: paymentRecord.orderId },
                    data: {
                      paymentStatus: 'PAID',
                      updatedAt: new Date()
                    }
                  });
                }
              }
            });
          }
        } else if (status === 'FAILED') {
          // Update the pending wallet transaction to failed
          await prisma.$transaction(async (tx) => {
            // Update wallet transaction
            await tx.walletTransaction.update({
              where: { id: walletTransactionId },
              data: {
                status: 'FAILED',
                processedAt: new Date(),
                metadata: JSON.stringify({
                  paymentRecordId,
                  status: 'FAILED',
                  tapTransactionId: webhookData.id,
                  tapChargeId: webhookData.charge?.id || null,
                  failureReason: webhookData.failure_reason || 'Payment failed',
                  processedAt: new Date().toISOString()
                })
              }
            });

            // Update linked payment records
            for (const paymentRecord of walletTransaction.paymentRecords) {
              await tx.paymentRecord.update({
                where: { id: paymentRecord.id },
                data: {
                  paymentStatus: 'FAILED',
                  failureReason: webhookData.failure_reason || 'Payment failed',
                  processedAt: new Date(),
                  tapResponse: JSON.stringify(webhookData),
                  updatedAt: new Date()
                }
              });

              // Update order payment status if this is an order payment
              if (paymentRecord.orderId) {
                await tx.order.update({
                  where: { id: paymentRecord.orderId },
                  data: {
                    paymentStatus: 'FAILED',
                    updatedAt: new Date()
                  }
                });
              }
            }
          });
        }
      }
    }

    // Legacy handling for backward compatibility
    if (status === 'PAID' && metadata?.isWalletTopUp && !walletTransactionId) {
      const wallet = await createWalletForCustomer(metadata.customerId);
      await processWalletTransaction({
        walletId: wallet.id,
        transactionType: 'DEPOSIT',
        amount: webhookData.amount / 1000, // Convert from fils to BHD
        description: `Wallet top-up via TAP payment`,
        reference: `Payment: ${paymentRecordId}`,
        metadata: JSON.stringify({
          paymentRecordId,
          tapTransactionId: webhookData.id,
          tapChargeId: webhookData.charge?.id || null
        })
      });
    }

    return { success: true, status };
  } catch (error) {
    logger.error('Error handling Tap webhook:', error);
    throw error;
  }
}

/**
 * Validate Tap webhook signature
 */
export function validateTapWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    logger.error('Error validating Tap webhook signature:', error);
    return false;
  }
}

/**
 * Create a refund for a Tap charge
 */
export async function createTapRefund(chargeId: string, amount: number, reason?: string) {
  try {
    const response = await fetch(`${TAP_API_BASE_URL}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAP_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        charge_id: chargeId,
        amount: amount * 1000, // Convert to fils
        reason: reason || 'Customer request'
      })
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(`Tap refund creation failed: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error creating Tap refund:', error);
    throw new Error('Failed to create Tap refund');
  }
} 