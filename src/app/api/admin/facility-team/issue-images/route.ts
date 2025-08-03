import { NextResponse } from 'next/server';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    // Get authenticated admin from session
    const admin = await requireAuthenticatedAdmin();

    const body = await req.json();
    const { processingItemDetailId, images, issueType, description, severity } =
      body as {
        processingItemDetailId: number;
        images: string[]; // Array of base64 image strings
        issueType: string;
        description: string;
        severity: string;
      };

    if (!processingItemDetailId || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Processing item detail ID and images are required' },
        { status: 400 }
      );
    }

    // Verify the processing item detail exists and belongs to an order the admin can access
    const processingItemDetail = await prisma.processingItemDetail.findFirst({
      where: {
        id: processingItemDetailId,
        processingItem: {
          orderProcessing: {
            staffId: admin.id,
          },
        },
      },
      include: {
        processingItem: {
          include: {
            orderProcessing: true,
          },
        },
      },
    });

    if (!processingItemDetail) {
      return NextResponse.json(
        { error: 'Processing item detail not found or access denied' },
        { status: 404 }
      );
    }

    // Check if issue report already exists for this processing item detail
    const existingIssueReport = await prisma.issueReport.findFirst({
      where: {
        processingItemDetailId,
      },
    });

    let issueReport;
    if (existingIssueReport) {
      // Update existing issue report
      issueReport = await prisma.issueReport.update({
        where: {
          id: existingIssueReport.id,
        },
        data: {
          images: images,
          issueType,
          description,
          severity,
          status: 'REPORTED',
        },
      });
    } else {
      // Create new issue report
      issueReport = await prisma.issueReport.create({
        data: {
          orderProcessingId:
            processingItemDetail.processingItem.orderProcessing.id,
          staffId: admin.id,
          processingItemDetailId,
          images: images,
          issueType,
          description,
          severity,
          status: 'REPORTED',
          reportedAt: new Date(),
        },
      });
    }

    // Update the processing item detail status to ISSUE_REPORTED
    await prisma.processingItemDetail.update({
      where: { id: processingItemDetailId },
      data: { status: 'ISSUE_REPORTED' },
    });

    logger.info(`Issue report created/updated for processing item detail ${processingItemDetailId} by staff ${admin.id}`
    );

    return NextResponse.json({
      message: 'Issue report saved successfully',
      issueReport,
    });
  } catch (error) {
    logger.error('Error saving issue report:', error || 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to save issue report' },
      { status: 500 }
    );
  }
}
