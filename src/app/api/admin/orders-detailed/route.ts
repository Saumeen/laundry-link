// src/app/api/admin/orders-detailed/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';

const SORTABLE_FIELDS: Record<string, string> = {
  orderNumber: 'orderNumber',
  customerName: 'customer', // special case
  status: 'status',
  totalAmount: 'invoiceTotal',
  createdAt: 'createdAt',
};

export async function GET(req: Request) {
  try {
    const admin = await requireAuthenticatedAdmin();
    console.log('Authenticated admin:', admin.email);
    const { searchParams } = new URL(req.url);
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection =
      searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const skip = (page - 1) * pageSize;

    // Special case for customerName sorting
    let orderBy: Record<string, unknown> = {};
    if (sortField === 'customerName') {
      orderBy = {
        customer: {
          firstName: sortDirection,
        },
      };
    } else {
      orderBy[
        sortField in SORTABLE_FIELDS ? SORTABLE_FIELDS[sortField] : 'createdAt'
      ] = sortDirection;
    }

    // Get total count for pagination
    const total = await prisma.order.count();
    console.log('Total orders in database:', total);

    // Fetch paginated orders
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true,
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

    // Transform orders to include service information
    const transformedOrders = orders.map(order => {
      // Flatten all orderItems from all services into a single array
      const orderItems =
        order.orderServiceMappings?.flatMap(
          mapping =>
            mapping.orderItems?.map(item => ({
              id: item.id,
              itemType: item.itemType,
              quantity: item.quantity,
              pricePerItem: item.pricePerItem,
              totalPrice: item.totalPrice,
              notes: item.notes,
            })) || []
        ) || [];

      const services =
        order.orderServiceMappings?.map(mapping => ({
          id: mapping.id,
          service: mapping.service,
          quantity: mapping.quantity,
          price: mapping.price,
          total: mapping.quantity * mapping.price,
          orderItems: mapping.orderItems,
        })) || [];

      return {
        ...order,
        orderItems, // Add this for frontend compatibility
        services,
      };
    });

    console.log('Transformed orders count:', transformedOrders.length);
    console.log('Sample order:', transformedOrders[0]);
    
    return NextResponse.json({
      data: transformedOrders,
      pagination: {
        page,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching detailed orders:', error);
    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
