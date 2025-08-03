// src/app/api/admin/orders-detailed/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';
import { formatTimeSlotRange } from '@/lib/utils/timezone';
import { OrderStatus } from '@prisma/client';

const SORTABLE_FIELDS: Record<string, string> = {
  orderNumber: 'orderNumber',
  customerName: 'customer', // special case
  status: 'status',
  totalAmount: 'invoiceTotal',
  createdAt: 'createdAt',
  deliveryStartTime: 'deliveryStartTime',
};

export async function GET(req: Request) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const { searchParams } = new URL(req.url);
    const sortField = searchParams.get('sortField') || 'deliveryStartTime';
    const sortDirection =
      searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const skip = (page - 1) * pageSize;
    const serviceType = searchParams.get('serviceType') || 'ALL';

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
        sortField in SORTABLE_FIELDS ? SORTABLE_FIELDS[sortField] : 'deliveryStartTime'
      ] = sortDirection;
    }

    // Build where clause based on admin role and filters
    let whereClause: Record<string, unknown> = {};

    // For FACILITY_TEAM role, only show orders with DROPPED_OFF status
    if (admin.role === 'FACILITY_TEAM') {
      whereClause.status = OrderStatus.DROPPED_OFF;
    }
    // For SUPER_ADMIN and OPERATION_MANAGER, show all orders (no filter needed)

    // Add service type filter
    if (serviceType !== 'ALL') {
      whereClause.isExpressService = serviceType === 'EXPRESS';
    }

    // Get total count for pagination with role-based filtering
    const total = await prisma.order.count({ where: whereClause });

    // Fetch paginated orders with role-based filtering
    const orders = await prisma.order.findMany({
      where: whereClause,
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

    // Sort orders by delivery start time and completion status
    const sortedOrders = orders.sort((a, b) => {
      // First, prioritize non-completed orders
      const aIsCompleted = ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(a.status);
      const bIsCompleted = ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(b.status);
      
      if (aIsCompleted && !bIsCompleted) return 1;
      if (!aIsCompleted && bIsCompleted) return -1;
      
      // Then sort by delivery start time (earliest first)
      return new Date(a.deliveryStartTime).getTime() - new Date(b.deliveryStartTime).getTime();
    });

    // Transform orders to include service information
    const transformedOrders = sortedOrders.map(order => {
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
        // Map time fields to match frontend expectations with Bahrain timezone
        pickupTime: order.pickupStartTime,
        deliveryTime: order.deliveryStartTime,
        pickupTimeSlot: formatTimeSlotRange(
          order.pickupStartTime,
          order.pickupEndTime
        ),
        deliveryTimeSlot: formatTimeSlotRange(
          order.deliveryStartTime,
          order.deliveryEndTime
        ),
      };
    });

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
    logger.error('Error fetching detailed orders:', error);
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
