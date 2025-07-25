import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin } from "@/lib/adminAuth";
import { ProcessingStatus, ItemStatus, IssueStatus, OrderStatus } from "@prisma/client";
import { OrderTrackingService } from "@/lib/orderTracking";

interface ProcessingUpdateRequest {
  orderId: number;
  processingStatus: ProcessingStatus;
  totalPieces?: number;
  totalWeight?: number;
  processingNotes?: string;
  qualityScore?: number;
  items?: Array<{
    orderServiceMappingId: number;
    status: ItemStatus;
    notes?: string;
  }>;
}

interface UpdateItemProcessingRequest {
  processingItemDetailId: number;
  processedQuantity?: number;
  status: ItemStatus;
  processingNotes?: string;
  qualityScore?: number;
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
    const body: ProcessingUpdateRequest = await request.json();
    
    const {
      orderId,
      processingStatus,
      totalPieces,
      totalWeight,
      processingNotes,
      qualityScore,
      items
    } = body;

    // Validate enum values
    const validProcessingStatuses = Object.values(ProcessingStatus);
    const validItemStatuses = Object.values(ItemStatus);

    if (!validProcessingStatuses.includes(processingStatus)) {
      return NextResponse.json({ error: "Invalid processing status" }, { status: 400 });
    }

    // Check if processing exists
    const existingProcessing = await prisma.orderProcessing.findUnique({
      where: { orderId }
    });

    let processing;
    
    if (!existingProcessing) {
      // Use a transaction to ensure all operations succeed or fail together
      processing = await prisma.$transaction(async (tx) => {
        // Create new processing record
        const newProcessing = await tx.orderProcessing.create({
          data: {
            orderId,
            staffId: admin.id, // Use the authenticated admin's ID
            processingStatus,
            totalPieces,
            totalWeight,
            processingNotes,
            qualityScore,
            processingStartedAt: new Date(),
            processingCompletedAt: processingStatus === ProcessingStatus.READY_FOR_DELIVERY ? new Date() : undefined
          }
        });

        // Create processing items for each order service mapping
        const orderServiceMappings = await tx.orderServiceMapping.findMany({
          where: { orderId },
          include: {
            orderItems: true
          }
        });

        for (const mapping of orderServiceMappings) {
          // Create processing item for this service mapping
          const processingItem = await tx.processingItem.create({
            data: {
              orderProcessingId: newProcessing.id,
              orderServiceMappingId: mapping.id,
              quantity: mapping.quantity,
              status: 'PENDING'
            }
          });

          // Create processing item details for each order item in this service mapping
          for (const orderItem of mapping.orderItems) {
            await tx.processingItemDetail.create({
              data: {
                processingItemId: processingItem.id,
                orderItemId: orderItem.id,
                quantity: orderItem.quantity,
                status: 'PENDING'
              }
            });
          }
        }

        // Update order status to PROCESSING_STARTED when processing begins
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PROCESSING_STARTED }
        });

        // Create order history entry
        await tx.orderHistory.create({
          data: {
            orderId,
            staffId: admin.id,
            action: 'processing_update',
            oldValue: OrderStatus.ORDER_PLACED,
            newValue: OrderStatus.PROCESSING_STARTED,
            description: 'Processing started by facility team',
            metadata: JSON.stringify({
              processingStatus,
              processingNotes,
              totalPieces,
              totalWeight
            })
          }
        });

        return newProcessing;
      });
    } else {
      // Update existing processing record
      processing = await prisma.orderProcessing.update({
        where: { orderId },
        data: {
          processingStatus,
          totalPieces,
          totalWeight,
          processingNotes,
          qualityScore,
          processingCompletedAt: processingStatus === ProcessingStatus.READY_FOR_DELIVERY ? new Date() : undefined
        }
      });
    }

    // Update processing items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        if (!validItemStatuses.includes(item.status)) {
          return NextResponse.json({ error: "Invalid item status" }, { status: 400 });
        }

        await prisma.processingItem.updateMany({
          where: { 
            orderServiceMappingId: item.orderServiceMappingId,
            orderServiceMapping: {
              orderId
            }
          },
          data: { 
            status: item.status,
            notes: item.notes
          }
        });
      }
    }

    // Update order status based on processing status
