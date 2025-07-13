// src/app/api/admin/add-invoice-item/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const body = await req.json();
    const { orderId, invoiceItems } = body as { orderId: number; invoiceItems: any[] };

    if (!orderId || !invoiceItems || !Array.isArray(invoiceItems)) {
      return NextResponse.json(
        { error: "Order ID and invoice items array are required" },
        { status: 400 }
      );
    }

    // Get existing invoice items
    const existingItems = await prisma.invoiceItem.findMany({
      where: {
        orderId: orderId,
      },
    });

    // Separate items into existing (with ID) and new (without ID)
    const itemsToUpdate = invoiceItems.filter(item => item.id && item.id > 0);
    const itemsToCreate = invoiceItems.filter(item => !item.id || item.id <= 0);
    
    // Get IDs of items that should be deleted (existing items not in the new list)
    const newItemIds = itemsToUpdate.map(item => item.id);
    const itemsToDelete = existingItems.filter(item => !newItemIds.includes(item.id));

    // Delete items that are no longer needed
    if (itemsToDelete.length > 0) {
      await prisma.invoiceItem.deleteMany({
        where: {
          id: {
            in: itemsToDelete.map(item => item.id),
          },
        },
      });
    }

    // Update existing items
    const updatedItems = [];
    for (const item of itemsToUpdate) {
      if (item.id && item.itemType && item.quantity && item.pricePerItem !== undefined) {
        const updatedItem = await prisma.invoiceItem.update({
          where: {
            id: item.id,
          },
          data: {
            itemType: item.itemType,
            quantity: parseInt(item.quantity.toString()),
            pricePerItem: parseFloat(item.pricePerItem.toString()),
            totalPrice: parseFloat(item.totalPrice.toString()),
            serviceType: item.serviceType || 'laundry', // Default service type
          },
        });
        updatedItems.push(updatedItem);
      }
    }

    // Create new items
    const createdItems = [];
    for (const item of itemsToCreate) {
      if (item.itemType && item.quantity && item.pricePerItem !== undefined) {
        const invoiceItem = await prisma.invoiceItem.create({
          data: {
            orderId: orderId,
            itemType: item.itemType,
            quantity: parseInt(item.quantity.toString()),
            pricePerItem: parseFloat(item.pricePerItem.toString()),
            totalPrice: parseFloat(item.totalPrice.toString()),
            serviceType: item.serviceType || 'laundry', // Default service type
          },
        });
        createdItems.push(invoiceItem);
      }
    }

    // Recalculate order total amount
    const allInvoiceItems = await prisma.invoiceItem.findMany({
      where: {
        orderId: orderId,
      },
    });

    const newTotalAmount = allInvoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Update order total amount
    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        totalAmount: newTotalAmount,
      },
    });

    return NextResponse.json({
      message: "Invoice items updated successfully",
      invoiceItems: [...updatedItems, ...createdItems],
      newTotalAmount,
    });
  } catch (error) {
    console.error("Error adding invoice item:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to add invoice item" },
      { status: 500 }
    );
  }
}

