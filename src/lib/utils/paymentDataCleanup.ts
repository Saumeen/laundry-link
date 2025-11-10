import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { PaymentMethod } from '@prisma/client';

export interface CleanupResult {
  paymentId: number;
  action: 'EXTRACTED_TAP_ID' | 'NORMALIZED_TAP_REFERENCE' | 'FIXED_INCONSISTENT_DATA' | 'NO_CHANGE' | 'ERROR';
  description: string;
  changes?: Record<string, any>;
  error?: string;
}

export interface CleanupReport {
  totalProcessed: number;
  totalFixed: number;
  totalErrors: number;
  results: CleanupResult[];
  statistics: {
    extractedTapTransactionId: number;
    extractedTapChargeId: number;
    extractedTapReference: number;
    normalizedTapReference: number;
    fixedInconsistentData: number;
  };
  recommendations: string[];
}

/**
 * Extract TAP IDs from tapResponse JSON (re-exported for convenience)
 */
function extractTapIdsFromResponse(tapResponse: string | null): {
  tapTransactionId?: string;
  tapChargeId?: string;
  tapReference?: string;
} {
  const result: {
    tapTransactionId?: string;
    tapChargeId?: string;
    tapReference?: string;
  } = {};

  if (!tapResponse) return result;

  try {
    const response = JSON.parse(tapResponse);
    
    // Extract transaction/charge ID
    if (response.id) {
      result.tapTransactionId = response.id;
      result.tapChargeId = response.id; // For charges, both should be the same
    }
    
    // Extract charge ID if different
    if (response.charge?.id) {
      result.tapChargeId = response.charge.id;
    }
    
    // Extract reference
    if (response.reference) {
      if (typeof response.reference === 'string') {
        result.tapReference = response.reference;
      } else if (response.reference.transaction) {
        result.tapReference = response.reference.transaction;
      } else if (response.reference.invoice) {
        result.tapReference = response.reference.invoice;
      }
    }
  } catch (error) {
    logger.warn('Failed to parse tapResponse JSON:', error);
  }

  return result;
}

/**
 * Extract TAP invoice ID from metadata (re-exported for convenience)
 */
function extractTapInvoiceIdFromMetadata(metadata: string | null): string | null {
  if (!metadata) return null;

  try {
    const meta = JSON.parse(metadata);
    return meta.tapInvoiceId || meta.tapInvoice?.id || null;
  } catch (error) {
    logger.warn('Failed to parse metadata JSON:', error);
    return null;
  }
}

/**
 * Normalize tapReference field (convert JSON string to plain string if needed)
 */
function normalizeTapReference(tapReference: string | null): string | null {
  if (!tapReference) return null;

  try {
    const parsed = JSON.parse(tapReference);
    if (typeof parsed === 'object') {
      // Extract the actual reference value
      return parsed.transaction || parsed.invoice || parsed.id || tapReference;
    }
  } catch (error) {
    // Not JSON, which is correct - return as is
  }

  return tapReference;
}

/**
 * Cleanup a single payment record
 */