<<<<<<< Updated upstream
    let orderStatus: string | undefined;
    let oldStatus: string | undefined;
    
=======
    let orderStatus: OrderStatus | undefined;

>>>>>>> Stashed changes
    // Get current order status
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true }
    });
    
    oldStatus = currentOrder?.status;

    if (processingStatus === ProcessingStatus.READY_FOR_DELIVERY) {
      orderStatus = OrderStatus.READY_FOR_DELIVERY;
    } else if (processingStatus === ProcessingStatus.QUALITY_CHECK) {
      orderStatus = OrderStatus.QUALITY_CHECK;
    } else if (processingStatus === ProcessingStatus.COMPLETED) {
      orderStatus = OrderStatus.PROCESSING_COMPLETED;
    }

    if (orderStatus && orderStatus !== oldStatus) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: orderStatus as any }
      });

      // Create order history entry
      await prisma.orderHistory.create({
        data: {
          orderId,
          staffId: admin.id,
          action: 'processing_update',
          oldValue: oldStatus || 'UNKNOWN',
          newValue: orderStatus,
          description: `Processing status updated to ${processingStatus.replace('_', ' ').toLowerCase()}`,
          metadata: JSON.stringify({
            processingStatus,
            processingNotes,
            totalPieces,
            totalWeight,
            qualityScore
          })
        }
      });
    }

    // After processing is created or updated, update order status if needed
    let newOrderStatus;
    if (processingStatus === ProcessingStatus.IN_PROGRESS) newOrderStatus = OrderStatus.PROCESSING_STARTED;
    else if (processingStatus === ProcessingStatus.COMPLETED) newOrderStatus = OrderStatus.PROCESSING_COMPLETED;
    else if (processingStatus === ProcessingStatus.QUALITY_CHECK) newOrderStatus = OrderStatus.QUALITY_CHECK;
    else if (processingStatus === ProcessingStatus.READY_FOR_DELIVERY) newOrderStatus = OrderStatus.READY_FOR_DELIVERY;
    if (newOrderStatus) {
      await OrderTrackingService.updateOrderStatus({
        orderId,
        staffId: admin.id,
        newStatus: newOrderStatus,
        notes: processingNotes
      });
    }

    return NextResponse.json({ 
      message: "Processing updated successfully",
      processing 
    });

  } catch (error) {
    console.error("Error updating processing:", error);
    return NextResponse.json(
      { error: "Failed to update processing" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const action = searchParams.get('action');
    
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const body = await request.json() as UpdateItemProcessingRequest | UpdateProcessingRequest;

    if (action === 'updateItem') {
      // Handle item processing update
      const itemBody = body as UpdateItemProcessingRequest;
      const {
        processingItemDetailId,
        processedQuantity,
        status,
        processingNotes,
        qualityScore,
        updateParentStatus
      } = itemBody;

      if (!processingItemDetailId || !status) {
        return NextResponse.json({ error: "Processing item detail ID and status are required" }, { status: 400 });
      }

      // Validate status
      const validItemStatuses = Object.values(ItemStatus);
      if (!validItemStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid item status" }, { status: 400 });
      }

      // Get current processing item detail to capture old status
      const currentProcessingItemDetail = await prisma.processingItemDetail.findUnique({
        where: { id: processingItemDetailId },
        select: { status: true }
      });

      const oldItemStatus = currentProcessingItemDetail?.status || 'UNKNOWN';

      // Update the processing item detail
      const updatedProcessingItemDetail = await prisma.processingItemDetail.update({
        where: { id: processingItemDetailId },
        data: {
          processedQuantity: processedQuantity || 0,
          status: status as ItemStatus,
          processingNotes: processingNotes || null,
          qualityScore: qualityScore || null,
        }
      });

      // Update parent processing item status if requested
      if (updateParentStatus) {
        const processingItemDetail = await prisma.processingItemDetail.findUnique({
          where: { id: processingItemDetailId },
          include: { processingItem: true }
        });

        if (processingItemDetail) {
          // Check if all details in this processing item are completed
          const allDetails = await prisma.processingItemDetail.findMany({
            where: { processingItemId: processingItemDetail.processingItem.id }
          });

          const allCompleted = allDetails.every(detail => detail.status === 'COMPLETED');
          const anyInProgress = allDetails.some(detail => detail.status === 'IN_PROGRESS');

          let newStatus: ItemStatus = 'PENDING';
          if (allCompleted) {
            newStatus = 'COMPLETED';
          } else if (anyInProgress) {
            newStatus = 'IN_PROGRESS';
          }

          await prisma.processingItem.update({
            where: { id: processingItemDetail.processingItem.id },
            data: { status: newStatus }
          });
        }
      }

      // Create order history entry for item processing update
      await prisma.orderHistory.create({
        data: {
          orderId: parseInt(orderId),
          staffId: admin.id,
          action: 'processing_update',
          oldValue: oldItemStatus,
          newValue: status,
          description: `Item processing updated from ${oldItemStatus.replace('_', ' ').toLowerCase()} to ${status.replace('_', ' ').toLowerCase()}`,
          metadata: JSON.stringify({
            processingItemDetailId,
            processedQuantity,
            status,
            processingNotes,
            qualityScore
          })
        }
      });

      return NextResponse.json({
        message: "Item processing updated successfully",
        processingItemDetail: updatedProcessingItemDetail
      });
    } else {
      // Handle general processing update
      const processingBody = body as UpdateProcessingRequest;
      const {
        processingStatus,
        totalPieces,
        totalWeight,
        processingNotes,
        qualityScore
      } = processingBody;

      if (!processingStatus) {
        return NextResponse.json({ error: "Processing status is required" }, { status: 400 });
      }

      // Validate enum values
      const validProcessingStatuses = Object.values(ProcessingStatus);
      if (!validProcessingStatuses.includes(processingStatus)) {
        return NextResponse.json({ error: "Invalid processing status" }, { status: 400 });
      }

      // Get current order status
      const currentOrder = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
        select: { status: true }
      });
      
      const oldStatus = currentOrder?.status;

      // Update processing record
      const processing = await prisma.orderProcessing.update({
        where: { orderId: parseInt(orderId) },
        data: {
          processingStatus,
          totalPieces,
          totalWeight,
          processingNotes,
          qualityScore,
          processingCompletedAt: processingStatus === ProcessingStatus.READY_FOR_DELIVERY ? new Date() : undefined
        }
      });

      // Update order status based on processing status
      let orderStatus: OrderStatus | undefined;
      if (processingStatus === ProcessingStatus.READY_FOR_DELIVERY) {
        orderStatus = OrderStatus.READY_FOR_DELIVERY;
      } else if (processingStatus === ProcessingStatus.QUALITY_CHECK) {
        orderStatus = OrderStatus.QUALITY_CHECK;
      } else if (processingStatus === ProcessingStatus.COMPLETED) {
        orderStatus = OrderStatus.PROCESSING_COMPLETED;
      }

      if (orderStatus && orderStatus !== oldStatus) {
        await prisma.order.update({
          where: { id: parseInt(orderId) },
          data: { status: orderStatus }
        });

        // Create order history entry
        await prisma.orderHistory.create({
          data: {
            orderId: parseInt(orderId),
            staffId: admin.id,
            action: 'processing_update',
            oldValue: oldStatus || 'UNKNOWN',
            newValue: orderStatus,
            description: `Processing status updated to ${processingStatus.replace('_', ' ').toLowerCase()}`,
            metadata: JSON.stringify({
              processingStatus,
              processingNotes,
              totalPieces,
              totalWeight,
              qualityScore
            })
          }
        });
      }

      return NextResponse.json({ 
        message: "Processing updated successfully",
        processing 
      });
    }

  } catch (error) {
    console.error("Error updating processing:", error);
    return NextResponse.json(
      { error: "Failed to update processing" },
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

    const where: any = {};
    
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
                processingItems: true
              }
            }
          }
        },
        staff: true,
        processingItems: true,
        issueReports: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(processing);

  } catch (error) {
    console.error("Error fetching processing:", error);
    return NextResponse.json(
      { error: "Failed to fetch processing" },
      { status: 500 }
    );
  }
} 