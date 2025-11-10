import prisma from '@/lib/prisma';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import logger from '@/lib/logger';

export interface PaymentSummary {
  totalPaid: number;
  totalRefunded: number;
  totalPending: number;
  totalFailed: number;
  availableForRefund: number;
  netAmountPaid: number;
  outstandingAmount: number;
  paymentRecordsCount: number;
  invoiceTotal: number;
}

/**
 * Calculate payment summary from payment records
 * Standardized calculation: outstandingAmount = invoiceTotal - (totalPaid - totalRefunded) - totalPending
 */
export function calculatePaymentSummary(
  paymentRecords: Array<{
    metadata?: string | null;
    paymentStatus: string;
    amount: number;
  }>,
  invoiceTotal: number
): PaymentSummary {
  // Separate original payments from refund payments
  const originalPayments = paymentRecords.filter(payment => {
    try {
      const metadata = payment.metadata ? JSON.parse(payment.metadata || '{}') : {};
      return !metadata.isRefund;
    } catch {
      return true; // If metadata parsing fails, treat as original payment
    }
  });
  
  const refundPayments = paymentRecords.filter(payment => {
    try {
      const metadata = payment.metadata ? JSON.parse(payment.metadata || '{}') : {};
      return metadata.isRefund;
    } catch {
      return false;
    }
  });

  // Calculate total paid from original payments
  const totalPaid = originalPayments
    .filter(payment => payment.paymentStatus === 'PAID')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate total refunded from refund payment records
  const totalRefunded = refundPayments
    .filter(payment => payment.paymentStatus === 'PAID')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate total pending from original payments
  const totalPending = originalPayments
    .filter(payment => payment.paymentStatus === 'PENDING')
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate total failed from original payments
  const totalFailed = originalPayments
    .filter(payment => payment.paymentStatus === 'FAILED')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const availableForRefund = totalPaid - totalRefunded;
  const netAmountPaid = totalPaid - totalRefunded;
  // Standardized outstanding amount calculation: accounts for refunds and pending payments
  const outstandingAmount = invoiceTotal - netAmountPaid - totalPending;

  return {
    totalPaid,
    totalRefunded,
    totalPending,
    totalFailed,
    availableForRefund,
    netAmountPaid,
    outstandingAmount,
    paymentRecordsCount: paymentRecords.length,
    invoiceTotal
  };
}

/**
 * Recalculate and update order payment status based on payment records
 */
export async function recalculateOrderPaymentStatus(orderId: number): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentRecords: true
      }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Separate original payments from refund payments
    const originalPayments = order.paymentRecords.filter(payment => {
      try {
        const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
        return !metadata.isRefund;
      } catch {
        return true; // If metadata parsing fails, treat as original payment
      }
    });

    // Calculate total paid from original payments
    const totalPaid = originalPayments
      .filter(payment => payment.paymentStatus === 'PAID')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const invoiceTotal = order.invoiceTotal || 0;
    
    // Determine new payment status
    let newPaymentStatus: PaymentStatus;
    if (totalPaid >= invoiceTotal) {
      newPaymentStatus = PaymentStatus.PAID;
    } else if (totalPaid > 0) {
      // For partial payments, check if there are pending payments
      const hasPendingPayments = originalPayments.some(p => p.paymentStatus === 'PENDING');
      const hasFailedPayments = originalPayments.some(p => p.paymentStatus === 'FAILED');
      
      // Fixed logic: properly distinguish between partial payment and pending payment
      if (hasPendingPayments) {
        // There are pending payments, so status should be PENDING
        newPaymentStatus = PaymentStatus.PENDING;
      } else if (hasFailedPayments && !hasPendingPayments) {
        // All payments failed and no pending, status is FAILED
        newPaymentStatus = PaymentStatus.FAILED;
      } else {
        // Partial payment completed but no pending payments - keep as PENDING
        // This represents a partially paid order waiting for remaining payment
        newPaymentStatus = PaymentStatus.PENDING;
      }
    } else {
      // No payments made yet
      const hasPendingPayments = originalPayments.some(p => p.paymentStatus === 'PENDING');
      const hasFailedPayments = originalPayments.some(p => p.paymentStatus === 'FAILED');
      
      if (hasFailedPayments && !hasPendingPayments) {
        newPaymentStatus = PaymentStatus.FAILED;
      } else {
        newPaymentStatus = PaymentStatus.PENDING;
      }
    }

    // Determine payment method
    const paidPayments = originalPayments.filter(p => p.paymentStatus === 'PAID');
    let paymentMethod: PaymentMethod = (order.paymentMethod as PaymentMethod) || PaymentMethod.TAP_PAY;
    
    if (paidPayments.length > 0) {
      // Get the most recent paid payment method
      const latestPaidPayment = paidPayments.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      if (paidPayments.length > 1) {
        // Multiple payments indicate split payment
        paymentMethod = PaymentMethod.WALLET; // Split payments are marked as wallet method
      } else {
        paymentMethod = (latestPaidPayment.paymentMethod as PaymentMethod) || PaymentMethod.TAP_PAY;
      }
    }

    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: newPaymentStatus,
        paymentMethod: paymentMethod,
        updatedAt: new Date()
      }
    });

    logger.info(`Recalculated payment status for order ${orderId}: ${newPaymentStatus}, Total Paid: ${totalPaid}, Invoice Total: ${invoiceTotal}, Payment Method: ${paymentMethod}`);
  } catch (error) {
    logger.error(`Error recalculating order payment status for order ${orderId}:`, error);
    throw error;
  }
}

