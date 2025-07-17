import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateOrderItemTotal } from "@/lib/calculations";

interface OrderItemRequest {
  serviceId: string | number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
  notes?: string;
}

interface SaveInvoiceRequest {
  orderId: string | number;
  orderItems: OrderItemRequest[];
  invoiceTotal?: number;
  minimumOrderApplied?: boolean;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as SaveInvoiceRequest;
    const { orderId, orderItems, invoiceTotal, minimumOrderApplied } = body;

    if (!orderId || !orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { error: "Order ID and order items are required" },
        { status: 400 }
      );
    }

    // Get the order with its service mappings
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId.toString()) },
      include: {
        orderServiceMappings: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Delete existing order items for this order
    await prisma.orderItem.deleteMany({
      where: {
        orderServiceMapping: {
          orderId: parseInt(orderId.toString()),
        },
      },
    });

    // Create new order items
    const createdItems = await Promise.all(
      orderItems.map((item: OrderItemRequest) => {
        // Find the corresponding service mapping
        const serviceMapping = order.orderServiceMappings.find(
          (mapping: typeof order.orderServiceMappings[0]) => mapping.serviceId === parseInt(item.serviceId.toString())
        );

        if (!serviceMapping) {
          throw new Error(`Service mapping not found for service ID ${item.serviceId}`);
        }

        return prisma.orderItem.create({
          data: {
            orderServiceMappingId: serviceMapping.id,
            itemName: item.itemName,
            itemType: item.itemType,
            quantity: item.quantity,
            pricePerItem: item.pricePerItem,
            totalPrice: item.totalPrice,
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
      })
    );

    // Calculate invoice total
    const invoiceTotalCalculated = createdItems.reduce((sum: number, item: typeof createdItems[0]) => sum + calculateOrderItemTotal(item), 0);

    // Update order with invoice total
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId.toString()) },
      data: {
        invoiceTotal: invoiceTotalCalculated,
        minimumOrderApplied: minimumOrderApplied,
      },
    });

    return NextResponse.json({
      message: "Invoice saved successfully",
      order: updatedOrder,
      orderItems: createdItems,
    });
  } catch (error) {
    console.error("Error saving invoice:", error);
    return NextResponse.json(
      { error: "Failed to save invoice" },
      { status: 500 }
    );
  }
}
