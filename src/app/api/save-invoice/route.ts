import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, invoiceItems, invoiceTotal, minimumOrderApplied } = body;

    if (!orderId || !invoiceItems || invoiceItems.length === 0) {
      return NextResponse.json(
        { error: "Order ID and invoice items are required" },
        { status: 400 }
      );
    }

    // Delete existing invoice items for this order
    await prisma.invoiceItem.deleteMany({
      where: { orderId: parseInt(orderId) }
    });

    // Create new invoice items
    const createdItems = await Promise.all(
      invoiceItems.map((item: any) =>
        prisma.invoiceItem.create({
          data: {
            orderId: parseInt(orderId),
            itemType: item.itemType,
            serviceType: item.serviceType,
            quantity: item.quantity,
            pricePerItem: item.pricePerItem,
            totalPrice: item.totalPrice,
          },
        })
      )
    );

    // Update order with invoice total
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        invoiceTotal: invoiceTotal,
        minimumOrderApplied: minimumOrderApplied,
        totalAmount: invoiceTotal, // Update the main total amount
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
