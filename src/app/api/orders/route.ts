import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import emailService from '@/lib/emailService';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { requireAuthenticatedCustomer } from '@/lib/auth';
import { OrderStatus, PaymentStatus } from '@prisma/client';

interface AddressData {
  customerId: number;
  label: string;
  addressLine1: string;
  city: string;
  isDefault: boolean;
  locationType: string;
  contactNumber: string | null;
  area?: string;
  building?: string;
  floor?: string;
  apartment?: string | null;
}

export async function POST(req: Request) {
  let customer = null;
  let isAuthenticated = false;
  let body;

  try {
    body = (await req.json()) as any;

    try {
      customer = await requireAuthenticatedCustomer();
      isAuthenticated = true;
    } catch (authError) {
      isAuthenticated = false;
    }

    if (isAuthenticated && customer) {
      // Authenticated customer order
      return await handleLoggedInCustomerOrder(body, customer);
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in order creation:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

async function handleLoggedInCustomerOrder(
  body: {
    services: (string | number)[];
    pickupDate: string;
    deliveryDate: string;
    pickupStartTime: string;
    pickupEndTime: string;
    deliveryStartTime: string;
    deliveryEndTime: string;
    addressId: string;
    specialInstructions?: string;
    contactNumber?: string;
    isExpressService?: boolean;
  },
  customer: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    wallet?: {
      balance: number;
      currency: string;
    };
  }
) {
  try {
    // Get the selected address
    const address = await prisma.address.findFirst({
      where: {
        id: parseInt(body.addressId),
        customerId: customer.id,
      },
    });

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Generate order number
    const orderNumber = `LL${Date.now().toString().slice(-8)}`;

    // Parse the UTC time ranges from the frontend
    let pickupStartTime: Date | null = null;
    let pickupEndTime: Date | null = null;
    let deliveryStartTime: Date | null = null;
    let deliveryEndTime: Date | null = null;

    // Parse time ranges from request body
    if (body.pickupStartTime) {
      pickupStartTime = new Date(body.pickupStartTime);
    }
    if (body.pickupEndTime) {
      pickupEndTime = new Date(body.pickupEndTime);
    }
    if (body.deliveryStartTime) {
      deliveryStartTime = new Date(body.deliveryStartTime);
    }
    if (body.deliveryEndTime) {
      deliveryEndTime = new Date(body.deliveryEndTime);
    }

    // Validate required time ranges
    const hasAllTimes =
      pickupStartTime && pickupEndTime && deliveryStartTime && deliveryEndTime;

    if (!hasAllTimes) {
      const serviceType = body.isExpressService
        ? 'Express service'
        : 'Regular service';
      return NextResponse.json(
        { error: `${serviceType} timing data is missing` },
        { status: 400 }
      );
    }

    // Create order using transaction
    const order = await prisma.$transaction(async tx => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: orderNumber,
          customerId: customer.id,
          addressId: address.id,
          pickupStartTime: pickupStartTime as Date,
          pickupEndTime: pickupEndTime as Date,
          deliveryStartTime: deliveryStartTime as Date,
          deliveryEndTime: deliveryEndTime as Date,
          specialInstructions: body.specialInstructions || '',
          status: OrderStatus.ORDER_PLACED,
          customerFirstName: customer.firstName,
          customerLastName: customer.lastName,
          customerEmail: customer.email,
          customerPhone: address.contactNumber || body.contactNumber || '',
          customerAddress: address.address || address.addressLine1,
          paymentStatus: PaymentStatus.PENDING,
          isExpressService: body.isExpressService || false,
        },
      });

      // Create order service mappings for each service
      if (Array.isArray(body.services)) {
        for (const serviceId of body.services) {
          const service = await tx.service.findUnique({
            where: { id: parseInt(serviceId.toString()) },
          });

          if (service) {
            await tx.orderServiceMapping.create({
              data: {
                orderId: newOrder.id,
                serviceId: service.id,
                quantity: 1,
                price: service.price,
              },
            });
          } else {
            console.error(`Service not found for ID: ${serviceId}`);
          }
        }
      }

      return newOrder;
    });

    // Fetch order with relations for email service
    const orderWithRelations = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true,
          },
        },
      },
    });

    // Send emails (wrapped in try-catch to not fail order creation)
    try {
      // Send order creation email to customer
      await emailService.sendOrderCreationToCustomer(
        orderWithRelations!,
        customer.email,
        `${customer.firstName} ${customer.lastName}`,
        {
          pickupDateTime: pickupStartTime as Date,
          deliveryDateTime: deliveryStartTime as Date,
          services: body.services.map(id => parseInt(id.toString())),
          address: address.address || address.addressLine1,
        }
      );

      // Send admin notification
      await emailService.sendOrderNotificationToAdmin(orderWithRelations!, {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: address.contactNumber || body.contactNumber || '',
        address: address.address || address.addressLine1,
        services: body.services.map(id => id.toString()),
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue with order creation even if emails fail
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('Error creating logged-in customer order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('orderNumber');

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: true,
        address: true,
        orderServiceMappings: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
