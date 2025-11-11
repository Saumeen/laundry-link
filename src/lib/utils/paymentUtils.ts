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
    refundReason?: string | null;
  }>,
  invoiceTotal: number
): PaymentSummary {
  // Separate original payments from refund payments
  // Improved identification with fallback to refundReason field
  const originalPayments = paymentRecords.filter(payment => {
    try {
      const metadata = payment.metadata ? JSON.parse(payment.metadata || '{}') : {};
      // Check isRefund flag in metadata
      if (metadata.isRefund === true) {
        return false;
      }
      // Fallback: if refundReason exists and no isRefund flag, it might be a refund
      // But we'll be conservative and only mark as refund if explicitly set
      return true;
    } catch {
      // If metadata parsing fails, check refundReason field as fallback
      // If refundReason exists, it's likely a refund payment record
      if (payment.refundReason) {
        return false; // Has refundReason, treat as refund
      }
      return true; // If metadata parsing fails and no refundReason, treat as original payment
    }
  });
  
  const refundPayments = paymentRecords.filter(payment => {
    try {
      const metadata = payment.metadata ? JSON.parse(payment.metadata || '{}') : {};
      // Primary check: isRefund flag
      if (metadata.isRefund === true) {
        return true;
      }
      // Fallback: check refundReason field
      return !!payment.refundReason;
    } catch {
      // If metadata parsing fails, use refundReason field as fallback
      return !!payment.refundReason;
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

  // Calculate total failed from original payments
  const totalFailed = originalPayments
    .filter(payment => payment.paymentStatus === 'FAILED')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const availableForRefund = totalPaid - totalRefunded;
  const netAmountPaid = totalPaid - totalRefunded;
  
  // Calculate total pending: Order Total - Total Paid
  // This represents the amount still owed on the order
  // All payments received (by any route/method) are counted in totalPaid
  const totalPending = Math.max(0, invoiceTotal - netAmountPaid);
  
  // Outstanding amount calculation: Required - Net Paid (pending payments don't reduce outstanding until paid)
  // Outstanding = Required Amount - Net Amount Paid
  const outstandingAmount = invoiceTotal - netAmountPaid;

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

    const refundPayments = order.paymentRecords.filter(payment => {
      try {
        const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
        return metadata.isRefund === true;
      } catch {
        // Also check refundReason field as fallback
        return !!payment.refundReason;
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

    // Use netAmountPaid (totalPaid - totalRefunded) for status calculation
    const netAmountPaid = totalPaid - totalRefunded;

    const invoiceTotal = order.invoiceTotal || 0;
    
    // Determine new payment status based on netAmountPaid (accounting for refunds)
    let newPaymentStatus: PaymentStatus;
    if (netAmountPaid >= invoiceTotal) {
      newPaymentStatus = PaymentStatus.PAID;
    } else if (netAmountPaid > 0) {
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

    logger.info(`Recalculated payment status for order ${orderId}: ${newPaymentStatus}, Total Paid: ${totalPaid}, Total Refunded: ${totalRefunded}, Net Amount Paid: ${netAmountPaid}, Invoice Total: ${invoiceTotal}, Payment Method: ${paymentMethod}`);
  } catch (error) {
    logger.error(`Error recalculating order payment status for order ${orderId}:`, error);
    throw error;
  }
}

