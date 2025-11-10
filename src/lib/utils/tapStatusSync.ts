import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { PaymentStatus } from '@prisma/client';
import { getTapCharge } from './tapPaymentUtils';
import { getInvoice } from '../tapInvoiceManagement';

export interface StatusSyncResult {
  paymentId: number;
  localStatus: PaymentStatus;
  tapStatus: string | null;
  statusMatch: boolean;
  updated: boolean;
  error?: string;
}

export interface StatusSyncReport {
  totalChecked: number;
  statusMismatches: number;
  updated: number;
  errors: number;
  results: StatusSyncResult[];
  recommendations: string[];
}

/**
 * Map TAP charge status to PaymentStatus
 */
function mapTapChargeStatusToPaymentStatus(tapStatus: string): PaymentStatus {
  const statusUpper = tapStatus.toUpperCase();
  
  switch (statusUpper) {
    case 'CAPTURED':
    case 'AUTHORIZED':
      return PaymentStatus.PAID;
    case 'DECLINED':
    case 'FAILED':
    case 'CANCELLED':
      return PaymentStatus.FAILED;
    case 'PENDING':
    case 'INITIATED':
    default:
      return PaymentStatus.PENDING;
  }
}

/**
 * Map TAP invoice status to PaymentStatus
 */
function mapTapInvoiceStatusToPaymentStatus(tapStatus: string): PaymentStatus {
  const statusUpper = tapStatus.toUpperCase();
  
  switch (statusUpper) {
    case 'PAID':
    case 'CLOSED':
      return PaymentStatus.PAID;
    case 'CANCELLED':
    case 'EXPIRED':
    case 'FAILED':
    case 'DECLINED':
      return PaymentStatus.FAILED;
    case 'PENDING':
    case 'SENT':
    default:
      return PaymentStatus.PENDING;
  }
}

/**
 * Sync status for a single TAP_PAY payment record
 */
async function syncTapPayStatus(payment: any): Promise<StatusSyncResult> {
  const result: StatusSyncResult = {
    paymentId: payment.id,
    localStatus: payment.paymentStatus,
    tapStatus: null,
    statusMatch: true,
    updated: false,
  };

  try {
    // Try tapChargeId first, then tapTransactionId
    const tapId = payment.tapChargeId || payment.tapTransactionId;
    
    if (!tapId) {
      result.error = 'No TAP charge ID or transaction ID found';
      return result;
    }

    logger.info(`Syncing TAP_PAY payment ${payment.id} with TAP ID: ${tapId}`);
    
    const tapCharge = await getTapCharge(tapId) as any;
    
    if (!tapCharge) {
      result.error = 'Failed to retrieve TAP charge';
      return result;
    }

    result.tapStatus = tapCharge.status || 'UNKNOWN';
    const expectedStatus = mapTapChargeStatusToPaymentStatus(result.tapStatus);
    
    result.statusMatch = payment.paymentStatus === expectedStatus;

    if (!result.statusMatch) {
      logger.info(`Status mismatch for payment ${payment.id}: local=${payment.paymentStatus}, TAP=${result.tapStatus}, expected=${expectedStatus}`);
      
      // Update payment status
      await prisma.paymentRecord.update({
        where: { id: payment.id },
        data: {
          paymentStatus: expectedStatus,
          processedAt: expectedStatus === PaymentStatus.PAID ? new Date() : payment.processedAt,
          tapResponse: JSON.stringify(tapCharge),
          updatedAt: new Date(),
        },
      });

      result.updated = true;
      logger.info(`Updated payment ${payment.id} status from ${payment.paymentStatus} to ${expectedStatus}`);
    }

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error syncing TAP_PAY payment ${payment.id}:`, error);
    return result;
  }
}

/**
 * Sync status for a single TAP_INVOICE payment record
 */
async function syncTapInvoiceStatus(payment: any): Promise<StatusSyncResult> {
  const result: StatusSyncResult = {
    paymentId: payment.id,
    localStatus: payment.paymentStatus,
    tapStatus: null,
    statusMatch: true,
    updated: false,
  };

  try {
    if (!payment.tapReference) {
      result.error = 'No TAP invoice reference found';
      return result;
    }

    logger.info(`Syncing TAP_INVOICE payment ${payment.id} with invoice ID: ${payment.tapReference}`);
    
    const invoice = await getInvoice(payment.tapReference);
    
    result.tapStatus = invoice.status || 'UNKNOWN';
    const expectedStatus = mapTapInvoiceStatusToPaymentStatus(result.tapStatus);
    
    result.statusMatch = payment.paymentStatus === expectedStatus;

    if (!result.statusMatch) {
      logger.info(`Status mismatch for payment ${payment.id}: local=${payment.paymentStatus}, TAP=${result.tapStatus}, expected=${expectedStatus}`);
      
      // Update payment status
      await prisma.paymentRecord.update({
        where: { id: payment.id },
        data: {
          paymentStatus: expectedStatus,
          processedAt: expectedStatus === PaymentStatus.PAID ? new Date() : payment.processedAt,
          tapResponse: JSON.stringify(invoice),
          updatedAt: new Date(),
        },
      });

      result.updated = true;
      logger.info(`Updated payment ${payment.id} status from ${payment.paymentStatus} to ${expectedStatus}`);
    }

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error syncing TAP_INVOICE payment ${payment.id}:`, error);
    return result;
  }
}

