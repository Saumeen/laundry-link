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
  customer: 'customer', // special case for customer name
  status: 'status',
  serviceType: 'isExpressService',
  paymentStatus: 'paymentStatus',
  total: 'invoiceTotal',
  createdAt: 'createdAt',
  deliveryTime: 'deliveryStartTime',
  pickupTime: 'pickupStartTime',
  customerFirstName: 'customerFirstName',
  customerLastName: 'customerLastName',
  customerEmail: 'customerEmail',
  customerPhone: 'customerPhone',
  customerAddress: 'customerAddress',
  specialInstructions: 'specialInstructions',
  notes: 'notes',
  paymentMethod: 'paymentMethod',
  minimumOrderApplied: 'minimumOrderApplied',
  invoiceGenerated: 'invoiceGenerated',
  updatedAt: 'updatedAt',
};

export async function GET(req: Request) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const { searchParams } = new URL(req.url);
    
    // Get sorting parameters
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;
    const serviceType = searchParams.get('serviceType') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const paymentStatus = searchParams.get('paymentStatus') || 'ALL';
    const search = searchParams.get('search') || '';
    const deliveryDateFrom = searchParams.get('deliveryDateFrom') || '';
    const deliveryDateTo = searchParams.get('deliveryDateTo') || '';
    const pickupDateFrom = searchParams.get('pickupDateFrom') || '';
    const pickupDateTo = searchParams.get('pickupDateTo') || '';

    // Build where clause based on filters
    let whereClause: any = {};

    // Role-based filtering
    if (admin.role === 'FACILITY_TEAM') {
      whereClause.status = OrderStatus.DROPPED_OFF;
    }

    // Status filter
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    // Payment status filter
    if (paymentStatus && paymentStatus !== 'ALL') {
      whereClause.paymentStatus = paymentStatus;
    }

    // Service type filter
    if (serviceType && serviceType !== 'ALL') {
      whereClause.isExpressService = serviceType === 'EXPRESS';
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Delivery date range filter
    if (deliveryDateFrom || deliveryDateTo) {
      whereClause.deliveryStartTime = {};
      if (deliveryDateFrom) {
        whereClause.deliveryStartTime.gte = new Date(deliveryDateFrom);
      }
      if (deliveryDateTo) {
        whereClause.deliveryStartTime.lte = new Date(deliveryDateTo + 'T23:59:59.999Z');
      }
    }

    // Pickup date range filter
    if (pickupDateFrom || pickupDateTo) {
      whereClause.pickupStartTime = {};
      if (pickupDateFrom) {
        whereClause.pickupStartTime.gte = new Date(pickupDateFrom);
      }
      if (pickupDateTo) {
        whereClause.pickupStartTime.lte = new Date(pickupDateTo + 'T23:59:59.999Z');
      }
    }

    // Build orderBy clause
    let orderBy: Record<string, unknown> = {};
    
    if (sortField === 'customer') {
      // Special case for customer name sorting - sort by firstName then lastName
      orderBy = {
        customer: {
          firstName: sortOrder,
        },
      };
    } else if (sortField === 'customerFirstName') {
      orderBy.customerFirstName = sortOrder;
    } else if (sortField === 'customerLastName') {
      orderBy.customerLastName = sortOrder;
    } else if (sortField === 'customerEmail') {
      orderBy.customerEmail = sortOrder;
    } else if (sortField === 'customerPhone') {
      orderBy.customerPhone = sortOrder;
    } else if (sortField === 'customerAddress') {
      orderBy.customerAddress = sortOrder;
    } else if (sortField === 'pickupTime') {
      orderBy.pickupStartTime = sortOrder;
    } else if (sortField === 'deliveryTime') {
      orderBy.deliveryStartTime = sortOrder;
    } else if (sortField in SORTABLE_FIELDS) {
      orderBy[SORTABLE_FIELDS[sortField]] = sortOrder;
    } else {
      // Default sorting
      orderBy.createdAt = 'desc';
    }

    // Get total count for pagination
    const total = await prisma.order.count({ where: whereClause });

    // Fetch paginated orders
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
      take: limit,
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
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
