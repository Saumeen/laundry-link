import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedCustomer, createAuthErrorResponse } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    // Get authenticated customer using NextAuth
    const authenticatedCustomer = await requireAuthenticatedCustomer();

    // Fetch order with order items and address, ensuring it belongs to the customer
    const order = await prisma.order.findFirst({
      where: { 
        id: parseInt(orderId),
        customerId: authenticatedCustomer.id
      },
      include: {
        orderServiceMappings: {
          include: {
            orderItems: true,
            service: true,
          },
        },
        address: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order details:", error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
} 