import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";
import { DriverAssignmentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    
    // Ensure the user is a driver
    if (admin.role !== "DRIVER") {
      return NextResponse.json({ error: "Access denied. Driver role required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today"; // today, week, month

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // today
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
    }

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