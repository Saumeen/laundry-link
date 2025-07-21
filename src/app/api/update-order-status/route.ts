import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/emailService";
import { OrderTrackingService } from "@/lib/orderTracking";
import { OrderStatus } from "@prisma/client";
import { isValidOrderStatus } from "@/lib/orderStatus";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, notes } = body as { orderId: string; status: string; notes?: string };

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    // Validate status enum
    if (!isValidOrderStatus(status)) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 }
      );
    }

    // Use the new tracking service to update order status
    const result = await OrderTrackingService.updateOrderStatus({
      orderId: parseInt(orderId),
      newStatus: status as OrderStatus,
      notes
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Failed to update order status" },
        { status: 400 }
      );
    }

    const updatedOrder = result.order;

    console.log("Order status updated:", updatedOrder.orderNumber, "->", status);

    // Send status update email to customer
    if (updatedOrder.customerEmail) {
      await emailService.sendStatusUpdateToCustomer(
        updatedOrder,
        updatedOrder.customerEmail,
        `${updatedOrder.customerFirstName} ${updatedOrder.customerLastName}`
      );
    }

    // Special handling for "READY_FOR_DELIVERY" status (equivalent to old "Invoice Generated")
    const hasOrderItems = updatedOrder.orderServiceMappings.some((mapping: any) => 
      mapping.orderItems && mapping.orderItems.length > 0
    );
    
    if (status === "READY_FOR_DELIVERY" && hasOrderItems) {
      try {
        // Send invoice email to customer
        await emailService.sendOrderConfirmationToCustomer(
          updatedOrder,
          updatedOrder.customerEmail,
          `${updatedOrder.customerFirstName} ${updatedOrder.customerLastName}`,
          updatedOrder.orderServiceMappings
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
