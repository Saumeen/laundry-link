import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateInvoiceItemTotal } from "@/lib/calculations";

interface InvoiceItemRequest {
  serviceId: string | number;
  quantity: number;
  pricePerItem: number;
}

interface SaveInvoiceRequest {
  orderId: string | number;
  invoiceItems: InvoiceItemRequest[];
  invoiceTotal?: number;
  minimumOrderApplied?: boolean;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as SaveInvoiceRequest;
    const { orderId, invoiceItems, invoiceTotal, minimumOrderApplied } = body;

    if (!orderId || !invoiceItems || invoiceItems.length === 0) {
      return NextResponse.json(
        { error: "Order ID and invoice items are required" },
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

    // Delete existing invoice items for this order
    await prisma.invoiceItem.deleteMany({
      where: {
        orderServiceMapping: {
          orderId: parseInt(orderId.toString()),
        },
      },
    });

    // Create new invoice items
    const createdItems = await Promise.all(
      invoiceItems.map((item: InvoiceItemRequest) => {
        // Find the corresponding service mapping
        const serviceMapping = order.orderServiceMappings.find(
          (mapping: typeof order.orderServiceMappings[0]) => mapping.serviceId === parseInt(item.serviceId.toString())
        );

        if (!serviceMapping) {
          throw new Error(`Service mapping not found for service ID ${item.serviceId}`);
        }

        return prisma.invoiceItem.create({
          data: {
            orderServiceMappingId: serviceMapping.id,
            quantity: item.quantity,
            pricePerItem: item.pricePerItem,
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
    const invoiceTotalCalculated = createdItems.reduce((sum: number, item: typeof createdItems[0]) => sum + calculateInvoiceItemTotal(item), 0);

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
      invoiceItems: createdItems,
    });
  } catch (error) {
    console.error("Error saving invoice:", error);
    return NextResponse.json(
      { error: "Failed to save invoice" },
      { status: 500 }
    );
  }
}
