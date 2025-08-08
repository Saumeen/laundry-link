import { NextRequest, NextResponse } from 'next/server';
import { ConfigurationManager } from '@/lib/utils/configuration';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const config = await ConfigurationManager.getWalletQuickSlotsConfig();
    
    return NextResponse.json({
      success: true,
      data: {
        enabled: config.enabled,
        slots: config.slots
      }
    });
  } catch (error) {
    logger.error('Error fetching wallet quick slots config:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch wallet quick slots configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
