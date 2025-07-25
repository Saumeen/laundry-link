import { NextResponse } from 'next/server';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ processingItemDetailId: string }> }
) {
  try {
    // Get authenticated admin from session
    const admin = await requireAuthenticatedAdmin();

    const { processingItemDetailId } = await params;

    if (!processingItemDetailId) {
      return NextResponse.json(
        { error: 'Processing item detail ID is required' },
        { status: 400 }
      );
    }

    // Verify the processing item detail exists and belongs to an order the admin can access
    const processingItemDetail = await prisma.processingItemDetail.findFirst({
      where: {
        id: parseInt(processingItemDetailId),
        processingItem: {
          orderProcessing: {
            staffId: admin.id,
          },
        },
      },
      include: {
        issueReports: {
          include: {
            staff: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            reportedAt: 'desc',
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

    return NextResponse.json({
      issueReports: processingItemDetail.issueReports,
    });
  } catch (error) {
    console.error('Error fetching issue reports:', error || 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to fetch issue reports' },
      { status: 500 }
    );
  }
} 