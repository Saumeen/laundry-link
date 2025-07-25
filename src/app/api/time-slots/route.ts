import { NextResponse } from 'next/server';
import prisma  from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.timeSlotConfig.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!config) {
      // Return default configuration if none exists
      return NextResponse.json({
        config: {
          slotDuration: 3,
          startTime: '09:00',
          endTime: '21:00',
        }
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching time slot configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slot configuration' },
      { status: 500 }
    );
  }
} 