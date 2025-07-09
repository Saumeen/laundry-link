// src/app/api/admin/add-invoice-item/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { orderId, itemType, quantity, unitPrice, totalPrice, notes } = await req.json();

    if (!orderId || !itemType || !quantity || unitPrice === undefined) {
      return NextResponse.json(
        { error: "Order ID, item type, quantity, and unit price are required" },
        { status: 400 }
      );
    }

    // Create the invoice item
    const invoiceItem = await prisma.invoiceItem.create({
      data: {
        orderId: parseInt(orderId),
        itemType,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        totalPrice: parseFloat(totalPrice),
        notes: notes || null,
      },
    });

    // Recalculate order total amount
    const allInvoiceItems = await prisma.invoiceItem.findMany({
      where: {
        orderId: parseInt(orderId),
      },
    });

    const newTotalAmount = allInvoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Update order total amount
    await prisma.order.update({
      where: {
        id: parseInt(orderId),
      },
      data: {
        totalAmount: newTotalAmount,
      },
    });

    return NextResponse.json({
      message: "Invoice item added successfully",
      invoiceItem,
      newTotalAmount,
    });
  } catch (error) {
    console.error("Error adding invoice item:", error);
    return NextResponse.json(
      { error: "Failed to add invoice item" },
      { status: 500 }
    );
  }
}

