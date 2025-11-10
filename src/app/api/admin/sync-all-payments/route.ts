import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from '@/lib/adminAuth';
import { syncPaymentStatuses } from '@/lib/utils/tapStatusSync';
import { cleanupPaymentData } from '@/lib/utils/paymentDataCleanup';
import { recalculateOrderPaymentStatus } from '@/lib/utils/paymentUtils';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

/**
 * Manual payment status synchronization endpoint
 * Since Vercel doesn't support cron jobs, this endpoint can be:
 * 1. Called manually from admin dashboard
 * 2. Called via Vercel Cron Jobs (if available)
 * 3. Called via external cron service (e.g., cron-job.org)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuthenticatedAdmin();

    const body = await request.json();
    const { 
      limit = 100, 
      includeCleanup = false,
      recalculateOrders = true,
      dryRun = false,
    } = body as {
      limit?: number;
      includeCleanup?: boolean;
      recalculateOrders?: boolean;
      dryRun?: boolean;
    };

    logger.info('Starting manual payment status synchronization...', {
      limit,
      includeCleanup,
      recalculateOrders,
      dryRun,
    });

    const results: any = {
      sync: null,
      cleanup: null,
      ordersRecalculated: 0,
    };

    // Step 1: Cleanup payment data (extract missing TAP IDs)
    if (includeCleanup) {
      try {
        logger.info('Running payment data cleanup...');
        const cleanupReport = await cleanupPaymentData({
          limit,
          dryRun,
        });
        results.cleanup = cleanupReport;
        logger.info(`Cleanup completed: ${cleanupReport.totalFixed} records fixed`);
      } catch (error) {
        logger.error('Error during cleanup:', error);
        results.cleanupError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Step 2: Sync payment statuses with TAP API
    try {
      logger.info('Syncing payment statuses with TAP API...');
      const syncReport = await syncPaymentStatuses({
        limit,
        onlyMismatches: false,
      });
      results.sync = syncReport;
      logger.info(`Sync completed: ${syncReport.updated} records updated`);
    } catch (error) {
      logger.error('Error during status sync:', error);
      results.syncError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Step 3: Recalculate order payment statuses for affected orders
    if (recalculateOrders && !dryRun) {
      try {
        logger.info('Recalculating order payment statuses...');
        
        // Get all orders with TAP payments that were updated
        const updatedPaymentIds = results.sync?.results
          ?.filter((r: any) => r.updated)
          .map((r: any) => r.paymentId) || [];

        if (updatedPaymentIds.length > 0) {
          const affectedOrders = await prisma.paymentRecord.findMany({
            where: {
              id: { in: updatedPaymentIds },
              orderId: { not: null },
            },
            select: {
              orderId: true,
            },
            distinct: ['orderId'],
          });

          const orderIds = affectedOrders
            .map((p) => p.orderId)
            .filter((id): id is number => id !== null);

          for (const orderId of orderIds) {
            try {
              await recalculateOrderPaymentStatus(orderId);
              results.ordersRecalculated++;
            } catch (error) {
              logger.error(`Error recalculating order ${orderId}:`, error);
            }
          }

          logger.info(`Recalculated payment status for ${results.ordersRecalculated} orders`);
        }
      } catch (error) {
        logger.error('Error recalculating orders:', error);
        results.recalculateError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    const summary = {
      success: true,
      message: dryRun ? 'Dry run completed - no changes made' : 'Payment synchronization completed',
      dryRun,
      results: {
        cleanup: results.cleanup
          ? {
              totalProcessed: results.cleanup.totalProcessed,
              totalFixed: results.cleanup.totalFixed,
              totalErrors: results.cleanup.totalErrors,
            }
          : null,
        sync: results.sync
          ? {
              totalChecked: results.sync.totalChecked,
              statusMismatches: results.sync.statusMismatches,
              updated: results.sync.updated,
              errors: results.sync.errors,
            }
          : null,
        ordersRecalculated: results.ordersRecalculated,
      },
      errors: {
        cleanup: results.cleanupError || null,
        sync: results.syncError || null,
        recalculate: results.recalculateError || null,
      },
    };

    logger.info('Manual payment synchronization completed:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    logger.error('Error in sync-all-payments endpoint:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to sync payments' },
      { status: 500 }
    );
  }
}

