import prisma from '@/lib/prisma';
import { ConfigurationManager } from '@/lib/utils/configuration';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (category) {
      const configs = await ConfigurationManager.getConfigsByCategory(category);
      return NextResponse.json({ configs });
    } else {
      // Get all configurations
      const configs = await prisma.configuration.findMany({
        where: { isActive: true },
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      });
      return NextResponse.json({ configs });
    }
  } catch (error) {
    logger.error('Error fetching configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configurations' },
      { status: 500 }
    );
  }
} 