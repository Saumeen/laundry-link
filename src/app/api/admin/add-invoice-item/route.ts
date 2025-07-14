// src/app/api/admin/add-invoice-item/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";
import { calculateInvoiceItemTotal } from "@/lib/calculations";

interface InvoiceItemRequest {
  id?: number;
  orderServiceMappingId: number;
  quantity: number;
  pricePerItem: number;
  notes?: string;
}

interface AddInvoiceItemRequest {
  orderId: number;
  invoiceItems: InvoiceItemRequest[];
}

export async function POST(req: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const body = await req.json() as AddInvoiceItemRequest;
    const { orderId, invoiceItems } = body;

    if (!orderId || !invoiceItems || !Array.isArray(invoiceItems)) {
      return NextResponse.json(
        { error: "Order ID and invoice items array are required" },
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
            invoiceItems: true,
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

    // Get all existing invoice items for this order
    const existingItems = await prisma.invoiceItem.findMany({
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

    // Separate items into existing (with ID) and new (without ID)
    const itemsToUpdate = invoiceItems.filter((item: InvoiceItemRequest) => item.id && item.id > 0);
    const itemsToCreate = invoiceItems.filter((item: InvoiceItemRequest) => !item.id || item.id <= 0);
    
    // Get IDs of items that should be deleted (existing items not in the new list)
    const newItemIds = itemsToUpdate.map((item: InvoiceItemRequest) => item.id);
    const itemsToDelete = existingItems.filter((item: typeof existingItems[0]) => !newItemIds.includes(item.id));

    // Delete items that are no longer needed
    if (itemsToDelete.length > 0) {
      await prisma.invoiceItem.deleteMany({
        where: {
          id: {
            in: itemsToDelete.map((item: typeof itemsToDelete[0]) => item.id),
          },
        },
      });
    }

    // Update existing items
    const updatedItems = [];
    for (const item of itemsToUpdate) {
      // Verify the orderServiceMappingId exists for this order
      const serviceMapping = order.orderServiceMappings.find(
        (mapping: typeof order.orderServiceMappings[0]) => mapping.id === item.orderServiceMappingId
      );
      
      if (!serviceMapping) {
        return NextResponse.json(
          { error: `Service mapping with ID ${item.orderServiceMappingId} not found for this order` },
          { status: 400 }
        );
      }

      const updated = await prisma.invoiceItem.update({
        where: { id: item.id },
        data: {
          orderServiceMappingId: item.orderServiceMappingId,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          notes: item.notes,
        },
        include: {
          orderServiceMapping: {
            include: {
              service: true,
            },
          },
        },
      });
      updatedItems.push(updated);
    }

    // Create new items
    const createdItems = [];
    for (const item of itemsToCreate) {
      // Verify the orderServiceMappingId exists for this order
      const serviceMapping = order.orderServiceMappings.find(
        (mapping: typeof order.orderServiceMappings[0]) => mapping.id === item.orderServiceMappingId
      );
      
      if (!serviceMapping) {
        return NextResponse.json(
          { error: `Service mapping with ID ${item.orderServiceMappingId} not found for this order` },
          { status: 400 }
        );
      }

      const created = await prisma.invoiceItem.create({
        data: {
          orderServiceMappingId: item.orderServiceMappingId,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          notes: item.notes,
        },
        include: {
          orderServiceMapping: {
            include: {
              service: true,
            },
          },
        },
      });
      createdItems.push(created);
    }

    // Get all invoice items for this order after updates
    const allInvoiceItems = await prisma.invoiceItem.findMany({
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
    const newTotalAmount = allInvoiceItems.reduce((sum: number, item: typeof allInvoiceItems[0]) => sum + calculateInvoiceItemTotal(item), 0);

    // Update order with new invoice total
    await prisma.order.update({
      where: { id: orderId },
      data: {
        invoiceTotal: newTotalAmount,
      },
    });

    return NextResponse.json({
      message: "Invoice items updated successfully",
      invoiceItems: allInvoiceItems.map((item: typeof allInvoiceItems[0]) => ({
        id: item.id,
        orderServiceMappingId: item.orderServiceMappingId,
        quantity: item.quantity,
        pricePerItem: item.pricePerItem,
        notes: item.notes,
        total: calculateInvoiceItemTotal(item),
        service: item.orderServiceMapping.service,
      })),
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

