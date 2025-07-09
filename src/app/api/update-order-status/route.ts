import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/emailService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: {
        id: parseInt(orderId),
      },
      data: {
        status: status,
      },
      include: {
        invoiceItems: true,
      },
    });

    console.log("Order status updated:", updatedOrder.orderNumber, "->", status);

    // Send status update email to customer
    if (updatedOrder.customerEmail) {
      await emailService.sendStatusUpdateToCustomer(
        updatedOrder,
        updatedOrder.customerEmail,
        `${updatedOrder.customerFirstName} ${updatedOrder.customerLastName}`
      );
    }

    // Special handling for "Invoice Generated" status
    if (status === "Invoice Generated" && updatedOrder.invoiceItems && updatedOrder.invoiceItems.length > 0) {
      try {
        // Send invoice email to customer
        await emailService.sendInvoiceToCustomer(
          updatedOrder,
          updatedOrder.customerEmail,
          `${updatedOrder.customerFirstName} ${updatedOrder.customerLastName}`
        );
        console.log("Invoice email sent to customer:", updatedOrder.customerEmail);
      } catch (emailError) {
        console.error("Failed to send invoice email:", emailError);
        // Don't fail the status update if email fails
      }
    }

    return NextResponse.json({
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
