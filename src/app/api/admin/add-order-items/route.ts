import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';

interface OrderItemRequest {
  orderServiceMappingId: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  notes?: string;
}

interface AddOrderItemsRequest {
  orderId: number;
  orderItems: OrderItemRequest[];
}

export async function POST(req: Request) {
  try {
    await requireAuthenticatedAdmin();

    const body = (await req.json()) as AddOrderItemsRequest;
    const { orderId, orderItems } = body;

    if (!orderId || !orderItems || !Array.isArray(orderItems)) {
      return NextResponse.json(
        { error: 'Order ID and order items array are required' },
        { status: 400 }
      );
    }

    // Verify that the order exists and get its service mappings
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Delete existing order items for this order
    await prisma.orderItem.deleteMany({
      where: {
        orderServiceMapping: {
          orderId: orderId,
        },
      },
    });

    // Create new order items
    const createdItems = await Promise.all(
      orderItems.map(async (item: OrderItemRequest) => {
        const totalPrice = item.quantity * item.pricePerItem;

        return await prisma.orderItem.create({
          data: {
            orderServiceMappingId: item.orderServiceMappingId,
            itemName: item.itemName,
            itemType: item.itemType,
            quantity: item.quantity,
            pricePerItem: item.pricePerItem,
            totalPrice: totalPrice,
            notes: item.notes,
          },
          include: {
            orderServiceMapping: {
              include: {
                service: true,
              },
            },
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Order items added successfully',
      orderItems: createdItems,
    });
  } catch (error) {
    logger.error('Error adding order items:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to add order items' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    await requireAuthenticatedAdmin();

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderServiceMapping: {
          orderId: parseInt(orderId),
        },
      },
      include: {
        orderServiceMapping: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      orderItems,
    });
  } catch (error) {
    logger.error('Error fetching order items:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to fetch order items' },
      { status: 500 }
    );
  }
}
