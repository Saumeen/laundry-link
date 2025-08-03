import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { tapConfig } from '@/lib/config/tapConfig';
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

    if (!id || !status || !reference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the payment record
    const paymentRecord = await prisma.paymentRecord.findFirst({
      where: { tapReference: id },
      include: { order: true },
    });

    if (!paymentRecord) {
      logger.error('Payment record not found for Tap invoice:', id);
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

         const orderId = paymentRecord.orderId;
     const order = paymentRecord.order;

     if (!orderId || !order) {
       logger.error('Order not found for payment record:', paymentRecord.id);
       return NextResponse.json(
         { error: 'Order not found' },
         { status: 404 }
       );
     }

     // Update payment record status
     await prisma.paymentRecord.update({
       where: { id: paymentRecord.id },
       data: {
         paymentStatus: status === 'CAPTURED' ? 'PAID' : 'FAILED',
         metadata: JSON.stringify({
           ...JSON.parse(paymentRecord.metadata || '{}'),
           tapWebhookData: body,
           processedAt: new Date().toISOString(),
         }),
       },
     });

     // If payment is successful, update order and wallet
     if (status === 'CAPTURED') {
       // Update order payment status
       await prisma.order.update({
         where: { id: orderId },
         data: {
           paymentStatus: 'PAID',
           notes: order.notes 
             ? `${order.notes}\nPayment completed via Tap: ${id}`
             : `Payment completed via Tap: ${id}`,
         },
       });

       // Get customer wallet
       const customerWallet = await prisma.wallet.findUnique({
         where: { customerId: order.customerId },
       });

      if (customerWallet) {
        // Add payment amount to wallet
        const newBalance = customerWallet.balance + amount;
        
        await prisma.wallet.update({
          where: { id: customerWallet.id },
          data: {
            balance: newBalance,
            lastTransactionAt: new Date(),
          },
        });

                 // Create wallet transaction record
         await prisma.walletTransaction.create({
           data: {
             walletId: customerWallet.id,
             transactionType: 'DEPOSIT',
             amount: amount,
             balanceBefore: customerWallet.balance,
             balanceAfter: newBalance,
             description: `Payment received for order ${order.orderNumber}`,
             reference: order.orderNumber,
             status: 'COMPLETED',
             processedAt: new Date(),
             metadata: JSON.stringify({
               tapInvoiceId: id,
               orderId: orderId,
               paymentMethod: 'TAP_INVOICE',
             }),
           },
         });
      }

      // Add order history entry
      await prisma.orderHistory.create({
        data: {
          orderId: orderId,
          staffId: null, // System action
          action: 'PAYMENT_COMPLETED',
          oldValue: 'PENDING',
          newValue: 'COMPLETED',
          description: `Payment completed via Tap invoice ${id}`,
          metadata: JSON.stringify({
            tapInvoiceId: id,
            amount: amount,
            currency: currency,
          }),
        },
      });
    } else if (status === 'FAILED' || status === 'DECLINED') {
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
          description: `Payment failed via Tap invoice ${id}`,
          metadata: JSON.stringify({
            tapInvoiceId: id,
            amount: amount,
            currency: currency,
                         failureReason: (body as any).failure_reason || 'Unknown',
          }),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error processing Tap webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 