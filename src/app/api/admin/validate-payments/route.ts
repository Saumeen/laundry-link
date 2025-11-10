import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from '@/lib/adminAuth';
import { validatePaymentData, getValidationSummary } from '@/lib/utils/paymentDataValidator';
import { syncPaymentStatuses, syncSinglePaymentStatus } from '@/lib/utils/tapStatusSync';
import { cleanupPaymentData, cleanupSinglePayment } from '@/lib/utils/paymentDataCleanup';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedAdmin();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'summary';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const paymentMethod = searchParams.get('paymentMethod') as 'TAP_PAY' | 'TAP_INVOICE' | null;
    const paymentStatus = searchParams.get('paymentStatus') as 'PENDING' | 'PAID' | 'FAILED' | null;

    switch (action) {
      case 'summary':
        const summary = await getValidationSummary();
        return NextResponse.json({
          success: true,
          summary,
        });

      case 'validate':
        const validationReport = await validatePaymentData({
          limit,
          offset,
          paymentMethod: paymentMethod || undefined,
          paymentStatus: paymentStatus || undefined,
        });
        return NextResponse.json({
          success: true,
          report: validationReport,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: summary, validate' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Error in validate-payments endpoint:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to validate payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthenticatedAdmin();

    const body = await request.json();
    const { action, options } = body as {
      action: 'sync' | 'cleanup' | 'sync-single' | 'cleanup-single';
      options?: {
        limit?: number;
        offset?: number;
        paymentMethod?: 'TAP_PAY' | 'TAP_INVOICE';
        paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
        onlyMismatches?: boolean;
        dryRun?: boolean;
        paymentId?: number;
      };
    };

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'sync':
        const syncReport = await syncPaymentStatuses({
          limit: options?.limit,
          offset: options?.offset,
          paymentMethod: options?.paymentMethod,
          paymentStatus: options?.paymentStatus,
          onlyMismatches: options?.onlyMismatches,
        });
        return NextResponse.json({
          success: true,
          report: syncReport,
        });

      case 'sync-single':
        if (!options?.paymentId) {
          return NextResponse.json(
            { error: 'paymentId is required for sync-single action' },
            { status: 400 }
          );
        }
        const syncResult = await syncSinglePaymentStatus(options.paymentId);
        return NextResponse.json({
          success: true,
          result: syncResult,
        });

      case 'cleanup':
        const cleanupReport = await cleanupPaymentData({
          limit: options?.limit,
          offset: options?.offset,
          paymentMethod: options?.paymentMethod,
          dryRun: options?.dryRun,
        });
        return NextResponse.json({
          success: true,
          report: cleanupReport,
        });

      case 'cleanup-single':
        if (!options?.paymentId) {
          return NextResponse.json(
            { error: 'paymentId is required for cleanup-single action' },
            { status: 400 }
          );
        }
        const cleanupResult = await cleanupSinglePayment(
          options.paymentId,
          options?.dryRun || false
        );
        return NextResponse.json({
          success: true,
          result: cleanupResult,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: sync, cleanup, sync-single, cleanup-single' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Error in validate-payments POST endpoint:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

