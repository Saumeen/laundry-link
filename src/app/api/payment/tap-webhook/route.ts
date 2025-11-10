import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { tapConfig } from '@/lib/config/tapConfig';
import { ConfigurationManager } from '@/lib/utils/configuration';
import logger from '@/lib/logger';
import emailService from '@/lib/emailService';
import { generateInvoicePDF } from '@/lib/utils/invoiceUtils';
import { recalculateOrderPaymentStatus } from '@/lib/utils/paymentUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (you should implement this for production)
    // const signature = request.headers.get('x-tap-signature');
    // if (!verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const { id, status, amount, currency, reference, metadata } = body as {
      id: string;
      status: string;
      amount: number;
      currency: string;
      reference: string;
      metadata: string;
    };

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    logger.info('Processing Tap webhook:', { id, status, amount, currency });

    // Find payment record with prioritized exact matching
    // Priority 1: Exact match by tapTransactionId (for TAP_PAY)
    let paymentRecord = await prisma.paymentRecord.findFirst({
      where: { tapTransactionId: id },
      include: { order: true },
    });

    // Priority 2: Exact match by tapReference (for TAP_INVOICE)
    if (!paymentRecord) {
      paymentRecord = await prisma.paymentRecord.findFirst({
        where: { tapReference: id },
        include: { order: true },
      });
    }

    // Priority 3: Fallback - check metadata for TAP_INVOICE only if exact match failed
    // This is a restricted fallback with validation
    if (!paymentRecord) {
      logger.info('Exact match failed, attempting metadata fallback for TAP_INVOICE payments', { webhookId: id });
      
      const invoicePaymentRecords = await prisma.paymentRecord.findMany({
        where: { 
          paymentMethod: 'TAP_INVOICE',
          tapReference: { not: null }
        },
        include: { order: true },
        take: 50, // Limit search to prevent performance issues
      });

      for (const record of invoicePaymentRecords) {
        try {
          if (record.metadata) {
            const metadata = JSON.parse(record.metadata);
            // Only match if tapInvoiceId in metadata matches AND tapReference doesn't exist or matches
            if (metadata.tapInvoiceId === id) {
              // Validate: ensure tapReference matches if it exists
              if (record.tapReference && record.tapReference !== id) {
                logger.warn('Metadata match found but tapReference mismatch, skipping', {
                  paymentRecordId: record.id,
                  metadataTapInvoiceId: metadata.tapInvoiceId,
                  tapReference: record.tapReference,
                  webhookId: id
                });
                continue;
              }
              paymentRecord = record;
              logger.info('Payment record found via metadata fallback', {
                paymentRecordId: record.id,
                webhookId: id,
                matchingMethod: 'metadata_tapInvoiceId'
              });
              break;
            }
          }
        } catch (parseError) {
          // Skip records with invalid metadata
          logger.warn('Failed to parse metadata for payment record during fallback search', {
            paymentRecordId: record.id,
            error: parseError instanceof Error ? parseError.message : String(parseError)
          });
        }
      }
    }

    if (!paymentRecord) {
      logger.error('Payment record not found for Tap webhook after all matching attempts:', { id, status });
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Validate matched payment record
    // Ensure the payment record's orderId matches if order information is available in webhook metadata
    if (paymentRecord.orderId && metadata) {
      try {
        const webhookMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
        if (webhookMetadata && typeof webhookMetadata === 'object' && 'orderId' in webhookMetadata) {
          const webhookOrderId = webhookMetadata.orderId;
          if (webhookOrderId && paymentRecord.orderId !== webhookOrderId) {
            logger.error('Payment record orderId mismatch with webhook metadata', {
              paymentRecordId: paymentRecord.id,
              paymentRecordOrderId: paymentRecord.orderId,
              webhookOrderId: webhookOrderId,
              webhookId: id
            });
            return NextResponse.json(
              { error: 'Payment record order mismatch' },
              { status: 400 }
            );
          }
        }
      } catch (parseError) {
        // If metadata parsing fails, log but don't fail the webhook
        logger.warn('Failed to parse webhook metadata for validation', {
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
      }
    }

    const orderId = paymentRecord.orderId;
    const order = paymentRecord.order;

    // Parse payment metadata to determine if this is an order payment or wallet top-up
    let isOrderPayment = false;
    let paymentMetadata: Record<string, unknown> = {};
    
    try {
      paymentMetadata = JSON.parse(paymentRecord.metadata || '{}');
      isOrderPayment = paymentMetadata.isOrderPayment === true;
      
      logger.info('Payment metadata parsed:', {
        paymentRecordId: paymentRecord.id,
        isOrderPayment,
        isWalletTopUp: paymentMetadata.isWalletTopUp,
        orderId: paymentMetadata.orderId,
        rawMetadata: paymentRecord.metadata
      });
    } catch (parseError) {
      logger.warn('Failed to parse payment metadata, defaulting to order payment', {
        paymentRecordId: paymentRecord.id,
        rawMetadata: paymentRecord.metadata,
        parseError: parseError instanceof Error ? parseError.message : String(parseError)
      });
      isOrderPayment = true; // Default to order payment for backward compatibility
    }

    // Map webhook status to payment status
    // For TAP_INVOICE: 'PAID', 'CLOSED' → 'PAID'; 'CANCELLED', 'EXPIRED', 'FAILED' → 'FAILED'
    // For TAP_PAY: 'CAPTURED' → 'PAID'; 'DECLINED', 'FAILED' → 'FAILED'
    const statusUpper = status.toUpperCase();
    let isPaid = false;
    let newPaymentStatus: 'PENDING' | 'PAID' | 'FAILED' = 'PENDING';
    
    if (paymentRecord.paymentMethod === 'TAP_INVOICE') {
      // TAP_INVOICE specific status mapping
      if (statusUpper === 'PAID' || statusUpper === 'CLOSED') {
        isPaid = true;
        newPaymentStatus = 'PAID';
      } else if (statusUpper === 'CANCELLED' || statusUpper === 'EXPIRED' || statusUpper === 'FAILED' || statusUpper === 'DECLINED') {
        isPaid = false;
        newPaymentStatus = 'FAILED';
      } else {
        // Keep as PENDING for other statuses
        newPaymentStatus = 'PENDING';
      }
    } else {
      // TAP_PAY and other payment methods
      if (statusUpper === 'CAPTURED') {
        isPaid = true;
        newPaymentStatus = 'PAID';
      } else if (statusUpper === 'DECLINED' || statusUpper === 'FAILED') {
        isPaid = false;
        newPaymentStatus = 'FAILED';
      } else {
        newPaymentStatus = 'PENDING';
      }
    }
    
    // Check if payment status has already been updated (idempotency check)
    const shouldUpdate = paymentRecord.paymentStatus !== newPaymentStatus;
    
    if (shouldUpdate) {
      logger.info(`Updating payment record ${paymentRecord.id} from ${paymentRecord.paymentStatus} to ${newPaymentStatus}`, {
        webhookStatus: status,
        paymentMethod: paymentRecord.paymentMethod,
        orderId: orderId || 'N/A'
      });
      
      await prisma.paymentRecord.update({
        where: { id: paymentRecord.id },
        data: {
          paymentStatus: newPaymentStatus,
          processedAt: isPaid ? new Date() : paymentRecord.processedAt,
          tapTransactionId: isPaid && !paymentRecord.tapTransactionId ? id : paymentRecord.tapTransactionId,
          tapResponse: JSON.stringify(body),
          metadata: JSON.stringify({
            ...paymentMetadata,
            tapWebhookData: body,
            processedAt: isPaid ? new Date().toISOString() : paymentMetadata.processedAt,
            lastWebhookStatus: status,
            lastWebhookUpdate: new Date().toISOString(),
          }),
        },
      });
    } else {
      logger.info(`Payment record ${paymentRecord.id} already has status ${newPaymentStatus}, skipping update`, {
        webhookStatus: status,
        paymentMethod: paymentRecord.paymentMethod
      });
    }

    // If payment is successful, handle based on payment type
    // Check for successful statuses: CAPTURED (TAP_PAY), PAID/CLOSED (TAP_INVOICE)
    const isSuccessful = isPaid && newPaymentStatus === 'PAID';
    
    if (isSuccessful) {
      // Webhook should update payment record status, order status, and confirm wallet transactions
      logger.info('Payment captured in webhook - updating payment record status:', {
        paymentRecordId: paymentRecord.id,
        amount: amount,
        isOrderPayment,
        orderId: paymentRecord.orderId || 'N/A'
      });

      // Handle wallet transaction confirmation for wallet top-ups only
      // Split payment wallet transactions are already completed in the direct payment route
      if (paymentRecord.walletTransactionId) {
        const walletTransaction = await prisma.walletTransaction.findUnique({
          where: { id: paymentRecord.walletTransactionId },
          include: { 
            wallet: { 
              include: { 
                customer: true 
              } 
            } 
          }
        });

        if (walletTransaction && walletTransaction.status === 'PENDING') {
          if (!isOrderPayment) {
            // This is a wallet top-up - add money to wallet
            const topUpAmount = amount;
            let newBalance = walletTransaction.wallet.balance + topUpAmount;
            let rewardAmount = 0;
            let rewardTransaction = null;

            // Check if wallet top-up reward is enabled and get reward amount
            const rewardConfig = await ConfigurationManager.getWalletTopUpRewardConfig();
            
            // Check for quick slot reward
            const quickSlotsConfig = await ConfigurationManager.getWalletQuickSlotsConfig();
            let quickSlotReward = 0;
            
            if (quickSlotsConfig.enabled && quickSlotsConfig.slots) {
              const matchingSlot = quickSlotsConfig.slots.find(slot => 
                slot.enabled && slot.amount === topUpAmount
              );
              if (matchingSlot && matchingSlot.reward > 0) {
                quickSlotReward = matchingSlot.reward;
                newBalance += quickSlotReward;
                
                logger.info('Quick slot reward applied:', {
                  paymentRecordId: paymentRecord.id,
                  topUpAmount,
                  quickSlotReward,
                  slotAmount: matchingSlot.amount
                });
              }
            }
            
            if (rewardConfig.enabled && rewardConfig.amount > 0) {
              rewardAmount = rewardConfig.amount;
              newBalance += rewardAmount;
             
              logger.info('Wallet top-up reward applied:', {
                paymentRecordId: paymentRecord.id,
                topUpAmount,
                rewardAmount,
                totalAdded: topUpAmount + rewardAmount
              });
            }
            
            await prisma.$transaction(async (tx) => {
              // Update wallet balance
              await tx.wallet.update({
                where: { id: walletTransaction.wallet.id },
                data: {
                  balance: newBalance,
                  lastTransactionAt: new Date()
                }
              });

              // Confirm wallet transaction
              await tx.walletTransaction.update({
                where: { id: walletTransaction.id },
                data: {
                  status: 'COMPLETED',
                  balanceAfter: newBalance,
                  processedAt: new Date(),
                  metadata: JSON.stringify({
                    ...JSON.parse(walletTransaction.metadata || '{}'),
                    confirmedAt: new Date().toISOString(),
                    tapWebhookId: id,
                    isOrderPayment: false,
                    rewardAmount: rewardAmount
                  })
                }
              });

              // Create reward transaction if reward was given
              const totalReward = rewardAmount + quickSlotReward;
              if (totalReward > 0) {
                rewardTransaction = await tx.walletTransaction.create({
                  data: {
                    walletId: walletTransaction.wallet.id,
                    transactionType: 'DEPOSIT',
                    amount: totalReward,
                    balanceBefore: newBalance - totalReward,
                    balanceAfter: newBalance,
                    description: `Top-up reward bonus`,
                    reference: `Reward for payment #${paymentRecord.id}`,
                    metadata: JSON.stringify({
                      originalPaymentId: paymentRecord.id,
                      originalTransactionId: walletTransaction.id,
                      rewardType: 'wallet_topup_bonus',
                      globalReward: rewardAmount,
                      quickSlotReward: quickSlotReward
                    }),
                    status: 'COMPLETED',
                    processedAt: new Date()
                  }
                });
              }
            });

            // Send wallet top-up completion email notification
            if (walletTransaction.wallet.customer) {
              const customer = walletTransaction.wallet.customer;
              const totalReward = rewardAmount + quickSlotReward;
              
              // Fetch the updated wallet balance to ensure we have the correct balance
              const updatedWallet = await prisma.wallet.findUnique({
                where: { id: walletTransaction.wallet.id }
              });
              
              const finalBalance = updatedWallet ? updatedWallet.balance : newBalance;
              
              await emailService.sendWalletTopUpCompletionNotification(
                customer.email,
                `${customer.firstName} ${customer.lastName}`,
                topUpAmount,
                finalBalance,
                'TAP_PAY',
                id,
                totalReward > 0 ? totalReward : undefined
              );
            }

            logger.info('Wallet top-up confirmed in webhook:', {
              paymentRecordId: paymentRecord.id,
              walletTransactionId: walletTransaction.id,
              oldBalance: walletTransaction.wallet.balance,
              newBalance,
              topUpAmount: topUpAmount,
              globalRewardAmount: rewardAmount,
              quickSlotRewardAmount: quickSlotReward,
              totalRewardAmount: rewardAmount + quickSlotReward,
              totalAdded: topUpAmount + rewardAmount + quickSlotReward,
              transactionType: 'TOP_UP',
              rewardTransactionId: (rewardAmount + quickSlotReward) > 0 ? 'CREATED' : 'NONE'
            });
          } else {
            // This is a card-only payment - just confirm the transaction (no balance change)
            await prisma.walletTransaction.update({
              where: { id: walletTransaction.id },
              data: {
                status: 'COMPLETED',
                processedAt: new Date(),
                metadata: JSON.stringify({
                  ...JSON.parse(walletTransaction.metadata || '{}'),
                  confirmedAt: new Date().toISOString(),
                  tapWebhookId: id,
                  isOrderPayment: true
                })
              }
            });

            logger.info('Card payment wallet transaction confirmed in webhook (no balance change):', {
              paymentRecordId: paymentRecord.id,
              walletTransactionId: walletTransaction.id,
              currentBalance: walletTransaction.wallet.balance,
              amount: walletTransaction.amount,
              transactionType: 'CARD_PAYMENT'
            });
          }
        } else if (walletTransaction && walletTransaction.status === 'COMPLETED') {
          // This is a split payment - wallet portion already completed, just log
          logger.info('Split payment wallet transaction already completed (wallet portion):', {
            paymentRecordId: paymentRecord.id,
            walletTransactionId: walletTransaction.id,
            currentBalance: walletTransaction.wallet.balance,
            amount: walletTransaction.amount,
            transactionType: 'SPLIT_PAYMENT_WALLET_PORTION'
          });
        }
      }

      // Handle order-specific updates only for order payments
      if (isOrderPayment && orderId && order) {
        // Recalculate order payment status based on all payment records
        await recalculateOrderPaymentStatus(orderId);

        // Check if this is a split payment by looking for other payment records for the same order
        const allOrderPayments = await prisma.paymentRecord.findMany({
          where: { orderId: orderId },
          orderBy: { createdAt: 'asc' }
        });

        const isSplitPayment = allOrderPayments.length > 1;
        const walletPayment = allOrderPayments.find(p => p.paymentMethod === 'WALLET');
        const cardPayment = allOrderPayments.find(p => p.paymentMethod === 'TAP_PAY');
        const invoicePayment = allOrderPayments.find(p => p.paymentMethod === 'TAP_INVOICE');
        
        // Determine payment method for email/display
        const orderPaymentMethod = paymentRecord.paymentMethod === 'TAP_INVOICE' ? 'TAP_INVOICE' 
          : paymentRecord.paymentMethod === 'TAP_PAY' ? 'TAP_PAY'
          : paymentRecord.paymentMethod || 'TAP_PAY';

        // Update order notes
        await prisma.order.update({
          where: { id: orderId },
          data: {
            notes: order.notes 
              ? `${order.notes}\n${isSplitPayment ? 'Split payment completed' : 'Payment completed via Tap'}: ${id}`
              : `${isSplitPayment ? 'Split payment completed' : 'Payment completed via Tap'}: ${id}`,
          },
        });

        // Add order history entry
        await prisma.orderHistory.create({
          data: {
            orderId: orderId,
            staffId: null, // System action
            action: 'PAYMENT_COMPLETED',
            oldValue: order.paymentStatus || 'PENDING',
            newValue: 'PAID',
            description: isSplitPayment 
              ? `Split payment completed for order ${order.orderNumber}`
              : `Payment completed via Tap ${id}`,
            metadata: JSON.stringify({
              tapInvoiceId: id,
              amount: amount, // Amount in BHD
              currency: currency,
              isSplitPayment,
              paymentMethod: orderPaymentMethod,
              ...(isSplitPayment && {
                walletPaymentRecordId: walletPayment?.id,
                cardPaymentRecordId: cardPayment?.id,
                invoicePaymentRecordId: invoicePayment?.id,
                walletAmount: walletPayment?.amount || 0,
                cardAmount: cardPayment?.amount || 0,
                invoiceAmount: invoicePayment?.amount || 0,
              }),
            }),
          },
        });

        // Send order payment completion email notification with PDF attachment
        const orderWithCustomer = await prisma.order.findUnique({
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

        if (orderWithCustomer && orderWithCustomer.customer) {
          // Create a properly formatted order object for the email service
          const orderForEmail = {
            ...orderWithCustomer,
            customerAddress: orderWithCustomer.address?.addressLine1 || 'Address not available',
          };

          // Generate PDF invoice for attachment
          const pdfResult = await generateInvoicePDF(orderId);
          
          if (pdfResult) {
            await emailService.sendOrderPaymentCompletionNotification(
              orderForEmail,
              orderWithCustomer.customer.email,
              `${orderWithCustomer.customer.firstName} ${orderWithCustomer.customer.lastName}`,
              amount,
              orderPaymentMethod,
              id,
              pdfResult.pdfBuffer
            );
          } else {
            // Fallback to email without PDF if generation fails
            await emailService.sendOrderPaymentCompletionNotification(
              orderForEmail,
              orderWithCustomer.customer.email,
              `${orderWithCustomer.customer.firstName} ${orderWithCustomer.customer.lastName}`,
              amount,
              orderPaymentMethod,
              id
            );
          }
        }

        logger.info('Order payment status updated in webhook:', {
          orderId: orderId,
          orderNumber: order.orderNumber,
          isSplitPayment,
          paymentMethod: orderPaymentMethod,
          tapInvoiceId: id,
          webhookStatus: status
        });
      }
    } else if (newPaymentStatus === 'FAILED') {
      // Handle failed payments - only update order for order payments
      // Only process if we actually updated the payment record
      if (shouldUpdate && isOrderPayment && orderId && order) {
        // Update order payment status to failed
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'FAILED',
            notes: order.notes 
              ? `${order.notes}\nPayment failed via Tap: ${id}`
              : `Payment failed via Tap: ${id}`,
          },
        });

        // Add order history entry
        await prisma.orderHistory.create({
          data: {
            orderId: orderId,
            staffId: null, // System action
            action: 'PAYMENT_FAILED',
            oldValue: 'PENDING',
            newValue: 'FAILED',
            description: `Payment failed via Tap ${id}`,
            metadata: JSON.stringify({
              tapInvoiceId: id,
              amount: amount, // Amount in BHD
              currency: currency,
              failureReason: (body as { failure_reason?: string }).failure_reason || 'Unknown',
            }),
          },
        });
      }

      // For failed payments, we don't need to update any wallet balance
      // The wallet balance remains unchanged for both order payments and wallet top-ups
    }

    logger.info('Tap webhook processed successfully:', { 
      id, 
      status, 
      paymentRecordId: paymentRecord.id,
      isOrderPayment,
      orderId: orderId || 'N/A',
      walletUpdate: paymentRecord.walletTransactionId ? 'YES - Wallet transaction confirmed' : 'NO - No wallet transaction'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error processing Tap webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 