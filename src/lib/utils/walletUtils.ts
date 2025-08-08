import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import logger from '@/lib/logger';

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
    logger.error('Error creating wallet:', error);
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
    logger.error('Error getting wallet balance:', error);
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

    // Use database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.walletTransaction.create({
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
      await tx.wallet.update({
        where: { id: transactionData.walletId },
        data: {
          balance: balanceAfter,
          lastTransactionAt: new Date()
        }
      });

      return transaction;
    });

    return result;
  } catch (error) {
    logger.error('Error processing wallet transaction:', error);
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
    logger.error('Error creating payment record:', error);
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
    logger.error('Error updating payment status:', error);
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

    // Verify wallet has sufficient balance
    if (wallet.balance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    // Use database transaction to ensure atomicity of the entire payment process
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const paymentRecord = await tx.paymentRecord.create({
        data: {
          customerId,
          orderId,
          amount,
          currency: 'BHD',
          paymentMethod: 'WALLET',
          description,
          paymentStatus: 'IN_PROGRESS'
        }
      });

      // Calculate balance changes
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore - amount;

      // Create wallet transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          transactionType: 'PAYMENT',
          amount,
          balanceBefore,
          balanceAfter,
          description,
          reference: `Order: ${orderId}`,
          metadata: JSON.stringify({ paymentRecordId: paymentRecord.id }),
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          lastTransactionAt: new Date()
        }
      });

      // Update payment record with transaction link and mark as paid
      const updatedPaymentRecord = await tx.paymentRecord.update({
        where: { id: paymentRecord.id },
        data: {
          walletTransactionId: transaction.id,
          paymentStatus: 'PAID',
          processedAt: new Date()
        }
      });

      return { paymentRecord: updatedPaymentRecord, transaction };
    });

    return result;
  } catch (error) {
    logger.error('Error processing wallet payment:', error);
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
    logger.error('Error getting wallet transaction history:', error);
    throw new Error('Failed to get transaction history');
  }
}

/**
 * Verify wallet transaction integrity
 */
export async function verifyWalletTransactionIntegrity(customerId: number) {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { customerId },
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!wallet || wallet.transactions.length === 0) {
      return { valid: true, message: 'No transactions to verify' };
    }

    let calculatedBalance = 0;
    const errors: string[] = [];

    for (const transaction of wallet.transactions) {
      const expectedBalanceBefore = calculatedBalance;
      
      if (Math.abs(transaction.balanceBefore - expectedBalanceBefore) > 0.001) {
        errors.push(`Transaction ${transaction.id}: Expected balance before ${expectedBalanceBefore}, got ${transaction.balanceBefore}`);
      }

      switch (transaction.transactionType) {
        case 'DEPOSIT':
        case 'REFUND':
          calculatedBalance += transaction.amount;
          break;
        case 'WITHDRAWAL':
        case 'PAYMENT':
          calculatedBalance -= transaction.amount;
          break;
        case 'ADJUSTMENT':
          calculatedBalance = transaction.amount;
          break;
      }

      if (Math.abs(transaction.balanceAfter - calculatedBalance) > 0.001) {
        errors.push(`Transaction ${transaction.id}: Expected balance after ${calculatedBalance}, got ${transaction.balanceAfter}`);
      }
    }

    if (Math.abs(wallet.balance - calculatedBalance) > 0.001) {
      errors.push(`Wallet balance mismatch: Expected ${calculatedBalance}, got ${wallet.balance}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      message: errors.length === 0 ? 'Wallet integrity verified' : `Found ${errors.length} integrity issues`
    };
  } catch (error) {
    logger.error('Error verifying wallet transaction integrity:', error);
    throw new Error('Failed to verify wallet integrity');
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
    logger.error('Error getting payment history:', error);
    throw new Error('Failed to get payment history');
  }
}

/**
 * Validate Tap payment response and update payment record
 */
export async function processTapPaymentResponse(
  paymentId: number,
  tapResponse: TapResponse | any,
  status: 'PENDING' | 'PAID' | 'FAILED',
  metadata?: Record<string, any>
) {
  try {
    const updateData: Prisma.PaymentRecordUpdateInput = {
      paymentStatus: status,
      processedAt: status === 'PAID' ? new Date() : undefined
    };

    // Store the metadata if provided
    if (metadata) {
      updateData.metadata = JSON.stringify(metadata);
    }

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
    logger.error('Error processing Tap payment response:', error);
    
    // Handle specific Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      logger.error('Prisma validation error details:', error.message);
      throw new Error(`Database validation error: ${error.message}`);
    }
    
    // Handle other Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error('Prisma known request error:', error.code, error.message);
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
    logger.error('Error extracting essential Tap response:', error);
    // Return minimal data if extraction fails
    return {
      id: tapResponse.id,
      status: tapResponse.status,
      error: 'Failed to extract full response data'
    };
  }
}