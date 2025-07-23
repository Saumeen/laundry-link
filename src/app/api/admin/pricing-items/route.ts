import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET - Fetch all pricing items
export async function GET() {
  try {
    // Require SUPER_ADMIN role
    await requireAdminRole('SUPER_ADMIN');

    const items = await prisma.pricingItem.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        category: true,
        _count: {
          select: { servicePricingMappings: true }
        }
      }
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching pricing items:', error);
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new pricing item
export async function POST(request: NextRequest) {
  try {
    // Require SUPER_ADMIN role
    await requireAdminRole('SUPER_ADMIN');

    const body = await request.json() as {
      name: string;
      displayName: string;
      price: string | number;
      description?: string;
      sortOrder?: number;
      categoryId: string | number;
    };
    const { name, displayName, price, description, sortOrder, categoryId } = body;

    // Validation
    if (!name || !displayName || !price || !categoryId) {
      return NextResponse.json({ error: 'Name, display name, price, and category are required' }, { status: 400 });
    }

    // Check if item name already exists
    const existingItem = await prisma.pricingItem.findFirst({
      where: { name }
    });

    if (existingItem) {
      return NextResponse.json({ error: 'Item name already exists' }, { status: 400 });
    }

    // Check if category exists
    const category = await prisma.pricingCategory.findUnique({
      where: { id: parseInt(categoryId.toString()) }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    const item = await prisma.pricingItem.create({
      data: {
        name,
        displayName,
        price: parseFloat(price.toString()),
        description: description || null,
        sortOrder: sortOrder || 0,
        categoryId: parseInt(categoryId.toString()),
        isActive: true
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing item:', error);
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 