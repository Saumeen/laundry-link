import { NextResponse } from 'next/server';
import { ConfigurationManager } from '@/lib/utils/configuration';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const rewardConfig = await ConfigurationManager.getWalletTopUpRewardConfig();
    
    return NextResponse.json({
      success: true,
      data: {
        enabled: rewardConfig.enabled,
        amount: rewardConfig.amount,
        currency: 'BHD'
      }
    });
  } catch (error) {
    logger.error('Error fetching wallet reward configuration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reward configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
