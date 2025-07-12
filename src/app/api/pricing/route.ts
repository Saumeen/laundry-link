import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {

    // Get the active pricing header
    const header = await prisma.pricingHeader.findFirst({
      where: { isActive: true }
    });


    // Get all active pricing categories with their items
    const categories = await prisma.pricingCategory.findMany({
      where: { isActive: true },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });


    return NextResponse.json({
      success: true,
      data: {
        header,
        categories
      }
    });
  } catch (error) {
    console.error('Error fetching pricing data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pricing data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 