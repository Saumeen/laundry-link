import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

interface StartProcessingRequest {
  orderId: number;
  totalPieces?: number;
  totalWeight?: number;
  processingNotes?: string;
}

interface UpdateProcessingRequest {
  processingStatus?: string;
  totalPieces?: number;
  totalWeight?: number;
  processingNotes?: string;
  qualityScore?: number;
}

interface UpdateItemProcessingRequest {
  processingItemDetailId: number;
  processedQuantity?: number;
  status?: string;
  processingNotes?: string;
  qualityScore?: number;
  updateParentStatus?: boolean; // New optional flag
}

interface AddOrderItemRequest {
  orderServiceMappingId: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  notes?: string;
}

// POST - Start processing an order
export async function POST(req: Request) {
  try {
    const admin = await requireAuthenticatedAdmin();
    
    const { orderId, totalPieces, totalWeight, processingNotes }: StartProcessingRequest = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Check if order exists and is ready for processing
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        driverAssignments: {
          some: {
            assignmentType: 'pickup',
            status: 'completed'
          }
        }
      },
      include: {
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true // Include order items
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or not ready for processing" },
        { status: 404 }
      );
    }

    // Check if processing already exists
    const existingProcessing = await prisma.orderProcessing.findUnique({
      where: { orderId }
    });

    if (existingProcessing) {
      return NextResponse.json(
        { error: "Order is already being processed" },
        { status: 409 }
      );
    }

    // Create processing record
    const processing = await prisma.orderProcessing.create({
      data: {
        orderId,
        staffId: admin.id,
        processingStatus: 'pending',
        totalPieces,
        totalWeight,
        processingNotes,
        processingStartedAt: new Date()
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create processing items for each service mapping
    const processingItems = await Promise.all(
      order.orderServiceMappings.map(async (mapping) => {
        const processingItem = await prisma.processingItem.create({
          data: {
            orderProcessingId: processing.id,
            orderServiceMappingId: mapping.id,
            quantity: mapping.quantity,
            status: 'pending'
          },
          include: {
            orderServiceMapping: {
              include: {
                service: true,
                orderItems: true
              }
            }
          }
        });

        // Create processing item details for each order item
        const processingItemDetails = await Promise.all(
          mapping.orderItems.map(async (orderItem) => {
            return await prisma.processingItemDetail.create({
              data: {
                processingItemId: processingItem.id,
                orderItemId: orderItem.id,
                quantity: orderItem.quantity,
                status: 'pending'
              },
              include: {
                orderItem: true
              }
            });
          })
        );

        return {
          ...processingItem,
          processingItemDetails
        };
      })
    );

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'Processing' }
    });

    return NextResponse.json({
      success: true,
      message: "Order processing started successfully",
      processing: {
        ...processing,
        processingItems
      }
    });
  } catch (error) {
    console.error("Error starting order processing:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to start order processing" },
      { status: 500 }
    );
  }
}

// PUT - Update processing status
export async function PUT(req: Request) {
  try {
    const admin = await requireAuthenticatedAdmin();
    
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const action = searchParams.get('action');
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (action === 'updateItem') {
      // Handle item-level processing updates
      const { processingItemDetailId, processedQuantity, status, processingNotes, qualityScore, updateParentStatus }: UpdateItemProcessingRequest = await req.json();
      
      const updatedDetail = await prisma.processingItemDetail.update({
        where: { id: processingItemDetailId },
        data: {
          ...(processedQuantity !== undefined && { processedQuantity }),
          ...(status && { status }),
          ...(processingNotes !== undefined && { processingNotes }),
          ...(qualityScore !== undefined && { qualityScore })
        },
        include: {
          orderItem: true,
          processingItem: {
            include: {
              orderServiceMapping: {
                include: {
                  service: true
                }
              }
            }
          }
        }
      });

      // Only update parent processing item status if explicitly requested
      if (updateParentStatus) {
        const allDetails = await prisma.processingItemDetail.findMany({
          where: { processingItemId: updatedDetail.processingItemId }
        });

        const allCompleted = allDetails.every(detail => detail.status === 'completed');
        const anyInProgress = allDetails.some(detail => detail.status === 'in_progress');
        const anyIssues = allDetails.some(detail => detail.status === 'issue_reported');

        let newStatus = 'pending';
        if (anyIssues) {
          newStatus = 'issue_reported';
        } else if (allCompleted) {
          newStatus = 'completed';
        } else if (anyInProgress) {
          newStatus = 'in_progress';
        }

        await prisma.processingItem.update({
          where: { id: updatedDetail.processingItemId },
          data: { status: newStatus }
        });
      }

      return NextResponse.json({
        success: true,
        message: "Item processing updated successfully",
        processingItemDetail: updatedDetail
      });
    } else if (action === 'addOrderItem') {
      // Handle adding order items to processing
      const { orderServiceMappingId, itemName, itemType, quantity, pricePerItem, notes }: AddOrderItemRequest = await req.json();
      
      // Create the order item
      const orderItem = await prisma.orderItem.create({
        data: {
          orderServiceMappingId,
          itemName,
          itemType,
          quantity,
          pricePerItem,
          totalPrice: quantity * pricePerItem,
          notes
        },
        include: {
          orderServiceMapping: {
            include: {
              service: true
            }
          }
        }
      });

      // If there's an existing processing record, add processing item details
      const existingProcessing = await prisma.orderProcessing.findUnique({
        where: { orderId: parseInt(orderId) },
        include: {
          processingItems: {
            where: { orderServiceMappingId }
          }
        }
      });

      if (existingProcessing && existingProcessing.processingItems.length > 0) {
        const processingItem = existingProcessing.processingItems[0];
        
        // Create processing item detail for the new order item
        await prisma.processingItemDetail.create({
          data: {
            processingItemId: processingItem.id,
            orderItemId: orderItem.id,
            quantity: orderItem.quantity,
            status: 'pending'
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: "Order item added successfully",
        orderItem
      });
    } else {
      // Handle overall processing updates
      const { processingStatus, totalPieces, totalWeight, processingNotes, qualityScore }: UpdateProcessingRequest = await req.json();

      // Update processing record
      const processing = await prisma.orderProcessing.update({
        where: { orderId: parseInt(orderId) },
        data: {
          ...(processingStatus && { processingStatus }),
          ...(totalPieces !== undefined && { totalPieces }),
          ...(totalWeight !== undefined && { totalWeight }),
          ...(processingNotes !== undefined && { processingNotes }),
          ...(qualityScore !== undefined && { qualityScore }),
          ...(processingStatus === 'ready_for_delivery' && { processingCompletedAt: new Date() })
        },
        include: {
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          processingItems: {
            include: {
              orderServiceMapping: {
                include: {
                  service: true,
                  orderItems: true
                }
              },
              processingItemDetails: {
                include: {
                  orderItem: true
                }
              }
            }
          }
        }
      });

      // Update order status based on processing status
      let orderStatus = 'Processing';
      if (processingStatus === 'ready_for_delivery') {
        orderStatus = 'Cleaning Complete';
      } else if (processingStatus === 'quality_check') {
        orderStatus = 'Quality Check';
      }

      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { status: orderStatus }
      });

      return NextResponse.json({
        success: true,
        message: "Processing updated successfully",
        processing
      });
    }
  } catch (error) {
    console.error("Error updating processing:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to update processing" },
      { status: 500 }
    );
  }
} 