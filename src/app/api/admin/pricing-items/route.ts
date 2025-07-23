import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch all pricing items
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.userType !== 'admin' || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new pricing item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.userType !== 'admin' || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, displayName, price, description, sortOrder, categoryId } = body;

    // Validation
    if (!name || !displayName || !price || !categoryId) {
      return NextResponse.json({ error: 'Name, display name, price, and category are required' }, { status: 400 });
    }

    // Check if item name already exists
    const existingItem = await prisma.pricingItem.findUnique({
      where: { name }
    });

    if (existingItem) {
      return NextResponse.json({ error: 'Item name already exists' }, { status: 400 });
    }

    // Check if category exists
    const category = await prisma.pricingCategory.findUnique({
      where: { id: parseInt(categoryId) }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    const item = await prisma.pricingItem.create({
      data: {
        name,
        displayName,
        price: parseFloat(price),
        description: description || null,
        sortOrder: sortOrder || 0,
        categoryId: parseInt(categoryId),
        isActive: true
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 