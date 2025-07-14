// src/app/api/admin/order-details/[orderId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const { orderId } = await params;

    // Check if orderId is a numeric ID or order number
    const numericId = parseInt(orderId);
    const isNumericId = !isNaN(numericId);

    // Try to find order by ID first (if it's a numeric ID), then by order number
    let order = null;
    
    if (isNumericId) {
      order = await prisma.order.findUnique({
        where: {
          id: numericId,
        },
      include: {
        customer: true,
        orderServiceMappings: {
          include: {
            service: true,
            invoiceItems: {
              include: {
                orderServiceMapping: {
                  include: {
                    service: true,
                  },
                },
              },
            },
          },
        },
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

  }

    // If not found by ID, try by order number
    if (!order) {
      order = await prisma.order.findUnique({
        where: {
          orderNumber: orderId,
        },
        include: {
          customer: true,
          orderServiceMappings: {
            include: {
              service: true,
              invoiceItems: {
                include: {
                  orderServiceMapping: {
                    include: {
                      service: true,
                    },
                  },
                },
              },
            },
          },
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
    }

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

    // Transform invoice items to include service information
    const transformedInvoiceItems = order.orderServiceMappings.flatMap((mapping: any) => 
      mapping.invoiceItems.map((item: any) => ({
        id: item.id,
        orderServiceMappingId: item.orderServiceMappingId,
        quantity: item.quantity,
        pricePerItem: item.pricePerItem,
        total: item.quantity * item.pricePerItem,
        service: mapping.service,
        notes: undefined, // Add if you have notes field
      }))
    );

    return NextResponse.json({
      order: {
        ...order,
        addresses,
        invoiceItems: transformedInvoiceItems,
      }
    });
  }
 catch (error) {
    // Simple error logging without complex error handling
    console.error("Error fetching order details:", String(error || 'Unknown error'));
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}


