import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get admin user to check role
    const adminUser = await prisma.staff.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    });

    if (
      !adminUser ||
      (adminUser.role.name !== 'OPERATION_MANAGER' &&
        adminUser.role.name !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch statistics
    const [pendingOrders, completedOrders, activeDrivers] = await Promise.all([
      // Pending orders (today)
      prisma.order.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: {
            in: [
              'ORDER_PLACED',
              'CONFIRMED',
              'PICKUP_ASSIGNED',
              'PICKUP_IN_PROGRESS',
            ],
          },
        },
      }),

      // Completed orders (today)
      prisma.order.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: 'DELIVERED',
        },
      }),

      // Active drivers
      prisma.staff.count({
        where: {
          role: { name: 'DRIVER' },
          isActive: true,
        },
      }),
    ]);

    const stats = {
      totalOrders: pendingOrders + completedOrders,
      totalCustomers: 0, // Not needed for operation manager
      totalRevenue: 0, // Not needed for operation manager
      activeStaff: 0, // Not needed for operation manager
      pendingOrders,
      completedOrders,
      activeDrivers,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching operation manager stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
