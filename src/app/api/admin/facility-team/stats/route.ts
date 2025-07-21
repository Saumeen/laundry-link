import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";
import { DriverAssignmentStatus, ProcessingStatus } from "@prisma/client";

// GET - Fetch facility team statistics
export async function GET(req: Request) {
  try {
    const admin = await requireAuthenticatedAdmin();
    
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today'; // today, week, month
    
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

    // Get orders ready for processing (received at facility but not yet processed)
    const ordersReadyForProcessing = await prisma.order.count({
      where: {
        driverAssignments: {
          some: {
            assignmentType: 'pickup',
            status: DriverAssignmentStatus.COMPLETED
          }
        },
        status: 'RECEIVED_AT_FACILITY',
        orderProcessing: null
      }
    });

    // Get orders currently being processed by this staff member
    const ordersInProcessing = await prisma.orderProcessing.count({
      where: {
        staffId: admin.id,
        processingStatus: {
          in: [ProcessingStatus.PENDING, ProcessingStatus.IN_PROGRESS]
        },
        createdAt: {
          gte: startDate
        }
      }
    });

    // Get completed orders by this staff member
    const completedOrders = await prisma.orderProcessing.count({
      where: {
        staffId: admin.id,
        processingStatus: ProcessingStatus.READY_FOR_DELIVERY,
        processingCompletedAt: {
          gte: startDate
        }
      }
    });

    // Get average processing time
    const processingTimes = await prisma.orderProcessing.findMany({
      where: {
        staffId: admin.id,
        processingCompletedAt: {
          gte: startDate
        },
        processingStartedAt: {
          not: null
        }
      },
      select: {
        processingStartedAt: true,
        processingCompletedAt: true
      }
    });

    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((acc, processing) => {
          if (processing.processingStartedAt && processing.processingCompletedAt) {
            const timeDiff = processing.processingCompletedAt.getTime() - processing.processingStartedAt.getTime();
            return acc + timeDiff;
          }
          return acc;
        }, 0) / processingTimes.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Get quality score (average of all quality scores)
    const qualityScores = await prisma.orderProcessing.findMany({
      where: {
        staffId: admin.id,
        qualityScore: {
          not: null
        },
        processingCompletedAt: {
          gte: startDate
        }
      },
      select: {
        qualityScore: true
      }
    });

    const avgQualityScore = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((acc, score) => acc + (score.qualityScore || 0), 0) / qualityScores.length)
      : 0;

    // Get issue reports by this staff member
    const issueReports = await prisma.issueReport.count({
      where: {
        staffId: admin.id,
        reportedAt: {
          gte: startDate
        }
      }
    });

    // Get issue reports by severity
    const issueReportsBySeverity = await prisma.issueReport.groupBy({
      by: ['severity'],
      where: {
        staffId: admin.id,
        reportedAt: {
          gte: startDate
        }
      },
      _count: {
        severity: true
      }
    });

    // Get recent activity (last 10 orders processed)
    const recentActivity = await prisma.orderProcessing.findMany({
      where: {
        staffId: admin.id,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerFirstName: true,
            customerLastName: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return NextResponse.json({
      success: true,
      stats: {
        ordersReadyForProcessing,
        ordersInProcessing,
        completedOrders,
        avgProcessingTime: Math.round(avgProcessingTime * 10) / 10, // Round to 1 decimal
        avgQualityScore,
        issueReports,
        issueReportsBySeverity: issueReportsBySeverity.reduce((acc, item) => {
          acc[item.severity] = item._count.severity;
          return acc;
        }, {} as Record<string, number>),
        recentActivity
      }
    });
  } catch (error) {
    console.error("Error fetching facility team stats:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
} 