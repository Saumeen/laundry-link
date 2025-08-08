import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { tapConfig } from '@/lib/config/tapConfig';
import { ConfigurationManager } from '@/lib/utils/configuration';
import logger from '@/lib/logger';

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

    // Find the payment record by tapTransactionId first, then by tapReference
    let paymentRecord = await prisma.paymentRecord.findFirst({
      where: { tapTransactionId: id },
      include: { order: true },
    });

    // If not found by tapTransactionId, try tapReference
    if (!paymentRecord) {
      paymentRecord = await prisma.paymentRecord.findFirst({
        where: { tapReference: id },
        include: { order: true },
      });
    }

    // If still not found, try parsing tapReference as JSON
    if (!paymentRecord) {
      const allPaymentRecords = await prisma.paymentRecord.findMany({
        where: { 
          tapReference: { not: null },
          paymentMethod: 'TAP_PAY'
        },
        include: { order: true },
      });

      for (const record of allPaymentRecords) {
        try {
          if (record.tapReference) {
            const parsedReference = JSON.parse(record.tapReference);
            if (parsedReference.transaction === id || parsedReference.id === id) {
              paymentRecord = record;
              break;
            }
          }
        } catch (parseError) {
          // If tapReference is not JSON, check if it matches the ID directly
          if (record.tapReference === id) {
            paymentRecord = record;
            break;
          }
        }
      }
    }

    if (!paymentRecord) {
      logger.error('Payment record not found for Tap webhook:', { id, status });
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
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

    // Update payment record status
    await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        paymentStatus: status === 'CAPTURED' ? 'PAID' : 'FAILED',
        metadata: JSON.stringify({
          ...paymentMetadata,
          tapWebhookData: body,
          processedAt: new Date().toISOString(),
        }),
      },
    });

    // If payment is successful, handle based on payment type
    if (status === 'CAPTURED') {
      // Webhook should update payment record status, order status, and confirm wallet transactions
      logger.info('Payment captured in webhook - updating payment record status:', {
        paymentRecordId: paymentRecord.id,
        amount: amount / 1000,
        isOrderPayment,
        orderId: paymentRecord.orderId || 'N/A'
      });

             // Handle wallet transaction confirmation for wallet top-ups only
       // Split payment wallet transactions are already completed in the direct payment route
       if (paymentRecord.walletTransactionId) {
         const walletTransaction = await prisma.walletTransaction.findUnique({
           where: { id: paymentRecord.walletTransactionId },
           include: { wallet: true }
         });

         if (walletTransaction && walletTransaction.status === 'PENDING') {
           if (!isOrderPayment) {
             // This is a wallet top-up - add money to wallet
             const topUpAmount = amount / 1000;
             let newBalance = walletTransaction.wallet.balance + topUpAmount;
             let rewardAmount = 0;
             let rewardTransaction = null;

                           // Check if wallet top-up reward is enabled and get reward amount
              const rewardConfig = await ConfigurationManager.getWalletTopUpRewardConfig();
             
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
               if (rewardAmount > 0) {
                 rewardTransaction = await tx.walletTransaction.create({
                   data: {
                     walletId: walletTransaction.wallet.id,
                     transactionType: 'DEPOSIT',
                     amount: rewardAmount,
                     balanceBefore: newBalance - rewardAmount,
                     balanceAfter: newBalance,
                     description: `Top-up reward bonus`,
                     reference: `Reward for payment #${paymentRecord.id}`,
                     metadata: JSON.stringify({
                       originalPaymentId: paymentRecord.id,
                       originalTransactionId: walletTransaction.id,
                       rewardType: 'wallet_topup_bonus'
                     }),
                     status: 'COMPLETED',
                     processedAt: new Date()
                   }
                 });
               }
             });

                           logger.info('Wallet top-up confirmed in webhook:', {
                paymentRecordId: paymentRecord.id,
                walletTransactionId: walletTransaction.id,
                oldBalance: walletTransaction.wallet.balance,
                newBalance,
                topUpAmount: topUpAmount,
                rewardAmount: rewardAmount,
                totalAdded: topUpAmount + rewardAmount,
                transactionType: 'TOP_UP',
                rewardTransactionId: rewardAmount > 0 ? 'CREATED' : 'NONE'
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
        // Check if this is a split payment by looking for other payment records for the same order
        const allOrderPayments = await prisma.paymentRecord.findMany({
          where: { orderId: orderId },
          orderBy: { createdAt: 'asc' }
        });

        const isSplitPayment = allOrderPayments.length > 1;
        const walletPayment = allOrderPayments.find(p => p.paymentMethod === 'WALLET');
        const cardPayment = allOrderPayments.find(p => p.paymentMethod === 'TAP_PAY');

        // Determine payment method for order
        let orderPaymentMethod = 'TAP_PAY';
        if (isSplitPayment) {
          orderPaymentMethod = 'WALLET'; // Split payments are marked as wallet method
        }

        // Update order payment status
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            paymentMethod: orderPaymentMethod,
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
            oldValue: 'PENDING',
            newValue: 'PAID',
            description: isSplitPayment 
              ? `Split payment completed for order ${order.orderNumber}`
              : `Payment completed via Tap ${id}`,
            metadata: JSON.stringify({
              tapInvoiceId: id,
              amount: amount / 1000, // Convert from fils to BHD
              currency: currency,
              isSplitPayment,
              ...(isSplitPayment && {
                walletPaymentRecordId: walletPayment?.id,
                cardPaymentRecordId: cardPayment?.id,
                walletAmount: walletPayment?.amount || 0,
                cardAmount: cardPayment?.amount || 0,
              }),
            }),
          },
        });

        logger.info('Order payment status updated in webhook:', {
          orderId: orderId,
          orderNumber: order.orderNumber,
          isSplitPayment,
          paymentMethod: orderPaymentMethod,
          tapInvoiceId: id
        });
      }
    } else if (status === 'FAILED' || status === 'DECLINED') {
      // Handle failed payments - only update order for order payments
      if (isOrderPayment && orderId && order) {
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
              amount: amount / 1000, // Convert from fils to BHD
              currency: currency,
              failureReason: (body as any).failure_reason || 'Unknown',
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