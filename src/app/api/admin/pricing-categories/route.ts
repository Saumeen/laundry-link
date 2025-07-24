import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET - Fetch all pricing categories
export async function GET() {
  try {
    // Require SUPER_ADMIN role
    await requireAdminRole('SUPER_ADMIN');

    const categories = await prisma.pricingCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching pricing categories:', error);
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new pricing category
export async function POST(request: NextRequest) {
  try {
    // Require SUPER_ADMIN role
    await requireAdminRole('SUPER_ADMIN');

    const body = (await request.json()) as {
      name: string;
      displayName: string;
      description?: string;
      sortOrder?: number;
    };
    const { name, displayName, description, sortOrder } = body;

    // Validation
    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and display name are required' },
        { status: 400 }
      );
    }

    // Check if category name already exists
    const existingCategory = await prisma.pricingCategory.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      );
    }

    const category = await prisma.pricingCategory.create({
      data: {
        name,
        displayName,
        description: description || null,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing category:', error);
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
