import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    if (!adminUser || adminUser.role.name !== 'DRIVER') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // today
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
    }

    // Fetch driver assignments and statistics
    const [
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      pendingAssignments,
      cancelledAssignments,
      pickupAssignments,
      deliveryAssignments,
      recentAssignments,
    ] = await Promise.all([
      // Total assignments for this driver
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          createdAt: { gte: startDate },
        },
      }),

      // Completed assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
      }),

      // In progress assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          status: 'IN_PROGRESS',
          createdAt: { gte: startDate },
        },
      }),

      // Pending assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          status: 'ASSIGNED',
          createdAt: { gte: startDate },
        },
      }),

      // Cancelled assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          status: 'CANCELLED',
          createdAt: { gte: startDate },
        },
      }),

      // Pickup assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          assignmentType: 'pickup',
          createdAt: { gte: startDate },
        },
      }),

      // Delivery assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          assignmentType: 'delivery',
          createdAt: { gte: startDate },
        },
      }),

      // Recent assignments
      prisma.driverAssignment.findMany({
        where: {
          driverId: adminUser.id,
          createdAt: { gte: startDate },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              customerFirstName: true,
              customerLastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    // Calculate completion rate
    const completionRate =
      totalAssignments > 0
        ? (completedAssignments / totalAssignments) * 100
        : 0;

    // Calculate earnings (placeholder - would need actual earnings calculation)
    const earnings = completedAssignments * 5; // Placeholder: 5 BD per completed assignment

    const stats = {
      period,
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      pendingAssignments,
      cancelledAssignments,
      earnings,
      pickupAssignments,
      deliveryAssignments,
      completionRate,
      recentAssignments: recentAssignments.map(assignment => ({
        id: assignment.id,
        status: assignment.status,
        assignmentType: assignment.assignmentType,
        order: assignment.order,
      })),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