async function cleanupPaymentRecord(payment: any): Promise<CleanupResult> {
  const result: CleanupResult = {
    paymentId: payment.id,
    action: 'NO_CHANGE',
    description: 'No changes needed',
  };

  try {
    const updateData: any = {};
    let hasChanges = false;

    // Extract TAP IDs from tapResponse if missing
    if (payment.paymentMethod === 'TAP_PAY') {
      if (!payment.tapTransactionId && !payment.tapChargeId && payment.tapResponse) {
        const extractedIds = extractTapIdsFromResponse(payment.tapResponse);
        
        if (extractedIds.tapTransactionId) {
          updateData.tapTransactionId = extractedIds.tapTransactionId;
          hasChanges = true;
          result.action = 'EXTRACTED_TAP_ID';
          result.description = `Extracted tapTransactionId from tapResponse: ${extractedIds.tapTransactionId}`;
        }
        
        if (extractedIds.tapChargeId) {
          updateData.tapChargeId = extractedIds.tapChargeId;
          hasChanges = true;
          if (result.action === 'NO_CHANGE') {
            result.action = 'EXTRACTED_TAP_ID';
            result.description = `Extracted tapChargeId from tapResponse: ${extractedIds.tapChargeId}`;
          } else {
            result.description += `, tapChargeId: ${extractedIds.tapChargeId}`;
          }
        }
      }

      // Fix inconsistent data - has tapChargeId but no tapTransactionId
      if (payment.tapChargeId && !payment.tapTransactionId) {
        updateData.tapTransactionId = payment.tapChargeId;
        hasChanges = true;
        if (result.action === 'NO_CHANGE') {
          result.action = 'FIXED_INCONSISTENT_DATA';
          result.description = `Fixed inconsistent data: set tapTransactionId to ${payment.tapChargeId}`;
        } else {
          result.action = 'FIXED_INCONSISTENT_DATA';
          result.description += `, fixed inconsistent data`;
        }
      }
    } else if (payment.paymentMethod === 'TAP_INVOICE') {
      // Extract tapReference from metadata if missing
      if (!payment.tapReference && payment.metadata) {
        const extractedInvoiceId = extractTapInvoiceIdFromMetadata(payment.metadata);
        
        if (extractedInvoiceId) {
          updateData.tapReference = extractedInvoiceId;
          hasChanges = true;
          result.action = 'EXTRACTED_TAP_ID';
          result.description = `Extracted tapReference from metadata: ${extractedInvoiceId}`;
        }
      }
    }

    // Normalize tapReference if it's stored as JSON string
    if (payment.tapReference) {
      const normalized = normalizeTapReference(payment.tapReference);
      if (normalized !== payment.tapReference) {
        updateData.tapReference = normalized;
        hasChanges = true;
        if (result.action === 'NO_CHANGE') {
          result.action = 'NORMALIZED_TAP_REFERENCE';
          result.description = `Normalized tapReference from JSON string to plain string: ${normalized}`;
        } else {
          result.description += `, normalized tapReference`;
        }
      }
    }

    if (hasChanges) {
      await prisma.paymentRecord.update({
        where: { id: payment.id },
        data: updateData,
      });

      result.changes = updateData;
      logger.info(`Cleaned up payment ${payment.id}:`, updateData);
    }

    return result;
  } catch (error) {
    result.action = 'ERROR';
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.description = `Error cleaning up payment: ${result.error}`;
    logger.error(`Error cleaning up payment ${payment.id}:`, error);
    return result;
  }
}

/**
 * Cleanup payment data
 */
