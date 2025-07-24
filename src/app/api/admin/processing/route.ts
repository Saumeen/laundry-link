import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import { ProcessingStatus, ItemStatus } from '@prisma/client';

interface ProcessingRequest {
  orderId: number;
  processingStatus: ProcessingStatus;
  totalPieces?: number;
  totalWeight?: number;
  processingNotes?: string;
  qualityScore?: number;
  items?: Array<{
    orderServiceMappingId: number;
    itemStatus: ItemStatus;
    notes?: string;
  }>;
}

interface UpdateItemRequest {
  processingItemDetailId: number;
  processedQuantity?: number;
  status: ItemStatus;
  processingNotes?: string;
  updateParentStatus?: boolean;
}

interface UpdateProcessingRequest {
  processingStatus: ProcessingStatus;
  totalPieces?: number;
  totalWeight?: number;
  processingNotes?: string;
  qualityScore?: number;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const body: ProcessingRequest = await request.json();

    const {
      orderId,
      processingStatus,
      totalPieces,
      totalWeight,
      processingNotes,
      qualityScore,
      items,
    } = body;

    // Validate enum values
    const validProcessingStatuses = Object.values(ProcessingStatus);
    const validItemStatuses = Object.values(ItemStatus);

    if (!validProcessingStatuses.includes(processingStatus)) {
      return NextResponse.json(
        { error: 'Invalid processing status' },
        { status: 400 }
      );
    }

    // Check if processing already exists
    const existingProcessing = await prisma.orderProcessing.findUnique({
      where: { orderId },
    });

    if (existingProcessing) {
      return NextResponse.json(
        { error: 'Processing already exists for this order' },
        { status: 400 }
      );
    }

    // Create processing record
    const processing = await prisma.orderProcessing.create({
      data: {
        orderId,
        staffId: admin.id,
        processingStatus,
        totalPieces,
        totalWeight,
        processingNotes,
        qualityScore,
        processingStartedAt: new Date(),
      },
    });

    // Create processing items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        if (!validItemStatuses.includes(item.itemStatus)) {
          return NextResponse.json(
            { error: 'Invalid item status' },
            { status: 400 }
          );
        }

        await prisma.processingItem.create({
          data: {
            orderProcessingId: processing.id,
            orderServiceMappingId: item.orderServiceMappingId,
            quantity: 1,
            status: item.itemStatus,
            notes: item.notes,
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Processing started successfully',
      processing,
    });
  } catch (error) {
    console.error('Error starting processing:', error);
    return NextResponse.json(
      { error: 'Failed to start processing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ProcessingStatus;
    const orderId = searchParams.get('orderId');

    const where: Record<string, unknown> = {};

    if (status) {
      where.processingStatus = status;
    }

    if (orderId) {
      where.orderId = parseInt(orderId);
    }

    const processing = await prisma.orderProcessing.findMany({
      where,
      include: {
        order: {
          include: {
            customer: true,
            orderServiceMappings: {
              include: {
                service: true,
                processingItems: true,
              },
            },
          },
        },
        staff: true,
        processingItems: true,
        issueReports: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(processing);
  } catch (error) {
    console.error('Error fetching processing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch processing' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (action === 'updateItem') {
      const {
        processingItemDetailId,
        processedQuantity,
        status,
        processingNotes,
        updateParentStatus,
      } = body as UpdateItemRequest;

      if (!processingItemDetailId || !status) {
        return NextResponse.json(
          { error: 'Processing item detail ID and status are required' },
          { status: 400 }
        );
      }

      // Validate item status
      const validItemStatuses = Object.values(ItemStatus);
      if (!validItemStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid item status' },
          { status: 400 }
        );
      }

      // Update processing item detail
      const updatedItemDetail = await prisma.processingItemDetail.update({
        where: { id: processingItemDetailId },
        data: {
          processedQuantity: processedQuantity || 0,
          status: status,
          processingNotes: processingNotes || null,
        },
      });

      return NextResponse.json({
        message: 'Processing item detail updated successfully',
        item: updatedItemDetail,
      });
    }

    if (action === 'updateProcessing') {
      const {
        processingStatus,
        totalPieces,
        totalWeight,
        processingNotes,
        qualityScore,
      } = body as UpdateProcessingRequest;

      if (!processingStatus) {
        return NextResponse.json(
          { error: 'Processing status is required' },
          { status: 400 }
        );
      }

      // Validate processing status
      const validProcessingStatuses = Object.values(ProcessingStatus);
      if (!validProcessingStatuses.includes(processingStatus)) {
        return NextResponse.json(
          { error: 'Invalid processing status' },
          { status: 400 }
        );
      }

      // Update processing record
      const updatedProcessing = await prisma.orderProcessing.update({
        where: { orderId: parseInt(orderId) },
        data: {
          processingStatus,
          totalPieces,
          totalWeight,
          processingNotes,
          qualityScore,
          processingCompletedAt:
            processingStatus === ProcessingStatus.COMPLETED ? new Date() : null,
        },
      });

      return NextResponse.json({
        message: 'Processing updated successfully',
        processing: updatedProcessing,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating processing:', error);
    return NextResponse.json(
      { error: 'Failed to update processing' },
      { status: 500 }
    );
  }
}
