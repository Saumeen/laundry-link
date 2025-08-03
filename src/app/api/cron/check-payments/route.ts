import { NextResponse } from 'next/server';
import { PaymentStatusChecker } from '@/lib/cron/paymentStatusChecker';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    // Check for authorization (you can add your own auth logic here)
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('Payment status check cron job triggered');

    // Run the payment status check
    const result = await PaymentStatusChecker.checkPendingPayments();

    // Get statistics
    const stats = await PaymentStatusChecker.getPendingPaymentStats();

    // Clean up old failed payments
    const cleanedCount = await PaymentStatusChecker.cleanupOldFailedPayments();

    const response = {
      success: result.success,
      message: result.message,
      updatedCount: result.updatedCount,
      errors: result.errors,
      stats,
      cleanedCount,
      timestamp: new Date().toISOString()
    };

    logger.info('Payment status check completed:', response);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error in payment status check cron job:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Payment status check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check status without running the job
export async function GET(req: Request) {
  try {
    const stats = await PaymentStatusChecker.getPendingPaymentStats();
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting payment stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get payment stats',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 