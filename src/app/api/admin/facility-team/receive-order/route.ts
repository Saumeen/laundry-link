import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin } from "@/lib/adminAuth";
import { OrderStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const body = await request.json();
    
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Check if order exists and is in the correct status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        driverAssignments: {
          where: {
            assignmentType: 'pickup',
            status: 'COMPLETED'
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order has been picked up
    if (order.driverAssignments.length === 0) {
      return NextResponse.json({ error: "Order has not been picked up yet" }, { status: 400 });
    }

    // Check if order is already in a later status
    if (order.status === OrderStatus.RECEIVED_AT_FACILITY || 
        order.status === OrderStatus.PROCESSING_STARTED ||
        order.status === OrderStatus.PROCESSING_COMPLETED ||
        order.status === OrderStatus.QUALITY_CHECK ||
        order.status === OrderStatus.READY_FOR_DELIVERY) {
      return NextResponse.json({ error: "Order is already in a later processing stage" }, { status: 400 });
    }

    // Update order status to RECEIVED_AT_FACILITY
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.RECEIVED_AT_FACILITY }
    });

    // Create order history entry
    await prisma.orderHistory.create({
      data: {
        orderId,
        staffId: admin.id,
        action: 'status_update',
        oldValue: order.status,
        newValue: OrderStatus.RECEIVED_AT_FACILITY,
        description: 'Order received at facility',
        metadata: JSON.stringify({
          receivedBy: `${admin.firstName} ${admin.lastName}`,
          receivedAt: new Date().toISOString()
        })
      }
    });

    return NextResponse.json({ 
      message: "Order marked as received at facility",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Error marking order as received:", error);
    return NextResponse.json(
      { error: "Failed to mark order as received" },
      { status: 500 }
    );
  }
} 