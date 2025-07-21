import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin } from "@/lib/adminAuth";
import { 
  OrderStatus, 
  PaymentStatus, 
  ProcessingStatus,
  DriverAssignmentStatus,
  ItemStatus,
  IssueStatus 
} from "@prisma/client";

interface UpdateOrderRequest {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  processingStatus?: ProcessingStatus;
  driverStatus?: DriverAssignmentStatus;
  itemStatus?: ItemStatus;
  issueStatus?: IssueStatus;
  notes?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const { orderId } = await params;
    const body: UpdateOrderRequest = await request.json();
    const { 
      status, 
      paymentStatus, 
      processingStatus, 
      driverStatus, 
      itemStatus, 
      issueStatus,
      notes 
    } = body;

    // Validate enum values
    const validStatuses = Object.values(OrderStatus);
    const validPaymentStatuses = Object.values(PaymentStatus);
    const validProcessingStatuses = Object.values(ProcessingStatus);
    const validDriverStatuses = Object.values(DriverAssignmentStatus);
    const validItemStatuses = Object.values(ItemStatus);
    const validIssueStatuses = Object.values(IssueStatus);

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }

    if (processingStatus && !validProcessingStatuses.includes(processingStatus)) {
      return NextResponse.json({ error: "Invalid processing status" }, { status: 400 });
    }

    if (driverStatus && !validDriverStatuses.includes(driverStatus)) {
      return NextResponse.json({ error: "Invalid driver status" }, { status: 400 });
    }

    if (itemStatus && !validItemStatuses.includes(itemStatus)) {
      return NextResponse.json({ error: "Invalid item status" }, { status: 400 });
    }

    if (issueStatus && !validIssueStatuses.includes(issueStatus)) {
      return NextResponse.json({ error: "Invalid issue status" }, { status: 400 });
    }

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        orderProcessing: true,
        driverAssignments: true
      }
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status if provided
    if (status) {
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { status: status as OrderStatus }
      });

      // Create order update record
      await prisma.orderUpdate.create({
        data: {
          orderId: parseInt(orderId),
          staffId: admin.id,
          oldStatus: currentOrder.status,
          newStatus: status as OrderStatus,
          notes
        }
      });
    }

    // Update payment status if provided
    if (paymentStatus) {
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { paymentStatus: paymentStatus as PaymentStatus }
      });
    }

    // Update processing status if provided
    if (processingStatus && currentOrder.orderProcessing) {
      await prisma.orderProcessing.update({
        where: { orderId: parseInt(orderId) },
        data: { 
          processingStatus: processingStatus as ProcessingStatus,
          processingNotes: notes
        }
      });
    }

    // Update driver assignment status if provided
    if (driverStatus && currentOrder.driverAssignments.length > 0) {
      await prisma.driverAssignment.updateMany({
        where: { orderId: parseInt(orderId) },
        data: { status: driverStatus as DriverAssignmentStatus }
      });
    }

    // Update processing items if item status provided
    if (itemStatus && currentOrder.orderProcessing) {
      await prisma.processingItem.updateMany({
        where: { 
          orderServiceMapping: {
            orderId: parseInt(orderId)
          }
        },
        data: { status: itemStatus as ItemStatus }
      });
    }

    // Update issue reports if issue status provided
    if (issueStatus && currentOrder.orderProcessing) {
      await prisma.issueReport.updateMany({
        where: { orderProcessingId: currentOrder.orderProcessing.id },
        data: { status: issueStatus as IssueStatus }
      });
    }

    return NextResponse.json({ 
      message: "Order updated successfully",
      orderId: parseInt(orderId)
    });

  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
} 