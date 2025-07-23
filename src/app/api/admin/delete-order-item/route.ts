import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRoles } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import { UserRole } from '@/types/global';

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and role
    const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'OPERATION_MANAGER', 'FACILITY_TEAM'];
    await requireAdminRoles(allowedRoles);

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Delete the order item
    await prisma.orderItem.delete({
      where: {
        id: parseInt(itemId),
      },
    });

    return NextResponse.json({ message: 'Order item deleted successfully' });
  } catch (error) {
    console.error('Error deleting order item:', error);
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to delete order item' },
      { status: 500 }
    );
  }
} 