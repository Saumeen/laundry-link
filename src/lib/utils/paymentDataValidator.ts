import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export interface PaymentValidationIssue {
  paymentId: number;
  issueType: 'MISSING_TAP_ID' | 'INCONSISTENT_DATA' | 'INVALID_TAP_RESPONSE' | 'MISSING_METADATA' | 'STATUS_MISMATCH';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  suggestedFix?: string;
  canAutoFix: boolean;
}

export interface PaymentValidationReport {
  totalRecords: number;
  validRecords: number;
  issuesFound: number;
  issues: PaymentValidationIssue[];
  statistics: {
    tapPayRecords: number;
    tapInvoiceRecords: number;
    recordsWithMissingTapTransactionId: number;
    recordsWithMissingTapChargeId: number;
    recordsWithMissingTapReference: number;
    recordsWithInconsistentData: number;
    recordsWithInvalidTapResponse: number;
    recordsWithMissingMetadata: number;
  };
  recommendations: string[];
}

/**
 * Extract TAP IDs from tapResponse JSON
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
 * Extract TAP invoice ID from metadata
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
 * Validate a single payment record
 */
function validatePaymentRecord(payment: any): PaymentValidationIssue[] {
  const issues: PaymentValidationIssue[] = [];
  const { id, paymentMethod, tapTransactionId, tapChargeId, tapReference, tapResponse, metadata, paymentStatus } = payment;

  // Extract IDs from tapResponse if available
  const extractedIds = extractTapIdsFromResponse(tapResponse);
  const extractedInvoiceId = extractTapInvoiceIdFromMetadata(metadata);

  if (paymentMethod === 'TAP_PAY') {
    // TAP_PAY records should have tapTransactionId or tapChargeId
    if (!tapTransactionId && !tapChargeId) {
      if (extractedIds.tapTransactionId || extractedIds.tapChargeId) {
        issues.push({
          paymentId: id,
          issueType: 'MISSING_TAP_ID',
          severity: 'HIGH',
          description: 'Missing tapTransactionId and tapChargeId, but found in tapResponse JSON',
          suggestedFix: `Extract and set tapTransactionId: ${extractedIds.tapTransactionId || extractedIds.tapChargeId}`,
          canAutoFix: true,
        });
      } else {
        issues.push({
          paymentId: id,
          issueType: 'MISSING_TAP_ID',
          severity: 'HIGH',
          description: 'Missing tapTransactionId and tapChargeId, and not found in tapResponse',
          suggestedFix: 'Manual review required - TAP transaction ID not available',
          canAutoFix: false,
        });
      }
    }

    // Check for inconsistent data - has tapChargeId but no tapTransactionId
    if (tapChargeId && !tapTransactionId) {
      issues.push({
        paymentId: id,
        issueType: 'INCONSISTENT_DATA',
        severity: 'MEDIUM',
        description: 'Has tapChargeId but missing tapTransactionId (should match for charges)',
        suggestedFix: `Set tapTransactionId to ${tapChargeId}`,
        canAutoFix: true,
      });
    }

    // Check if tapResponse is invalid JSON
    if (tapResponse) {
      try {
        JSON.parse(tapResponse);
      } catch (error) {
        issues.push({
          paymentId: id,
          issueType: 'INVALID_TAP_RESPONSE',
          severity: 'MEDIUM',
          description: 'tapResponse contains invalid JSON',
          suggestedFix: 'Fix or remove invalid tapResponse data',
          canAutoFix: false,
        });
      }
    }
  } else if (paymentMethod === 'TAP_INVOICE') {
    // TAP_INVOICE records should have tapReference (invoice ID)
    if (!tapReference) {
      if (extractedInvoiceId) {
        issues.push({
          paymentId: id,
          issueType: 'MISSING_TAP_ID',
          severity: 'HIGH',
          description: 'Missing tapReference, but found in metadata',
          suggestedFix: `Set tapReference to ${extractedInvoiceId}`,
          canAutoFix: true,
        });
      } else {
        issues.push({
          paymentId: id,
          issueType: 'MISSING_TAP_ID',
          severity: 'HIGH',
          description: 'Missing tapReference (invoice ID)',
          suggestedFix: 'Manual review required - TAP invoice ID not available',
          canAutoFix: false,
        });
      }
    }

    // Check if metadata has required invoice information
    if (!metadata) {
      issues.push({
        paymentId: id,
        issueType: 'MISSING_METADATA',
        severity: 'MEDIUM',
        description: 'Missing metadata for TAP_INVOICE payment',
        suggestedFix: 'Add metadata with tapInvoiceId and tapInvoiceUrl',
        canAutoFix: false,
      });
    } else {
      try {
        const meta = JSON.parse(metadata);
        if (!meta.tapInvoiceId && !meta.tapInvoice?.id) {
          issues.push({
            paymentId: id,
            issueType: 'MISSING_METADATA',
            severity: 'LOW',
            description: 'Metadata missing tapInvoiceId',
            suggestedFix: 'Add tapInvoiceId to metadata',
            canAutoFix: false,
          });
        }
      } catch (error) {
        issues.push({
          paymentId: id,
          issueType: 'INVALID_TAP_RESPONSE',
          severity: 'MEDIUM',
          description: 'Metadata contains invalid JSON',
          suggestedFix: 'Fix invalid metadata JSON',
          canAutoFix: false,
        });
      }
    }
  }

  // Check if tapReference is stored as JSON string (should be plain string)
  if (tapReference) {
    try {
      const parsed = JSON.parse(tapReference);
      if (typeof parsed === 'object') {
        issues.push({
          paymentId: id,
          issueType: 'INCONSISTENT_DATA',
          severity: 'LOW',
          description: 'tapReference is stored as JSON string instead of plain string',
          suggestedFix: `Normalize tapReference to plain string: ${parsed.transaction || parsed.invoice || parsed.id || tapReference}`,
          canAutoFix: true,
        });
      }
    } catch (error) {
      // Not JSON, which is correct - no issue
    }
  }

  return issues;
}

