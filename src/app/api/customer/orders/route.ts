import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedCustomer } from "@/lib/auth";
import { OrderStatus, PaymentStatus } from "@prisma/client";

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
}

export async function GET(request: NextRequest) {
  try {
    const customer = await requireAuthenticatedCustomer();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as OrderStatus;
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const where: any = {
      customerId: customer.id
    };

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true
          }
        },
        address: true,
        orderUpdates: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        driverAssignments: {
          include: {
            driver: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        orderProcessing: {
          include: {
            processingItems: true,
            issueReports: true
          }
        }
      },
      orderBy: {
        [sort]: order
      },
      ...(limit && { take: limit })
    });

    return NextResponse.json({ orders });

  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
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
      customerAddress
    } = body;

    // Validate required fields
    if (!pickupTime || !deliveryTime || !services || !Array.isArray(services)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate order number
    const orderNumber = `LL${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        addressId,
        status: OrderStatus.ORDER_PLACED,
        pickupTime: new Date(pickupTime),
        deliveryTime: new Date(deliveryTime),
        specialInstructions,
        customerFirstName,
        customerLastName,
        customerEmail,
        customerPhone,
        customerAddress,
        paymentStatus: PaymentStatus.PENDING
      }
    });

    // Create service mappings
    let totalAmount = 0;
    for (const service of services) {
      const serviceRecord = await prisma.service.findUnique({
        where: { id: service.serviceId }
      });

      if (!serviceRecord) {
        return NextResponse.json({ error: `Service ${service.serviceId} not found` }, { status: 404 });
      }

      const serviceTotal = serviceRecord.price * service.quantity;
      totalAmount += serviceTotal;

      await prisma.orderServiceMapping.create({
        data: {
          orderId: order.id,
          serviceId: service.serviceId,
          quantity: service.quantity,
          price: serviceRecord.price
        }
      });
    }

    // Update order with total amount
    await prisma.order.update({
      where: { id: order.id },
      data: { invoiceTotal: totalAmount }
    });

    return NextResponse.json({ 
      message: "Order created successfully",
      order: {
        ...order,
        invoiceTotal: totalAmount
      }
    });

  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

