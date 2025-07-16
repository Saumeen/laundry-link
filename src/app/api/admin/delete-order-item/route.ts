import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has appropriate role
    const allowedRoles = ['SUPER_ADMIN', 'OPERATION_MANAGER', 'FACILITY_TEAM'];
    if (!session.role || !allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

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
    return NextResponse.json(
      { error: 'Failed to delete order item' },
      { status: 500 }
    );
  }
} 