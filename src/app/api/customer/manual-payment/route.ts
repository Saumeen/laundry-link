import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedCustomer } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import logger from '@/lib/logger';
import { processWalletPayment } from '@/lib/utils/walletUtils';
import emailService from '@/lib/emailService';
import { generateInvoicePDF } from '@/lib/utils/invoiceUtils';

export async function POST(request: NextRequest) {
  try {
    const customer = await requireAuthenticatedCustomer();
    const body = await request.json() as {
      orderId: string;
      paymentMethod: PaymentMethod;
      paymentReference: string;
      amount: number;
    };

    const { orderId, paymentMethod, paymentReference, amount } = body;

    if (!orderId || !paymentMethod || !paymentReference || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate order belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        customerId: customer.id,
      },
      include: {
        customer: true,
        address: true,
         orderServiceMappings: {
          include: {
            service: true,
            orderItems: true,
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
        message: 'Order is already paid',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: PaymentStatus.PAID,
        },
      });
    }

    // For wallet payment, the amount should match the total order amount
    if (amount !== totalAmount) {
      return NextResponse.json(
        { error: `Payment amount (${amount}) must match order total (${totalAmount})` },
        { status: 400 }
      );
    }

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { customerId: customer.id }
    });

    if (!wallet || wallet.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 }
      );
    }

    // Process wallet payment
    const { paymentRecord, transaction } = await processWalletPayment(
      customer.id,
      order.id,
      amount,
      `Payment for order ${order.orderNumber} via ${paymentMethod}`
    );

    // Update payment record with manual payment details
    await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        paymentMethod: paymentMethod,
        tapReference: paymentReference,
        metadata: JSON.stringify({
          paymentType: 'wallet_deduction',
          paymentMethod: paymentMethod,
          customerNotes: `Wallet payment via ${paymentMethod}`,
          manualReference: paymentReference,
        }),
      },
    });

    // Update order payment status to PAID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
      },
    });

    // Create order update record
    await prisma.orderUpdate.create({
      data: {
        orderId: order.id,
        newStatus: order.status, // Keep the same status
        notes: `Wallet payment received via ${paymentMethod}. Reference: ${paymentReference}`,
      },
    });

    // Send payment completion email to customer with PDF attachment
    try {
      // Generate PDF invoice for attachment
      const pdfResult = await generateInvoicePDF(order.id);
      
      if (pdfResult) {
        await emailService.sendOrderPaymentCompletionNotification(
          order,
          order.customer.email,
          `${order.customer.firstName} ${order.customer.lastName}`,
          amount,
          paymentMethod,
          transaction.id.toString(),
          pdfResult.pdfBuffer
        );
        logger.info(`Payment completion email sent to customer for order ${order.orderNumber} with PDF attachment`);
      } else {
        // Fallback to email without PDF if generation fails
        await emailService.sendOrderPaymentCompletionNotification(
          order,
          order.customer.email,
          `${order.customer.firstName} ${order.customer.lastName}`,
          amount,
          paymentMethod,
          transaction.id.toString()
        );
        logger.info(`Payment completion email sent to customer for order ${order.orderNumber} without PDF attachment (generation failed)`);
      }
    } catch (emailError) {
      logger.error('Failed to send payment completion email:', emailError);
      // Continue with payment processing even if email fails
    }

    logger.info(`Wallet payment processed for order ${order.orderNumber}: ${amount} BHD via ${paymentMethod}`);

    return NextResponse.json({
      message: 'Payment processed successfully',
      paymentRecord: {
        id: paymentRecord.id,
        amount: paymentRecord.amount,
        paymentMethod: paymentRecord.paymentMethod,
        reference: paymentRecord.tapReference,
        status: paymentRecord.paymentStatus,
      },
      walletTransaction: {
        id: transaction.id,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: PaymentStatus.PAID,
      },
    });

  } catch (error) {
    logger.error('Error processing manual payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const customer = await requireAuthenticatedCustomer();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order with payment details
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        customerId: customer.id,
      },
      include: {
        customer: true,
        address: true,
        paymentRecords: {
          where: {
            paymentStatus: PaymentStatus.PENDING,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { customerId: customer.id }
    });

    const walletBalance = wallet?.balance || 0;
    const totalAmount = order.invoiceTotal || 0;
    const requiresPayment = order.paymentStatus !== PaymentStatus.PAID && totalAmount > 0;
    const canPayWithWallet = walletBalance >= totalAmount;

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: totalAmount,
        paymentStatus: order.paymentStatus,
        customer: order.customer,
        address: order.address,
      },
      wallet: {
        balance: walletBalance,
        canPayWithWallet: canPayWithWallet,
      },
      requiresPayment: requiresPayment,
      paymentAmount: requiresPayment ? totalAmount : 0,
    });

  } catch (error) {
    logger.error('Error getting payment details:', error);
    return NextResponse.json(
      { error: 'Failed to get payment details' },
      { status: 500 }
    );
  }
} 