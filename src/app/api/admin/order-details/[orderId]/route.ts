// src/app/api/admin/order-details/[orderId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const { orderId } = params;

    const order = await prisma.order.findUnique({
      where: {
        id: parseInt(orderId),
      },
      include: {
        customer: true,
        invoiceItems: true,
        driverAssignments: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
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

    // Fetch customer addresses if customer exists
    let addresses: any[] = [];
    if (order.customer) {
      addresses = await prisma.address.findMany({
        where: {
          customerId: order.customer.id,
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });
    }

    return NextResponse.json({
      ...order,
      addresses,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

