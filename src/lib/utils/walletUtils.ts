import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface WalletTransactionData {
  walletId: number;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT' | 'TRANSFER';
  amount: number;
  description: string;
  reference?: string;
  metadata?: string;
}

export interface PaymentRecordData {
  customerId: number;
  orderId?: number;
  amount: number;
  currency?: string;
  paymentMethod: 'WALLET' | 'CARD' | 'CASH' | 'BANK_TRANSFER' | 'TAP_PAY' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'SAMSUNG_PAY';
  description?: string;
  // Tap Payment fields
  tapChargeId?: string;
  tapAuthorizeId?: string;
  tapTransactionId?: string;
  tapReference?: string;
  tapResponse?: string;
  // Card information
  cardLastFour?: string;
  cardBrand?: string;
  cardExpiry?: string;
}

export interface TapResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  reference?: string;
  charge?: { id: string };
  authorize?: { id: string };
  source?: {
    card?: {
      last4: string;
      brand: string;
      exp_month: number;
      exp_year: number;
    };
  };
  created?: number;
  live_mode?: boolean;
}

/**
 * Create a wallet for a customer if it doesn't exist
 */
export async function createWalletForCustomer(customerId: number) {
  try {
    const existingWallet = await prisma.wallet.findUnique({
      where: { customerId }
    });

    if (existingWallet) {
      return existingWallet;
    }

    const wallet = await prisma.wallet.create({
      data: {
        customerId,
        balance: 0,
        currency: 'BHD',
        isActive: true
      }
    });

    return wallet;
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw new Error('Failed to create wallet');
  }
}

/**
 * Get wallet balance for a customer
 */
export async function getWalletBalance(customerId: number) {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { customerId }
    });

    return wallet?.balance || 0;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw new Error('Failed to get wallet balance');
  }
}

/**
 * Process a wallet transaction
 */
export async function processWalletTransaction(transactionData: WalletTransactionData) {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { id: transactionData.walletId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (!wallet.isActive) {
      throw new Error('Wallet is not active');
    }

    const balanceBefore = wallet.balance;
    let balanceAfter = balanceBefore;

    // Calculate new balance based on transaction type
    switch (transactionData.transactionType) {
      case 'DEPOSIT':
      case 'REFUND':
        balanceAfter = balanceBefore + transactionData.amount;
        break;
      case 'WITHDRAWAL':
      case 'PAYMENT':
        if (balanceBefore < transactionData.amount) {
          throw new Error('Insufficient wallet balance');
        }
        balanceAfter = balanceBefore - transactionData.amount;
        break;
      case 'ADJUSTMENT':
        balanceAfter = transactionData.amount; // Direct balance adjustment
        break;
      default:
        throw new Error('Invalid transaction type');
    }

    // Create transaction record
    const transaction = await prisma.walletTransaction.create({
      data: {
        walletId: transactionData.walletId,
        transactionType: transactionData.transactionType,
        amount: transactionData.amount,
        balanceBefore,
        balanceAfter,
        description: transactionData.description,
        reference: transactionData.reference,
        metadata: transactionData.metadata,
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    // Update wallet balance
    await prisma.wallet.update({
      where: { id: transactionData.walletId },
      data: {
        balance: balanceAfter,
        lastTransactionAt: new Date()
      }
    });

    return transaction;
  } catch (error) {
    console.error('Error processing wallet transaction:', error);
    throw error;
  }
}

/**
 * Create a payment record
 */
export async function createPaymentRecord(paymentData: PaymentRecordData) {
  try {
    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        customerId: paymentData.customerId,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'BHD',
        paymentMethod: paymentData.paymentMethod,
        description: paymentData.description,
        tapChargeId: paymentData.tapChargeId,
        tapAuthorizeId: paymentData.tapAuthorizeId,
        tapTransactionId: paymentData.tapTransactionId,
        tapReference: paymentData.tapReference,
        tapResponse: paymentData.tapResponse,
        cardLastFour: paymentData.cardLastFour,
        cardBrand: paymentData.cardBrand,
        cardExpiry: paymentData.cardExpiry,
        paymentStatus: 'PENDING'
      }
    });

    return paymentRecord;
  } catch (error) {
    console.error('Error creating payment record:', error);
    throw new Error('Failed to create payment record');
  }
}

/**
 * Update payment record status
 */
export async function updatePaymentStatus(
  paymentId: number, 
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND',
  failureReason?: string
) {
  try {
    const paymentRecord = await prisma.paymentRecord.update({
      where: { id: paymentId },
      data: {
        paymentStatus: status,
        failureReason,
        processedAt: status === 'PAID' ? new Date() : undefined
      }
    });

    return paymentRecord;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw new Error('Failed to update payment status');
  }
}

/**
 * Process payment using wallet balance
 */
