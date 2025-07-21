// src/app/api/admin/add-order-item/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";
import { ItemStatus } from "@prisma/client";

interface OrderItemRequest {
  orderServiceMappingId: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  notes?: string;
}

interface AddOrderItemRequest {
  orderId: number;
  orderServiceMappingId: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  notes?: string;
}

export async function POST(req: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const body = await req.json() as AddOrderItemRequest;
    const { 
      orderId, 
      orderServiceMappingId, 
      itemName, 
      itemType, 
      quantity, 
      pricePerItem, 
      notes 
    } = body;

    if (!orderId || !orderServiceMappingId || !itemName || !itemType || !quantity || pricePerItem === undefined) {
      return NextResponse.json(
        { error: "All required fields are required" },
        { status: 400 }
      );
    }

    // Verify that the order exists and get its service mappings
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true,
          },
        },
        orderProcessing: {
          include: {
            processingItems: {
              where: { orderServiceMappingId },
              include: {
                orderServiceMapping: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify the orderServiceMappingId exists for this order
    const serviceMapping = order.orderServiceMappings.find(
      (mapping) => mapping.id === orderServiceMappingId
    );
    
    if (!serviceMapping) {
      return NextResponse.json(
        { error: `Service mapping with ID ${orderServiceMappingId} not found for this order` },
        { status: 400 }
      );
    }

    // Calculate total price
    const totalPrice = quantity * pricePerItem;

    // Create new order item
    const createdItem = await prisma.orderItem.create({
      data: {
        orderServiceMappingId,
        itemName,
        itemType,
        quantity,
        pricePerItem,
        totalPrice,
        notes,
      },
      include: {
        orderServiceMapping: {
          include: {
            service: true,
          },
        },
      },
    });

    // If processing has already started, create processing item detail for the new order item
    let processingItemDetail = null;
    if (order.orderProcessing && order.orderProcessing.processingItems.length > 0) {
      const processingItem = order.orderProcessing.processingItems[0];
      
      processingItemDetail = await prisma.processingItemDetail.create({
        data: {
          processingItemId: processingItem.id,
          orderItemId: createdItem.id,
          quantity: createdItem.quantity,
          status: ItemStatus.PENDING
        },
        include: {
          orderItem: true,
          processingItem: {
            include: {
              orderServiceMapping: {
                include: {
                  service: true,
                },
              },
            },
          },
        },
      });
    }

    // Get all order items for this order after creation
    const allOrderItems = await prisma.orderItem.findMany({
      where: {
        orderServiceMapping: {
          orderId: orderId,
        },
      },
      include: {
        orderServiceMapping: {
          include: {
            service: true,
          },
        },
      },
    });

    // Calculate new total amount
    const newTotalAmount = allOrderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Update order with new invoice total
    await prisma.order.update({
      where: { id: orderId },
      data: {
        invoiceTotal: newTotalAmount,
      },
    });

    return NextResponse.json({
      message: "Order item added successfully",
      orderItem: {
        id: createdItem.id,
        orderServiceMappingId: createdItem.orderServiceMappingId,
        itemName: createdItem.itemName,
        itemType: createdItem.itemType,
        quantity: createdItem.quantity,
        pricePerItem: createdItem.pricePerItem,
        totalPrice: createdItem.totalPrice,
        notes: createdItem.notes,
        service: createdItem.orderServiceMapping.service,
      },
      processingItemDetail,
      newTotalAmount,
    });
  } catch (error) {
    console.error("Error adding order item:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to add order item" },
      { status: 500 }
    );
  }
} 