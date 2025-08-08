import { NextRequest, NextResponse } from 'next/server';
import { ConfigurationManager } from '@/lib/utils/configuration';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedAdmin();

    const config = await ConfigurationManager.getWalletQuickSlotsConfig();
    
    return NextResponse.json({ config });
  } catch (error) {
    logger.error('Error fetching wallet quick slots config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet quick slots configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuthenticatedAdmin();

    const body = await request.json();
    const { enabled, slots } = body as { enabled: boolean, slots: Array<{ id: number, amount: number, reward: number, enabled: boolean }> };

    // Update enabled status
    if (typeof enabled === 'boolean') {
      await ConfigurationManager.setConfig(
        'wallet_quick_slots_enabled',
        enabled.toString(),
        'wallet_quick_slots',
        'Enable/disable wallet quick slots feature'
      );
    }

    // Update slots
    if (Array.isArray(slots)) {
      for (const slot of slots) {
        if (slot.id && typeof slot.amount === 'number' && typeof slot.reward === 'number' && typeof slot.enabled === 'boolean') {
          await ConfigurationManager.updateWalletQuickSlot(slot.id, slot.amount, slot.reward, slot.enabled);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating wallet quick slots config:', error);
    return NextResponse.json(
      { error: 'Failed to update wallet quick slots configuration' },
      { status: 500 }
    );
  }
}
