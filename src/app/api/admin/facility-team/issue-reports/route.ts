import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin } from "@/lib/adminAuth";
import { IssueStatus } from "@prisma/client";

interface IssueReportRequest {
  orderProcessingId: number;
  issueStatus: IssueStatus;
  description: string;
  resolution?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const body: IssueReportRequest = await request.json();
    
    const {
      orderProcessingId,
      issueStatus,
      description,
      resolution,
      severity
    } = body;

    // Validate enum values
    const validIssueStatuses = Object.values(IssueStatus);
    if (!validIssueStatuses.includes(issueStatus)) {
      return NextResponse.json({ error: "Invalid issue status" }, { status: 400 });
    }

    // Check if processing exists
    const processing = await prisma.orderProcessing.findUnique({
      where: { id: orderProcessingId }
    });

    if (!processing) {
      return NextResponse.json({ error: "Processing not found" }, { status: 404 });
    }

    // Create issue report
    const issueReport = await prisma.issueReport.create({
      data: {
        orderProcessingId,
        staffId: admin.id,
        issueType: 'other',
        status: issueStatus,
        description,
        resolution,
        severity: severity || 'medium'
      },
      include: {
        orderProcessing: {
          include: {
            order: {
              include: {
                customer: true
              }
            }
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Update processing status to ISSUE_REPORTED
    await prisma.orderProcessing.update({
      where: { id: orderProcessingId },
      data: { processingStatus: 'ISSUE_REPORTED' as any }
    });

    return NextResponse.json({ 
      message: "Issue report created successfully",
      issueReport 
    });

  } catch (error) {
    console.error("Error creating issue report:", error);
    return NextResponse.json(
      { error: "Failed to create issue report" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedAdmin();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as IssueStatus;
    const orderId = searchParams.get('orderId');

    const where: any = {};
    
    if (status) {
      where.issueStatus = status;
    }
    
    if (orderId) {
      where.orderProcessing = {
        orderId: parseInt(orderId)
      };
    }

    const issueReports = await prisma.issueReport.findMany({
      where,
      include: {
        orderProcessing: {
          include: {
            order: {
              include: {
                customer: true
              }
            }
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        reportedAt: 'desc'
      }
    });

    return NextResponse.json(issueReports);

  } catch (error) {
    console.error("Error fetching issue reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue reports" },
      { status: 500 }
    );
  }
} 