export async function cleanupPaymentData(options?: {
  limit?: number;
  offset?: number;
  paymentMethod?: PaymentMethod;
  dryRun?: boolean;
}): Promise<CleanupReport> {
  try {
    logger.info('Starting payment data cleanup...', options);

    const where: any = {
      paymentMethod: {
        in: ['TAP_PAY', 'TAP_INVOICE'],
      },
    };

    if (options?.paymentMethod) {
      where.paymentMethod = options.paymentMethod;
    }

    // Get payment records that might need cleanup
    const payments = await prisma.paymentRecord.findMany({
      where: {
        ...where,
        OR: [
          // TAP_PAY records missing IDs
          {
            paymentMethod: 'TAP_PAY',
            tapTransactionId: null,
            tapChargeId: null,
            tapResponse: { not: null },
          },
          // TAP_PAY records with inconsistent data
          {
            paymentMethod: 'TAP_PAY',
            tapChargeId: { not: null },
            tapTransactionId: null,
          },
          // TAP_INVOICE records missing reference
          {
            paymentMethod: 'TAP_INVOICE',
            tapReference: null,
            metadata: { not: null },
          },
          // Records with tapReference as JSON string
          {
            tapReference: { not: null },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    });

    logger.info(`Cleaning up ${payments.length} payment records...`);

    const results: CleanupResult[] = [];
    const statistics = {
      extractedTapTransactionId: 0,
      extractedTapChargeId: 0,
      extractedTapReference: 0,
      normalizedTapReference: 0,
      fixedInconsistentData: 0,
    };

    let totalFixed = 0;
    let totalErrors = 0;

    for (const payment of payments) {
      let result: CleanupResult;

      if (options?.dryRun) {
        // In dry run mode, simulate cleanup without actually updating
        result = await cleanupPaymentRecord(payment);
        if (result.action !== 'NO_CHANGE' && result.action !== 'ERROR') {
          result.description = `[DRY RUN] ${result.description}`;
        }
      } else {
        result = await cleanupPaymentRecord(payment);
      }

      results.push(result);

      if (result.action === 'ERROR') {
        totalErrors++;
      } else if (result.action !== 'NO_CHANGE') {
        totalFixed++;
        
        // Update statistics
        if (result.changes) {
          if (result.changes.tapTransactionId) statistics.extractedTapTransactionId++;
          if (result.changes.tapChargeId) statistics.extractedTapChargeId++;
          if (result.changes.tapReference && payment.paymentMethod === 'TAP_INVOICE') {
            statistics.extractedTapReference++;
          }
          if (result.action === 'NORMALIZED_TAP_REFERENCE') {
            statistics.normalizedTapReference++;
          }
          if (result.action === 'FIXED_INCONSISTENT_DATA') {
            statistics.fixedInconsistentData++;
          }
        }
      }
    }

    const recommendations: string[] = [];

    if (totalFixed > 0) {
      recommendations.push(
        `${totalFixed} payment records were cleaned up. Review the changes to ensure accuracy.`
      );
    }

    if (statistics.extractedTapTransactionId > 0 || statistics.extractedTapChargeId > 0) {
      recommendations.push(
        `Extracted ${statistics.extractedTapTransactionId + statistics.extractedTapChargeId} TAP IDs from tapResponse JSON.`
      );
    }

    if (statistics.extractedTapReference > 0) {
      recommendations.push(
        `Extracted ${statistics.extractedTapReference} TAP invoice references from metadata.`
      );
    }

    if (statistics.normalizedTapReference > 0) {
      recommendations.push(
        `Normalized ${statistics.normalizedTapReference} tapReference fields from JSON strings to plain strings.`
      );
    }

    if (statistics.fixedInconsistentData > 0) {
      recommendations.push(
        `Fixed ${statistics.fixedInconsistentData} records with inconsistent data.`
      );
    }

    if (totalErrors > 0) {
      recommendations.push(
        `${totalErrors} records had errors during cleanup. Check logs for details.`
      );
    }

    if (options?.dryRun) {
      recommendations.push(
        'This was a dry run. No changes were actually made. Run without dryRun option to apply changes.'
      );
    }

    const report: CleanupReport = {
      totalProcessed: payments.length,
      totalFixed,
      totalErrors,
      results,
      statistics,
      recommendations,
    };

    logger.info('Payment data cleanup completed:', {
      totalProcessed: payments.length,
      totalFixed,
      totalErrors,
    });

    return report;
  } catch (error) {
    logger.error('Error cleaning up payment data:', error);
    throw error;
  }
}

/**
 * Cleanup a single payment record by ID
 */
export async function cleanupSinglePayment(paymentId: number, dryRun: boolean = false): Promise<CleanupResult> {
  try {
    const payment = await prisma.paymentRecord.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error(`Payment record ${paymentId} not found`);
    }

    if (payment.paymentMethod !== 'TAP_PAY' && payment.paymentMethod !== 'TAP_INVOICE') {
      throw new Error(`Payment method ${payment.paymentMethod} is not a TAP payment method`);
    }

    if (dryRun) {
      const result = await cleanupPaymentRecord(payment);
      result.description = `[DRY RUN] ${result.description}`;
      return result;
    }

    return await cleanupPaymentRecord(payment);
  } catch (error) {
    logger.error(`Error cleaning up single payment ${paymentId}:`, error);
    throw error;
  }
}

