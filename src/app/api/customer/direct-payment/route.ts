import { requireAuthenticatedCustomer } from '@/lib/auth';
import emailService from '@/lib/emailService';
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import { processCardPayment } from '@/lib/utils/tapPaymentUtils';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const customer = await requireAuthenticatedCustomer();
    const body = await request.json() as {
      orderId: number;
      amount: number;
      tokenId?: string;
      customerData?: CustomerData;
      // Split payment fields
      walletAmount?: number;
      cardAmount?: number;
      isSplitPayment?: boolean;
    };

    const { orderId, amount, tokenId, customerData, walletAmount, cardAmount, isSplitPayment } = body;

    // Handle split payment
    if (isSplitPayment) {
      if (!orderId || !amount || walletAmount === undefined || cardAmount === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields for split payment: orderId, amount, walletAmount, cardAmount' },
          { status: 400 }
        );
      }

      // Validate split amounts
      if (walletAmount < 0 || cardAmount < 0) {
        return NextResponse.json(
          { error: 'Amounts cannot be negative' },
          { status: 400 }
        );
      }

      if (Math.abs((walletAmount + cardAmount) - amount) > 0.01) {
        return NextResponse.json(
          { error: `Split amounts (${walletAmount + cardAmount}) must equal total amount (${amount})` },
          { status: 400 }
        );
      }

      // For card portion, require tokenId and customerData
      if (cardAmount > 0 && (!tokenId || !customerData)) {
        return NextResponse.json(
          { error: 'Card payment requires tokenId and customerData' },
          { status: 400 }
        );
      }
    } else {
      // Original card-only payment validation
      if (!orderId || !amount || !tokenId || !customerData) {
        return NextResponse.json(
          { error: 'Missing required fields: orderId, amount, tokenId, customerData' },
          { status: 400 }
        );
      }
    }

    // Validate order belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
      },
      include: {
        customer: true,
        orderServiceMappings: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if payment is required
    const totalAmount = order.invoiceTotal || 0;
    
    // If order is already paid, return success response
    if (order.paymentStatus === PaymentStatus.PAID) {
      return NextResponse.json({
        success: true,
        message: 'Order is already paid',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: PaymentStatus.PAID,
        },
      });
    }

    // Check for existing payment records in progress
    const existingPaymentRecords = await prisma.paymentRecord.findMany({
      where: {
        orderId: order.id,
        paymentStatus: {
          in: [PaymentStatus.PENDING, PaymentStatus.IN_PROGRESS]
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingPaymentRecords.length > 0) {
      const latestPayment = existingPaymentRecords[0];
      if (latestPayment.paymentStatus === PaymentStatus.IN_PROGRESS) {
        return NextResponse.json({
          error: 'A payment is already in progress for this order. Please wait for the current payment to complete.',
          paymentRecordId: latestPayment.id,
          paymentStatus: latestPayment.paymentStatus
        }, { status: 409 });
      }
      
      // If there are pending payments, check if they're recent (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentPendingPayments = existingPaymentRecords.filter(
        payment => payment.paymentStatus === PaymentStatus.PENDING && 
        payment.createdAt > fiveMinutesAgo
      );
      
      if (recentPendingPayments.length > 0) {
        return NextResponse.json({
          error: 'A payment request was recently made for this order. Please wait a moment before trying again.',
          paymentRecordId: recentPendingPayments[0].id,
          paymentStatus: recentPendingPayments[0].paymentStatus
        }, { status: 409 });
      }
    }

    // Validate payment amount
    if (amount !== totalAmount) {
      return NextResponse.json(
        { error: `Payment amount (${amount}) must match order total (${totalAmount})` },
        { status: 400 }
      );
    }

    // Check wallet balance if split payment with wallet portion
    if (isSplitPayment && walletAmount && walletAmount > 0) {
      const wallet = await prisma.wallet.findUnique({
        where: { customerId: customer.id }
      });

      if (!wallet || wallet.balance < walletAmount) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance for split payment' },
          { status: 400 }
        );
      }
    }

    try {
      let result: any;
      let walletPaymentRecord: any = null;
      let walletTransaction: any = null;

      if (isSplitPayment) {
        // Process split payment using database transaction with increased timeout
        result = await prisma.$transaction(async (tx) => {
          let walletPaymentRecord: any = null;
          let walletTransaction: any = null;
          
          // Process wallet payment if amount > 0
          if (walletAmount && walletAmount > 0) {
            // Get or create wallet
            const wallet = await tx.wallet.findUnique({
              where: { customerId: customer.id }
            }) || await tx.wallet.create({
              data: {
                customerId: customer.id,
                balance: 0,
                currency: 'BHD',
                isActive: true
              }
            });

            // Verify wallet has sufficient balance
            if (wallet.balance < walletAmount) {
              throw new Error('Insufficient wallet balance');
            }

            logger.info('Processing wallet portion of split payment:', {
              orderId: order.id,
              walletAmount,
              currentBalance: wallet.balance,
              newBalance: wallet.balance - walletAmount
            });

            // Create payment record for wallet portion
            walletPaymentRecord = await tx.paymentRecord.create({
              data: {
                customerId: customer.id,
                orderId: order.id,
                amount: walletAmount,
                currency: 'BHD',
                paymentMethod: 'WALLET',
                description: `Split payment wallet portion for order ${order.orderNumber}`,
                paymentStatus: PaymentStatus.PENDING
              }
            });

            // Calculate balance changes
            const balanceBefore = wallet.balance;
            const balanceAfter = balanceBefore - walletAmount;

                         // Create wallet transaction record for audit (COMPLETED immediately for split payments)
             walletTransaction = await tx.walletTransaction.create({
               data: {
                 walletId: wallet.id,
                 transactionType: 'PAYMENT',
                 amount: walletAmount,
                 balanceBefore,
                 balanceAfter: balanceAfter, // Deduct immediately for split payments
                 description: `Split payment (wallet portion) for order ${order.orderNumber} - Total: ${amount} BHD`,
                 reference: `Order: ${order.id}`,
                 metadata: JSON.stringify({ 
                   paymentRecordId: walletPaymentRecord.id,
                   isSplitPayment: true,
                   totalOrderAmount: amount,
                   walletAmount,
                   cardAmount: cardAmount || 0
                 }),
                 status: 'COMPLETED', // Completed immediately since money is deducted
                 processedAt: new Date() // Processed immediately
               }
             });

            // Update wallet balance immediately for split payments (user cannot use for other payments)
            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: balanceAfter,
                lastTransactionAt: new Date()
              }
            });

                         logger.info('Wallet portion of split payment completed immediately:', {
               orderId: order.id,
               walletAmount,
               balanceBefore,
               balanceAfter,
               walletTransactionId: walletTransaction.id,
               paymentRecordId: walletPaymentRecord.id
             });

                         // Update payment record with transaction link (wallet portion is COMPLETED immediately)
             walletPaymentRecord = await tx.paymentRecord.update({
               where: { id: walletPaymentRecord.id },
               data: {
                 walletTransactionId: walletTransaction.id,
                 paymentStatus: PaymentStatus.PAID, // Wallet portion is completed immediately
                 processedAt: new Date() // Processed immediately since money is already deducted
               }
             });
          }

          // Process card payment if amount > 0
          if (cardAmount && cardAmount > 0 && tokenId && customerData) {
            // Create payment record for card portion
            const cardPaymentRecord = await tx.paymentRecord.create({
              data: {
                customerId: customer.id,
                orderId: order.id,
                amount: cardAmount,
                currency: 'BHD',
                paymentMethod: 'TAP_PAY',
                description: `Split payment card portion for order ${order.orderNumber}`,
                paymentStatus: PaymentStatus.PENDING
              }
            });

            // Update wallet transaction metadata to include both payment records for complete history
            // This ensures the wallet transaction history shows the complete split payment picture
            if (walletTransaction) {
              await tx.walletTransaction.update({
                where: { id: walletTransaction.id },
                data: {
                  metadata: JSON.stringify({
                    walletPaymentRecordId: walletPaymentRecord.id,
                    cardPaymentRecordId: cardPaymentRecord.id,
                    isSplitPayment: true,
                    totalOrderAmount: amount,
                    walletAmount,
                    cardAmount
                  })
                }
              });
            }

            // Note: We'll process the Tap payment outside the transaction to avoid timeout
            // The payment record is created here but will be updated after Tap API call

            return {
              paymentRecord: cardPaymentRecord,
              tapResponse: null,
              redirectUrl: null,
              walletPaymentRecord,
              walletTransaction,
              needsTapProcessing: true,
              cardAmount,
              customerData,
              tokenId
            };
          } else {
            // Wallet-only payment
            return {
              paymentRecord: walletPaymentRecord,
              tapResponse: null,
              redirectUrl: null,
              walletPaymentRecord,
              walletTransaction,
              needsTapProcessing: false
            };
          }
        }, {
          timeout: 30000 // Increase timeout to 30 seconds
        });

        // If card payment is needed, process it outside the transaction
        if (result.needsTapProcessing) {
          logger.info('Processing card portion of split payment:', {
            orderId: order.id,
            cardAmount: result.cardAmount,
            walletAmount: walletAmount || 0,
            totalAmount: amount
          });

          const cardResult = await processCardPayment(
            customer.id,
            order.id,
            result.cardAmount,
            result.customerData,
            result.tokenId,
            `Split payment card portion for order ${order.orderNumber}`
          );

          // Update the result with card payment details
          result.paymentRecord = cardResult.paymentRecord;
          result.tapResponse = cardResult.tapResponse;
          result.redirectUrl = cardResult.redirectUrl;

                     logger.info('Card portion of split payment processed:', {
             paymentRecordId: cardResult.paymentRecord.id,
             tapTransactionId: cardResult.tapResponse?.id,
             status: cardResult.tapResponse?.status
           });

           // Note: Email notification for split payments will be handled by webhook
           // since the card portion goes through the webhook process
        } else {
          // Wallet-only payment - send email notification immediately
          try {
            const orderWithCustomer = await prisma.order.findUnique({
              where: { id: order.id },
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
              const orderForEmail = {
                ...orderWithCustomer,
                customerAddress: orderWithCustomer.address?.addressLine1 || 'Address not available',
              };

              await emailService.sendOrderPaymentCompletionNotification(
                orderForEmail,
                orderWithCustomer.customer.email,
                `${orderWithCustomer.customer.firstName} ${orderWithCustomer.customer.lastName}`,
                amount,
                'WALLET',
                `WALLET-${result.walletTransaction?.id || 'DIRECT'}`
              );

              logger.info('Email notification sent for wallet-only payment:', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerEmail: orderWithCustomer.customer.email
              });
            }
          } catch (emailError) {
            logger.error('Failed to send email notification for wallet-only payment:', emailError);
            // Don't fail the payment if email fails
          }
        }
      } else {
        // Original card-only payment - no wallet transaction needed
        result = await processCardPayment(
          customer.id,
          orderId,
          amount,
          customerData!,
          tokenId!,
          `Direct card payment for order ${order.orderNumber}`
        );

        logger.info('Card-only payment processed (no wallet transaction):', {
          orderId: order.id,
          amount,
          paymentRecordId: result.paymentRecord.id
        });

        // Send email notification for card-only payment if captured immediately
        if (result.tapResponse && result.tapResponse.status === 'CAPTURED') {
          try {
            const orderWithCustomer = await prisma.order.findUnique({
              where: { id: order.id },
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
              const orderForEmail = {
                ...orderWithCustomer,
                customerAddress: orderWithCustomer.address?.addressLine1 || 'Address not available',
              };

              await emailService.sendOrderPaymentCompletionNotification(
                orderForEmail,
                orderWithCustomer.customer.email,
                `${orderWithCustomer.customer.firstName} ${orderWithCustomer.customer.lastName}`,
                amount,
                'TAP_PAY',
                result.tapResponse.id
              );

              logger.info('Email notification sent for card-only payment:', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerEmail: orderWithCustomer.customer.email,
                tapTransactionId: result.tapResponse.id
              });
            }
          } catch (emailError) {
            logger.error('Failed to send email notification for card-only payment:', emailError);
            // Don't fail the payment if email fails
          }
        }
      }

      const { paymentRecord, tapResponse, redirectUrl } = result;
      const pendingWalletTransaction = result.pendingWalletTransaction || null;

      // Check if payment requires redirect (3D Secure or other authentication)
      if (redirectUrl) {
        logger.info(`${isSplitPayment ? 'Split' : 'Direct card'} payment requires redirect for order ${order.orderNumber}`, {
          paymentRecordId: paymentRecord.id,
          tapTransactionId: tapResponse?.id,
          orderId: order.id,
          redirectUrl,
        });

        return NextResponse.json({
          success: true,
          message: 'Payment requires authentication',
          status: 'redirect_required',
          redirectUrl,
          ...(isSplitPayment && {
            walletPayment: walletPaymentRecord ? {
              id: walletPaymentRecord.id,
              amount: walletPaymentRecord.amount,
              paymentMethod: walletPaymentRecord.paymentMethod,
              status: walletPaymentRecord.paymentStatus,
            } : null,
          }),
          paymentRecord: {
            id: paymentRecord.id,
            amount: paymentRecord.amount,
            paymentMethod: paymentRecord.paymentMethod,
            reference: tapResponse?.reference?.transaction || tapResponse?.id,
            status: paymentRecord.paymentStatus,
            tapTransactionId: tapResponse?.id,
            refundable: true,
          },
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: isSplitPayment ? PaymentMethod.WALLET : PaymentMethod.TAP_PAY,
          },
        });
      }

             // Check payment status for immediate captures
       if (tapResponse && tapResponse.status === 'CAPTURED') {
         // Payment is captured - order status will be updated by webhook
         logger.info(`${isSplitPayment ? 'Split' : 'Direct card'} payment captured for order ${order.orderNumber}: ${amount} BHD`, {
           paymentRecordId: paymentRecord.id,
           tapTransactionId: tapResponse?.id,
           orderId: order.id,
         });

                   // Send email notification for captured payment (only for card-only payments)
          // Split payments will be handled by webhook
          if (!isSplitPayment) {
            try {
              const orderWithCustomer = await prisma.order.findUnique({
                where: { id: order.id },
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
                const orderForEmail = {
                  ...orderWithCustomer,
                  customerAddress: orderWithCustomer.address?.addressLine1 || 'Address not available',
                };

                await emailService.sendOrderPaymentCompletionNotification(
                  orderForEmail,
                  orderWithCustomer.customer.email,
                  `${orderWithCustomer.customer.firstName} ${orderWithCustomer.customer.lastName}`,
                  amount,
                  'TAP_PAY',
                  tapResponse?.id
                );

                logger.info('Email notification sent for captured card-only payment:', {
                  orderId: order.id,
                  orderNumber: order.orderNumber,
                  customerEmail: orderWithCustomer.customer.email,
                  tapTransactionId: tapResponse?.id
                });
              }
            } catch (emailError) {
              logger.error('Failed to send email notification for captured payment:', emailError);
              // Don't fail the payment if email fails
            }
          }

         return NextResponse.json({
           success: true,
           message: 'Payment captured successfully - order status will be updated via webhook',
           ...(isSplitPayment && {
             walletPayment: walletPaymentRecord ? {
               id: walletPaymentRecord.id,
               amount: walletPaymentRecord.amount,
               paymentMethod: walletPaymentRecord.paymentMethod,
               status: 'PAID',
             } : null,
           }),
           paymentRecord: {
             id: paymentRecord.id,
             amount: paymentRecord.amount,
             paymentMethod: paymentRecord.paymentMethod,
             reference: tapResponse?.reference?.transaction || tapResponse?.id,
             status: 'PAID',
             tapTransactionId: tapResponse?.id,
             refundable: true,
           },
           order: {
             id: order.id,
             orderNumber: order.orderNumber,
             paymentStatus: PaymentStatus.PENDING, // Will be updated by webhook
             paymentMethod: isSplitPayment ? PaymentMethod.WALLET : PaymentMethod.TAP_PAY,
           },
         });
      } else if (!tapResponse) {
        // Handle case where charge creation failed
        logger.error(`${isSplitPayment ? 'Split' : 'Direct card'} payment failed - no Tap response for order ${order.orderNumber}`, {
          paymentRecordId: paymentRecord.id,
          orderId: order.id,
        });
        
        return NextResponse.json(
          { 
            error: 'Payment processing failed. Please try again.' 
          },
          { status: 400 }
        );
      } else if (tapResponse.status === 'DECLINED' || tapResponse.status === 'FAILED') {
        logger.warn(`${isSplitPayment ? 'Split' : 'Direct card'} payment failed for order ${order.orderNumber}: ${tapResponse.status}`, {
          paymentRecordId: paymentRecord.id,
          tapTransactionId: tapResponse.id,
          orderId: order.id,
        });
        
        return NextResponse.json(
          { 
            error: 'Payment was declined. Please check your card details and try again.' 
          },
          { status: 400 }
        );
      } else {
        // Handle other pending statuses (INITIATED, etc.)
        logger.info(`${isSplitPayment ? 'Split' : 'Direct card'} payment in pending status for order ${order.orderNumber}: ${tapResponse.status}`, {
          paymentRecordId: paymentRecord.id,
          tapTransactionId: tapResponse.id,
          orderId: order.id,
        });
        
        return NextResponse.json({
          success: true,
          message: 'Payment is being processed',
          status: 'pending',
          ...(isSplitPayment && {
            walletPayment: walletPaymentRecord ? {
              id: walletPaymentRecord.id,
              amount: walletPaymentRecord.amount,
              paymentMethod: walletPaymentRecord.paymentMethod,
              status: 'PAID',
            } : null,
          }),
          paymentRecord: {
            id: paymentRecord.id,
            amount: paymentRecord.amount,
            paymentMethod: paymentRecord.paymentMethod,
            reference: tapResponse.reference?.transaction || tapResponse.id,
            status: 'PENDING',
            tapTransactionId: tapResponse.id,
            refundable: true,
          },
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: isSplitPayment ? PaymentMethod.WALLET : PaymentMethod.TAP_PAY,
          },
        });
      }

    } catch (tapError) {
      logger.error(`${isSplitPayment ? 'Split' : 'Direct card'} payment error for order ${order.orderNumber}:`, tapError);
      
      const errorMessage = tapError instanceof Error ? tapError.message : 'Payment processing failed';
      return NextResponse.json(
        { error: errorMessage.includes('declined') || errorMessage.includes('insufficient') ? 
          'Payment was declined. Please check your card details and try again.' : 
          'Payment processing failed. Please try again.' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}