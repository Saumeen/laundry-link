import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { getCurrentBahrainDate } from '@/lib/utils/timezone';

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

    // Calculate date range based on Bahraini time
    const bahrainToday = getCurrentBahrainDate();
    let startDate: Date;

    switch (period) {
      case 'week':
        // Get date 7 days ago in Bahrain time
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoBahrain = weekAgo.toLocaleDateString('en-CA', { 
          timeZone: 'Asia/Bahrain' 
        });
        startDate = new Date(`${weekAgoBahrain}T00:00:00.000Z`);
        break;
      case 'month':
        // Get date 30 days ago in Bahrain time
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthAgoBahrain = monthAgo.toLocaleDateString('en-CA', { 
          timeZone: 'Asia/Bahrain' 
        });
        startDate = new Date(`${monthAgoBahrain}T00:00:00.000Z`);
        break;
      default: // today
        startDate = new Date(`${bahrainToday}T00:00:00.000Z`);
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
      // Total assignments for this driver (filter by estimated time in Bahrain timezone)
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          estimatedTime: { gte: startDate },
        },
      }),

      // Completed assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          status: 'COMPLETED',
          estimatedTime: { gte: startDate },
        },
      }),

      // In progress assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          status: 'IN_PROGRESS',
          estimatedTime: { gte: startDate },
        },
      }),

      // Pending assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          status: 'ASSIGNED',
          estimatedTime: { gte: startDate },
        },
      }),

      // Cancelled assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          status: 'CANCELLED',
          estimatedTime: { gte: startDate },
        },
      }),

      // Pickup assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          assignmentType: 'pickup',
          estimatedTime: { gte: startDate },
        },
      }),

      // Delivery assignments
      prisma.driverAssignment.count({
        where: {
          driverId: adminUser.id,
          assignmentType: 'delivery',
          estimatedTime: { gte: startDate },
        },
      }),

      // Recent assignments
      prisma.driverAssignment.findMany({
        where: {
          driverId: adminUser.id,
          estimatedTime: { gte: startDate },
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
          estimatedTime: 'desc',
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
