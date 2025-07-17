import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

interface UpdateOrderRequest {
  status?: string;
  pickupTime?: string;
  deliveryTime?: string;
  orderItems?: Array<{
    id?: number; // Add ID for existing items
    orderServiceMappingId: number;
    itemName: string;
    itemType: string;
    quantity: number;
    pricePerItem: number;
    totalPrice: number;
    notes?: string;
  }>;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    // Await params before using
    const resolvedParams = await params;

    // Validate params and orderId
    if (!resolvedParams || !resolvedParams.orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const { orderId } = resolvedParams;
    
    // Validate that orderId is a valid number
    const orderIdNum = parseInt(orderId);
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }
    
    const { status, pickupTime, deliveryTime, orderItems }: UpdateOrderRequest = await req.json();

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (pickupTime) updateData.pickupTime = new Date(pickupTime);
    if (deliveryTime) updateData.deliveryTime = new Date(deliveryTime);

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderIdNum,
      },
      data: updateData,
    });

    // If order items are provided, update them intelligently
    if (orderItems && Array.isArray(orderItems)) {
      // Get existing order items for this order
      const existingItems = await prisma.orderItem.findMany({
        where: {
          orderServiceMapping: {
            orderId: orderIdNum,
          },
        },
      });

      // Separate items into existing (with ID) and new (without ID)
      const itemsToUpdate = orderItems.filter(item => item.id && item.id > 0);
      const itemsToCreate = orderItems.filter(item => !item.id || item.id <= 0);
      
      // Get IDs of items that should be deleted (existing items not in the new list)
      const newItemIds = itemsToUpdate.map(item => item.id!);
      const itemsToDelete = existingItems.filter((item: { id: number }) => !newItemIds.includes(item.id));

      // Delete items that are no longer needed
      if (itemsToDelete.length > 0) {
        await prisma.orderItem.deleteMany({
          where: {
            id: {
              in: itemsToDelete.map((item: { id: number }) => item.id),
            },
          },
        });
      }

      // Update existing items
      for (const item of itemsToUpdate) {
        if (item.id && item.orderServiceMappingId && item.quantity > 0) {
          await prisma.orderItem.update({
            where: {
              id: item.id,
            },
            data: {
              orderServiceMappingId: item.orderServiceMappingId,
              itemName: item.itemName,
              itemType: item.itemType,
              quantity: item.quantity,
              pricePerItem: item.pricePerItem,
              totalPrice: item.totalPrice,
              notes: item.notes,
            },
          });
        }
      }

      // Create new items
      for (const item of itemsToCreate) {
        if (item.orderServiceMappingId && item.quantity > 0) {
          await prisma.orderItem.create({
            data: {
              orderServiceMappingId: item.orderServiceMappingId,
              itemName: item.itemName,
              itemType: item.itemType,
              quantity: item.quantity,
              pricePerItem: item.pricePerItem,
              totalPrice: item.totalPrice,
              notes: item.notes,
            },
          });
        }
      }

      // Recalculate total amount
      const newOrderItems = await prisma.orderItem.findMany({
        where: {
          orderServiceMapping: {
            orderId: orderIdNum,
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

      // Calculate total using totalPrice for each item
      const newTotalAmount = newOrderItems.reduce((sum: number, item: { totalPrice: number }) => 
        sum + item.totalPrice, 0);

      // Update order with new total amount
      await prisma.order.update({
        where: {
          id: orderIdNum,
        },
        data: {
          invoiceTotal: newTotalAmount,
        },
      });
    }

    // Fetch the updated order with all related data
    const finalOrder = await prisma.order.findUnique({
      where: {
        id: orderIdNum,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({
      message: "Order updated successfully",
      order: finalOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error || 'Unknown error');
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
} 