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

    if (!adminUser || adminUser.role.name !== 'SUPER_ADMIN') {
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
    const [
      totalOrders,
      totalCustomers,
      totalRevenue,
      activeStaff,
      pendingOrders,
      completedOrders,
      activeDrivers,
      avgProcessingTime,
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),

      // Total customers
      prisma.customer.count(),

      // Total revenue (sum of invoice totals)
      prisma.order.aggregate({
        where: { invoiceTotal: { not: null } },
        _sum: { invoiceTotal: true },
      }),

      // Active staff
      prisma.staff.count({
        where: { isActive: true },
      }),

      // Pending orders (today)
      prisma.order.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: { in: ['ORDER_PLACED', 'CONFIRMED', 'PICKUP_ASSIGNED'] },
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

      // Average processing time (placeholder - would need more complex calculation)
      Promise.resolve(45), // Placeholder value
    ]);

    const stats = {
      totalOrders,
      totalCustomers,
      totalRevenue: totalRevenue._sum.invoiceTotal || 0,
      activeStaff,
      pendingOrders,
      completedOrders,
      activeDrivers,
      avgProcessingTime,
      averageDeliveryTime: 30, // Placeholder value
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
