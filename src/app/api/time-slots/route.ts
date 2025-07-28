import { NextResponse } from 'next/server';
import { ConfigurationManager } from '@/lib/utils/configuration';

export async function GET() {
  try {
    const config = await ConfigurationManager.getTimeSlotConfig();

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching time slot configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slot configuration' },
      { status: 500 }
    );
  }
}