/**
 * Validate all TAP payment records
 */
export async function validatePaymentData(options?: {
  limit?: number;
  offset?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
}): Promise<PaymentValidationReport> {
  try {
    logger.info('Starting payment data validation...', options);

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

    // Get total count
    const totalRecords = await prisma.paymentRecord.count({ where });

    // Get payment records
    const payments = await prisma.paymentRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 1000,
      skip: options?.offset || 0,
    });

    logger.info(`Validating ${payments.length} payment records...`);

    const issues: PaymentValidationIssue[] = [];
    const statistics = {
      tapPayRecords: 0,
      tapInvoiceRecords: 0,
      recordsWithMissingTapTransactionId: 0,
      recordsWithMissingTapChargeId: 0,
      recordsWithMissingTapReference: 0,
      recordsWithInconsistentData: 0,
      recordsWithInvalidTapResponse: 0,
      recordsWithMissingMetadata: 0,
    };

    for (const payment of payments) {
      if (payment.paymentMethod === 'TAP_PAY') {
        statistics.tapPayRecords++;
      } else if (payment.paymentMethod === 'TAP_INVOICE') {
        statistics.tapInvoiceRecords++;
      }

      const paymentIssues = validatePaymentRecord(payment);
      issues.push(...paymentIssues);

      // Update statistics
      for (const issue of paymentIssues) {
        switch (issue.issueType) {
          case 'MISSING_TAP_ID':
            if (payment.paymentMethod === 'TAP_PAY') {
              if (!payment.tapTransactionId) statistics.recordsWithMissingTapTransactionId++;
              if (!payment.tapChargeId) statistics.recordsWithMissingTapChargeId++;
            } else if (payment.paymentMethod === 'TAP_INVOICE') {
              if (!payment.tapReference) statistics.recordsWithMissingTapReference++;
            }
            break;
          case 'INCONSISTENT_DATA':
            statistics.recordsWithInconsistentData++;
            break;
          case 'INVALID_TAP_RESPONSE':
            statistics.recordsWithInvalidTapResponse++;
            break;
          case 'MISSING_METADATA':
            statistics.recordsWithMissingMetadata++;
            break;
        }
      }
    }

    const validRecords = totalRecords - issues.length;
    const recommendations: string[] = [];

    if (statistics.recordsWithMissingTapTransactionId > 0 || statistics.recordsWithMissingTapChargeId > 0) {
      recommendations.push(
        `${statistics.recordsWithMissingTapTransactionId + statistics.recordsWithMissingTapChargeId} TAP_PAY records are missing transaction IDs. Consider extracting from tapResponse JSON.`
      );
    }

    if (statistics.recordsWithMissingTapReference > 0) {
      recommendations.push(
        `${statistics.recordsWithMissingTapReference} TAP_INVOICE records are missing invoice references. Consider extracting from metadata.`
      );
    }

    if (statistics.recordsWithInconsistentData > 0) {
      recommendations.push(
        `${statistics.recordsWithInconsistentData} records have inconsistent data. Consider normalizing tapReference fields.`
      );
    }

    if (issues.filter(i => !i.canAutoFix).length > 0) {
      recommendations.push(
        `${issues.filter(i => !i.canAutoFix).length} issues require manual review. Check these records individually.`
      );
    }

    const report: PaymentValidationReport = {
      totalRecords,
      validRecords,
      issuesFound: issues.length,
      issues,
      statistics,
      recommendations,
    };

    logger.info('Payment data validation completed:', {
      totalRecords,
      issuesFound: issues.length,
      canAutoFix: issues.filter(i => i.canAutoFix).length,
      requiresManualReview: issues.filter(i => !i.canAutoFix).length,
    });

    return report;
  } catch (error) {
    logger.error('Error validating payment data:', error);
    throw error;
  }
}

/**
 * Get validation summary (quick check without full validation)
 */
export async function getValidationSummary(): Promise<{
  totalTapPayments: number;
  missingTapIds: number;
  inconsistentData: number;
}> {
  try {
    const totalTapPayments = await prisma.paymentRecord.count({
      where: {
        paymentMethod: {
          in: ['TAP_PAY', 'TAP_INVOICE'],
        },
      },
    });

    const missingTapIds = await prisma.paymentRecord.count({
      where: {
        paymentMethod: 'TAP_PAY',
        tapTransactionId: null,
        tapChargeId: null,
      },
    }) + await prisma.paymentRecord.count({
      where: {
        paymentMethod: 'TAP_INVOICE',
        tapReference: null,
      },
    });

    const inconsistentData = await prisma.paymentRecord.count({
      where: {
        paymentMethod: 'TAP_PAY',
        tapChargeId: { not: null },
        tapTransactionId: null,
      },
    });

    return {
      totalTapPayments,
      missingTapIds,
      inconsistentData,
    };
  } catch (error) {
    logger.error('Error getting validation summary:', error);
    throw error;
  }
}