export async function processWalletPayment(
  customerId: number,
  orderId: number,
  amount: number,
  description: string
) {
  try {
    // Get or create wallet
    const wallet = await createWalletForCustomer(customerId);

    // Create payment record
    const paymentRecord = await createPaymentRecord({
      customerId,
      orderId,
      amount,
      paymentMethod: 'WALLET',
      description
    });

    // Process wallet transaction
    const transaction = await processWalletTransaction({
      walletId: wallet.id,
      transactionType: 'PAYMENT',
      amount,
      description,
      reference: `Order: ${orderId}`,
      metadata: JSON.stringify({ paymentRecordId: paymentRecord.id })
    });

    // Link payment record to wallet transaction
    await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        walletTransactionId: transaction.id,
        paymentStatus: 'PAID',
        processedAt: new Date()
      }
    });

    return { paymentRecord, transaction };
  } catch (error) {
    console.error('Error processing wallet payment:', error);
    throw error;
  }
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactionHistory(customerId: number, limit = 50) {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { customerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: limit
        }
      }
    });

    return wallet?.transactions || [];
  } catch (error) {
    console.error('Error getting wallet transaction history:', error);
    throw new Error('Failed to get transaction history');
  }
}

/**
 * Get payment history for a customer
 */
export async function getPaymentHistory(customerId: number, limit = 50) {
  try {
    const payments = await prisma.paymentRecord.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true
          }
        }
      }
    });

    return payments;
  } catch (error) {
    console.error('Error getting payment history:', error);
    throw new Error('Failed to get payment history');
  }
}

/**
 * Validate Tap payment response and update payment record
 */
export async function processTapPaymentResponse(
  paymentId: number,
  tapResponse: TapResponse | any,
  status: 'PENDING' | 'PAID' | 'FAILED'
) {
  try {
    const updateData: Prisma.PaymentRecordUpdateInput = {
      paymentStatus: status,
      processedAt: status === 'PAID' ? new Date() : undefined
    };

    // Extract Tap-specific fields
    if (tapResponse.id) {
      updateData.tapTransactionId = tapResponse.id;
      updateData.tapChargeId = tapResponse.id;
    }
    if (tapResponse.reference) updateData.tapReference = JSON.stringify(tapResponse.reference);
    if (tapResponse.authorize?.id) updateData.tapAuthorizeId = tapResponse.authorize.id;

    // Extract card information if available
    if (tapResponse.card) {
      updateData.cardLastFour = tapResponse.card.last_four;
      updateData.cardBrand = tapResponse.card.brand;
      updateData.cardExpiry = `${tapResponse.card.exp_month}/${tapResponse.card.exp_year}`;
    }

    // Store only essential response data to avoid size issues
    const essentialResponse = extractEssentialTapResponse(tapResponse);
    const responseString = JSON.stringify(essentialResponse);
    
    // Check if the response is still too large (PostgreSQL TEXT limit is ~1GB, but let's be conservative)
    if (responseString.length > 10000) {
      // If still too large, store only the most critical fields
      const minimalResponse = {
        id: tapResponse.id,
        status: tapResponse.status,
        amount: tapResponse.amount,
        currency: tapResponse.currency
      };
      updateData.tapResponse = JSON.stringify(minimalResponse);
    } else {
      updateData.tapResponse = responseString;
    }

    const paymentRecord = await prisma.paymentRecord.update({
      where: { id: paymentId },
      data: updateData
    });

    return paymentRecord;
  } catch (error) {
    console.error('Error processing Tap payment response:', error);
    
    // Handle specific Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error('Prisma validation error details:', error.message);
      throw new Error(`Database validation error: ${error.message}`);
    }
    
    // Handle other Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma known request error:', error.code, error.message);
      throw new Error(`Database error: ${error.message}`);
    }
    
    throw new Error('Failed to process Tap payment response');
  }
}

/**
 * Safely store Tap payment response by extracting only essential data
 */
export function extractEssentialTapResponse(tapResponse: TapResponse | any) {
  try {
    return {
      id: tapResponse.id,
      status: tapResponse.status,
      amount: tapResponse.amount,
      currency: tapResponse.currency,
      reference: tapResponse.reference,
      charge: tapResponse.charge ? { id: tapResponse.charge.id } : undefined,
      authorize: tapResponse.authorize ? { id: tapResponse.authorize.id } : undefined,
      source: tapResponse.source ? {
        card: tapResponse.source.card ? {
          last4: tapResponse.source.card.last4,
          brand: tapResponse.source.card.brand,
          exp_month: tapResponse.source.card.exp_month,
          exp_year: tapResponse.source.card.exp_year
        } : undefined
      } : undefined,
      // Add any other essential fields you need
      created: tapResponse.created,
      live_mode: tapResponse.live_mode
    };
  } catch (error) {
    console.error('Error extracting essential Tap response:', error);
    // Return minimal data if extraction fails
    return {
      id: tapResponse.id,
      status: tapResponse.status,
      error: 'Failed to extract full response data'
    };
  }
}