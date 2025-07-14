import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

interface UpdateOrderRequest {
  status?: string;
  pickupTime?: string;
  deliveryTime?: string;
  invoiceItems?: Array<{
    id?: number; // Add ID for existing items
    itemType: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    serviceType?: string;
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
    
    const { status, pickupTime, deliveryTime, invoiceItems }: UpdateOrderRequest = await req.json();

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

    // If invoice items are provided, update them intelligently
    if (invoiceItems && Array.isArray(invoiceItems)) {
      // Get existing invoice items
      const existingItems = await prisma.invoiceItem.findMany({
        where: {
          orderId: orderIdNum,
        },
      });

      // Separate items into existing (with ID) and new (without ID)
      const itemsToUpdate = invoiceItems.filter(item => item.id && item.id > 0);
      const itemsToCreate = invoiceItems.filter(item => !item.id || item.id <= 0);
      
      // Get IDs of items that should be deleted (existing items not in the new list)
      const newItemIds = itemsToUpdate.map(item => item.id!);
      const itemsToDelete = existingItems.filter((item: { id: number }) => !newItemIds.includes(item.id));

      // Delete items that are no longer needed
      if (itemsToDelete.length > 0) {
        await prisma.invoiceItem.deleteMany({
          where: {
            id: {
              in: itemsToDelete.map((item: { id: number }) => item.id),
            },
          },
        });
      }

      // Update existing items
      for (const item of itemsToUpdate) {
        if (item.id && item.itemType && item.quantity > 0) {
          await prisma.invoiceItem.update({
            where: {
              id: item.id,
            },
            data: {
              itemType: item.itemType,
              serviceType: item.serviceType || item.itemType, // Use serviceType or itemType as fallback
              quantity: item.quantity,
              pricePerItem: item.unitPrice,
              totalPrice: item.totalPrice,
            },
          });
        }
      }

      // Create new items
      for (const item of itemsToCreate) {
        if (item.itemType && item.quantity > 0) {
          await prisma.invoiceItem.create({
            data: {
              orderId: orderIdNum,
              itemType: item.itemType,
              serviceType: item.serviceType || item.itemType, // Use serviceType or itemType as fallback
              quantity: item.quantity,
              pricePerItem: item.unitPrice,
              totalPrice: item.totalPrice,
            },
          });
        }
      }

      // Recalculate total amount
      const newInvoiceItems = await prisma.invoiceItem.findMany({
        where: {
          orderId: orderIdNum,
        },
      });

      const newTotalAmount = newInvoiceItems.reduce((sum: number, item: { totalPrice: number }) => sum + item.totalPrice, 0);

      // Update order with new total amount
      await prisma.order.update({
        where: {
          id: orderIdNum,
        },
        data: {
          totalAmount: newTotalAmount,
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