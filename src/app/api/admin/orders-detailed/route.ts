// src/app/api/admin/orders-detailed/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

const SORTABLE_FIELDS: Record<string, string> = {
  orderNumber: 'orderNumber',
  customerName: 'customer', // special case
  status: 'status',
  totalAmount: 'invoiceTotal',
  createdAt: 'createdAt',
};

export async function GET(req: Request) {
  try {
    await requireAuthenticatedAdmin();
    const { searchParams } = new URL(req.url);
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const skip = (page - 1) * pageSize;

    // Special case for customerName sorting
    let orderBy: any = {};
    if (sortField === 'customerName') {
      orderBy = {
        customer: {
          firstName: sortDirection,
        },
      };
    } else {
      orderBy[sortField in SORTABLE_FIELDS ? SORTABLE_FIELDS[sortField] : 'createdAt'] = sortDirection;
    }

    // Get total count for pagination
    const total = await prisma.order.count();

    // Fetch paginated orders
    const orders = await prisma.order.findMany({
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
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: pageSize,
    });

    // Transform orders to include invoice items with service information
    const transformedOrders = orders.map((order: typeof orders[0]) => {
      const transformedInvoiceItems = order.orderServiceMappings.flatMap((mapping: typeof order.orderServiceMappings[0]) => 
        mapping.invoiceItems.map((item: typeof mapping.invoiceItems[0]) => ({
          id: item.id,
          orderServiceMappingId: item.orderServiceMappingId,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          total: item.quantity * item.pricePerItem,
          service: mapping.service,
          notes: undefined,
        }))
      );

      return {
        ...order,
        invoiceItems: transformedInvoiceItems,
      };
    });

    return NextResponse.json({
      orders: transformedOrders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching detailed orders:', error || 'Unknown error');
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

