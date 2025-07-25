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

    if (!adminUser || adminUser.role.name !== 'FACILITY_TEAM') {
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
    const [pendingOrders, completedOrders] =
      await Promise.all([
        // Pending orders (ready for processing)
        prisma.order.count({
          where: {
            status: { in: ['RECEIVED_AT_FACILITY', 'PROCESSING_STARTED'] },
          },
        }),

        // Completed orders (today)
        prisma.order.count({
          where: {
            updatedAt: { gte: today, lt: tomorrow },
            status: 'READY_FOR_DELIVERY',
          },
        }),

      ]);

    const stats = {
      totalOrders: pendingOrders + completedOrders,
      totalCustomers: 0, // Not needed for facility team
      totalRevenue: 0, // Not needed for facility team
      activeStaff: 0, // Not needed for facility team
      pendingOrders,
      completedOrders,
      activeDrivers: 0, // Not needed for facility team
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching facility team stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