/**
 * Sync payment statuses with TAP API
 */
export async function syncPaymentStatuses(options?: {
  limit?: number;
  offset?: number;
  paymentMethod?: 'TAP_PAY' | 'TAP_INVOICE';
  paymentStatus?: PaymentStatus;
  onlyMismatches?: boolean;
}): Promise<StatusSyncReport> {
  try {
    logger.info('Starting payment status synchronization with TAP API...', options);

    const where: any = {
      paymentMethod: {
        in: ['TAP_PAY', 'TAP_INVOICE'],
      },
    };

    if (options?.paymentMethod) {
      where.paymentMethod = options.paymentMethod;
    }

    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }

    // For TAP_PAY, require at least one TAP ID
    // For TAP_INVOICE, require tapReference
    const payments = await prisma.paymentRecord.findMany({
      where: {
        ...where,
        OR: [
          {
            paymentMethod: 'TAP_PAY',
            OR: [
              { tapChargeId: { not: null } },
              { tapTransactionId: { not: null } },
            ],
          },
          {
            paymentMethod: 'TAP_INVOICE',
            tapReference: { not: null },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    });

    logger.info(`Syncing ${payments.length} payment records...`);

    const results: StatusSyncResult[] = [];
    let statusMismatches = 0;
    let updated = 0;
    let errors = 0;

    for (const payment of payments) {
      let result: StatusSyncResult;

      if (payment.paymentMethod === 'TAP_PAY') {
        result = await syncTapPayStatus(payment);
      } else if (payment.paymentMethod === 'TAP_INVOICE') {
        result = await syncTapInvoiceStatus(payment);
      } else {
        continue;
      }

      results.push(result);

      if (result.error) {
        errors++;
      } else if (!result.statusMatch) {
        statusMismatches++;
        if (result.updated) {
          updated++;
        }
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const recommendations: string[] = [];

    if (statusMismatches > 0) {
      recommendations.push(
        `${statusMismatches} payments had status mismatches. ${updated} were automatically updated.`
      );
    }

    if (errors > 0) {
      recommendations.push(
        `${errors} payments could not be synced. Check logs for details.`
      );
    }

    if (updated > 0) {
      recommendations.push(
        'Consider running order payment status recalculation for affected orders.'
      );
    }

    const report: StatusSyncReport = {
      totalChecked: payments.length,
      statusMismatches,
      updated,
      errors,
      results,
      recommendations,
    };

    logger.info('Payment status synchronization completed:', {
      totalChecked: payments.length,
      statusMismatches,
      updated,
      errors,
    });

    return report;
  } catch (error) {
    logger.error('Error syncing payment statuses:', error);
    throw error;
  }
}

/**
 * Sync status for a single payment record by ID
 */
export async function syncSinglePaymentStatus(paymentId: number): Promise<StatusSyncResult> {
  try {
    const payment = await prisma.paymentRecord.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error(`Payment record ${paymentId} not found`);
    }

    if (payment.paymentMethod === 'TAP_PAY') {
      return await syncTapPayStatus(payment);
    } else if (payment.paymentMethod === 'TAP_INVOICE') {
      return await syncTapInvoiceStatus(payment);
    } else {
      throw new Error(`Payment method ${payment.paymentMethod} is not a TAP payment method`);
    }
  } catch (error) {
    logger.error(`Error syncing single payment ${paymentId}:`, error);
    throw error;
  }
}

