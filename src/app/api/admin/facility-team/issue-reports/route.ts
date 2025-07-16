import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

interface CreateIssueReportRequest {
  orderId: number;
  issueType: 'damage' | 'stain' | 'missing_item' | 'wrong_item' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  photoUrl?: string;
}

interface UpdateIssueReportRequest {
  status?: 'reported' | 'investigating' | 'resolved' | 'escalated';
  resolution?: string;
  resolvedAt?: string;
}

// POST - Create a new issue report
export async function POST(req: Request) {
  try {
    const admin = await requireAuthenticatedAdmin();
    
    const { orderId, issueType, description, severity, photoUrl }: CreateIssueReportRequest = await req.json();

    if (!orderId || !issueType || !description || !severity) {
      return NextResponse.json(
        { error: "Order ID, issue type, description, and severity are required" },
        { status: 400 }
      );
    }

    // Check if order exists and has processing record
    const orderProcessing = await prisma.orderProcessing.findFirst({
      where: {
        orderId,
        staffId: admin.id
      }
    });

    if (!orderProcessing) {
      return NextResponse.json(
        { error: "Order processing record not found or you don't have access" },
        { status: 404 }
      );
    }

    // Create issue report
    const issueReport = await prisma.issueReport.create({
      data: {
        orderProcessingId: orderProcessing.id,
        staffId: admin.id,
        issueType,
        description,
        severity,
        photoUrl,
        status: 'reported'
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        orderProcessing: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerFirstName: true,
                customerLastName: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Issue report created successfully",
      issueReport
    });
  } catch (error) {
    console.error("Error creating issue report:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to create issue report" },
      { status: 500 }
    );
  }
}

// GET - Fetch issue reports for an order
export async function GET(req: Request) {
  try {
    await requireAuthenticatedAdmin();
    
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status') || 'all';
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Build where clause
    let whereClause: any = {
      orderProcessing: {
        orderId: parseInt(orderId)
      }
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    const issueReports = await prisma.issueReport.findMany({
      where: whereClause,
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        orderProcessing: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerFirstName: true,
                customerLastName: true
              }
            }
          }
        }
      },
      orderBy: {
        reportedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      issueReports
    });
  } catch (error) {
    console.error("Error fetching issue reports:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch issue reports" },
      { status: 500 }
    );
  }
}

// PUT - Update issue report status
export async function PUT(req: Request) {
  try {
    await requireAuthenticatedAdmin();
    
    const { searchParams } = new URL(req.url);
    const issueReportId = searchParams.get('id');
    
    if (!issueReportId) {
      return NextResponse.json(
        { error: "Issue report ID is required" },
        { status: 400 }
      );
    }

    const { status, resolution }: UpdateIssueReportRequest = await req.json();

    const issueReport = await prisma.issueReport.update({
      where: {
        id: parseInt(issueReportId)
      },
      data: {
        ...(status && { status }),
        ...(resolution !== undefined && { resolution }),
        ...(status === 'resolved' && { resolvedAt: new Date() })
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        orderProcessing: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerFirstName: true,
                customerLastName: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Issue report updated successfully",
      issueReport
    });
  } catch (error) {
    console.error("Error updating issue report:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to update issue report" },
      { status: 500 }
    );
  }
} 