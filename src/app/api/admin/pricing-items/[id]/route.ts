import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT - Update pricing item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const body = (await request.json()) as {
      name?: string;
      displayName?: string;
      price?: string | number;
      description?: string;
      sortOrder?: number;
      categoryId?: string | number;
      isActive?: boolean;
    };
    const {
      name,
      displayName,
      price,
      description,
      sortOrder,
      categoryId,
      isActive,
    } = body;

    // Check if item exists
    const existingItem = await prisma.pricingItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check if new name conflicts with existing item (excluding current item)
    if (name && name !== existingItem.name) {
      const nameConflict = await prisma.pricingItem.findFirst({
        where: {
          name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Item name already exists' },
          { status: 400 }
        );
      }
    }

    // Check if new category exists (if categoryId is being changed)
    if (categoryId) {
      const categoryIdNum = parseInt(categoryId.toString());
      if (categoryIdNum !== existingItem.categoryId) {
        const category = await prisma.pricingCategory.findUnique({
          where: { id: categoryIdNum },
        });

        if (!category) {
          return NextResponse.json(
            { error: 'Category not found' },
            { status: 400 }
          );
        }
      }
    }

    const updatedItem = await prisma.pricingItem.update({
      where: { id },
      data: {
        name: name || existingItem.name,
        displayName: displayName || existingItem.displayName,
        price:
          price !== undefined
            ? parseFloat(price.toString())
            : existingItem.price,
        description:
          description !== undefined ? description : existingItem.description,
        sortOrder: sortOrder !== undefined ? sortOrder : existingItem.sortOrder,
        categoryId: categoryId
          ? parseInt(categoryId.toString())
          : existingItem.categoryId,
        isActive: isActive !== undefined ? isActive : existingItem.isActive,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating pricing item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete pricing item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    // Check if item exists and has mappings
    const existingItem = await prisma.pricingItem.findUnique({
      where: { id },
      include: {
        servicePricingMappings: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check if item is being used in service mappings
    if (existingItem.servicePricingMappings.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete item that is being used in service mappings',
        },
        { status: 400 }
      );
    }

    // Delete the item
    await prisma.pricingItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting pricing item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
