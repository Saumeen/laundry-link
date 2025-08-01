import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedCustomer } from '@/lib/auth';
import { OrderStatus, PaymentStatus } from '@prisma/client';

interface CreateOrderRequest {
  addressId?: number;
  pickupTime: string;
  deliveryTime: string;
  specialInstructions?: string;
  services: Array<{
    serviceId: number;
    quantity: number;
  }>;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  isExpressService?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const customer = await requireAuthenticatedCustomer();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as OrderStatus;
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 10;
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!)
      : 1;
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const where: Record<string, unknown> = {
      customerId: customer.id,
    };

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Get total count for pagination
    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true,
          },
        },
        address: true,
        orderUpdates: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        driverAssignments: {
          include: {
            driver: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        orderProcessing: {
          include: {
            processingItems: true,
            issueReports: true,
          },
        },
      },
      orderBy: {
        [sort]: order,
      },
      skip: (page - 1) * limit,
      take: limit,
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

    return NextResponse.json({ orders: sortedOrders, total });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const customer = await requireAuthenticatedCustomer();
    const body: CreateOrderRequest = await request.json();
    const {
      addressId,
      pickupTime,
      deliveryTime,
      specialInstructions,
      services,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone,
      customerAddress,
      isExpressService,
    } = body;

    // Validate required fields
    if (!services || !Array.isArray(services)) {
      return NextResponse.json(
        { error: 'Services are required' },
        { status: 400 }
      );
    }

    // For express service, skip time validation
    if (!isExpressService && (!pickupTime || !deliveryTime)) {
      return NextResponse.json(
        { error: 'Pickup and delivery times are required for regular service' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `LL${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Handle timing for express vs regular service
    let finalPickupTime: Date;
    let finalDeliveryTime: Date;

    if (isExpressService) {
      // For express service, use the times calculated and passed from frontend
      finalPickupTime = new Date(pickupTime);
      finalDeliveryTime = new Date(deliveryTime);
    } else {
      // Regular service - use provided times
      finalPickupTime = new Date(pickupTime);
      finalDeliveryTime = new Date(deliveryTime);
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        addressId,
        status: OrderStatus.ORDER_PLACED,
        pickupStartTime: finalPickupTime,
        pickupEndTime: finalPickupTime,
        deliveryStartTime: finalDeliveryTime,
        deliveryEndTime: finalDeliveryTime,
        specialInstructions,
        customerFirstName,
        customerLastName,
        customerEmail,
        customerPhone,
        customerAddress,
        paymentStatus: PaymentStatus.PENDING,
        isExpressService: isExpressService || false,
      },
    });

    // Create service mappings
    let totalAmount = 0;
    for (const service of services) {
      const serviceRecord = await prisma.service.findUnique({
        where: { id: service.serviceId },
      });

      if (!serviceRecord) {
        return NextResponse.json(
          { error: `Service ${service.serviceId} not found` },
          { status: 404 }
        );
      }

      const serviceTotal = serviceRecord.price * service.quantity;
      totalAmount += serviceTotal;

      await prisma.orderServiceMapping.create({
        data: {
          orderId: order.id,
          serviceId: service.serviceId,
          quantity: service.quantity,
          price: serviceRecord.price,
        },
      });
    }

    // Update order with total amount
    await prisma.order.update({
      where: { id: order.id },
      data: { invoiceTotal: totalAmount },
    });

    return NextResponse.json({
      message: 'Order created successfully',
      order: {
        ...order,
        invoiceTotal: totalAmount,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
