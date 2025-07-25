<<<<<<< Updated upstream
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";
import { DriverAssignmentStatus } from "@prisma/client";
=======
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { getCurrentBahrainDate } from '@/lib/utils/timezone';
>>>>>>> Stashed changes

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    
    // Ensure the user is a driver
    if (admin.role !== "DRIVER") {
      return NextResponse.json({ error: "Access denied. Driver role required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today"; // today, week, month

<<<<<<< Updated upstream
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
=======
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
>>>>>>> Stashed changes
        break;
      default: // today
        startDate = new Date(`${bahrainToday}T00:00:00.000Z`);
        break;
    }

<<<<<<< Updated upstream
    // Get assignments for the period
    const assignments = await prisma.driverAssignment.findMany({
      where: {
        driverId: admin.id,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            invoiceTotal: true,
          },
        },
      },
    });

    // Calculate stats
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === DriverAssignmentStatus.COMPLETED).length;
    const inProgressAssignments = assignments.filter(a => a.status === DriverAssignmentStatus.IN_PROGRESS).length;
    const pendingAssignments = assignments.filter(a => a.status === DriverAssignmentStatus.ASSIGNED).length;
    const cancelledAssignments = assignments.filter(a => a.status === DriverAssignmentStatus.CANCELLED).length;

    // Calculate earnings (assuming $5 per completed assignment)
    const earnings = completedAssignments * 5;

    // Get assignments by type
    const pickupAssignments = assignments.filter(a => a.assignmentType === "pickup");
    const deliveryAssignments = assignments.filter(a => a.assignmentType === "delivery");

    // Get recent activity
    const recentAssignments = await prisma.driverAssignment.findMany({
      where: {
        driverId: admin.id,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            customerFirstName: true,
            customerLastName: true,
          },
=======
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
>>>>>>> Stashed changes
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    });

    const stats = {
      period,
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      pendingAssignments,
      cancelledAssignments,
      earnings,
      pickupAssignments: pickupAssignments.length,
      deliveryAssignments: deliveryAssignments.length,
      completionRate: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0,
      recentAssignments,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching driver stats:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
} 