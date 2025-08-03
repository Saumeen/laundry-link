import { NextResponse } from 'next/server';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import { cronScheduler } from '@/lib/cron/cronScheduler';
import { PaymentStatusChecker } from '@/lib/cron/paymentStatusChecker';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const { searchParams } = new URL(req.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    const status = cronScheduler.getStatus();
    const executionHistory = includeHistory ? cronScheduler.getExecutionHistory().slice(-limit) : [];
    
    let paymentStats = null;
    if (includeStats) {
      paymentStats = await PaymentStatusChecker.getPendingPaymentStats();
    }

    return NextResponse.json({
      success: true,
      status,
      executionHistory,
      paymentStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting cron status:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get cron status',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const body = await req.json();
    const { action } = body as { action: 'start' | 'stop' | 'restart' };

    switch (action) {
      case 'start':
        cronScheduler.start();
        break;
      case 'stop':
        cronScheduler.stop();
        break;
      case 'restart':
        cronScheduler.stop();
        setTimeout(() => cronScheduler.start(), 1000);
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    const status = cronScheduler.getStatus();

    return NextResponse.json({
      success: true,
      message: `Cron scheduler ${action}ed successfully`,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error controlling cron scheduler:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to control cron scheduler',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 