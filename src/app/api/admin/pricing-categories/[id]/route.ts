import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT - Update pricing category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      displayName?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    };
    const { name, displayName, description, sortOrder, isActive } = body;

    // Check if category exists
    const existingCategory = await prisma.pricingCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with existing category (excluding current category)
    if (name && name !== existingCategory.name) {
      const nameConflict = await prisma.pricingCategory.findUnique({
        where: { name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Category name already exists' },
          { status: 400 }
        );
      }
    }

    const updatedCategory = await prisma.pricingCategory.update({
      where: { id },
      data: {
        name: name || existingCategory.name,
        displayName: displayName || existingCategory.displayName,
        description:
          description !== undefined
            ? description
            : existingCategory.description,
        sortOrder:
          sortOrder !== undefined ? sortOrder : existingCategory.sortOrder,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating pricing category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete pricing category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category exists and has items
    const existingCategory = await prisma.pricingCategory.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            servicePricingMappings: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has items
    if (existingCategory.items.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category that contains pricing items',
        },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.pricingCategory.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting pricing category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
