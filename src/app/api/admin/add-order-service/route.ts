import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

interface AddOrderServiceRequest {
  orderId: number;
  serviceId: number;
  quantity: number;
  price: number;
}

export async function POST(req: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const body = await req.json() as AddOrderServiceRequest;
    const { orderId, serviceId, quantity, price } = body;

    if (!orderId || !serviceId || quantity <= 0 || price <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, serviceId, quantity, price' },
        { status: 400 }
      );
    }

    // Check if the order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderServiceMappings: {
          include: {
            service: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if the service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Check if this service is already added to the order
    const existingMapping = order.orderServiceMappings.find(
      mapping => mapping.serviceId === serviceId
    );

    if (existingMapping) {
      return NextResponse.json(
        { error: 'Service is already added to this order' },
        { status: 400 }
      );
    }

    // Create the new order service mapping
    const newMapping = await prisma.orderServiceMapping.create({
      data: {
        orderId,
        serviceId,
        quantity,
        price
      },
      include: {
        service: true,
        orderItems: true
      }
    });

    // Update the order's invoice total
    const totalAmount = order.orderServiceMappings.reduce((sum, mapping) => 
      sum + (mapping.quantity * mapping.price), 0
    ) + (quantity * price);

    await prisma.order.update({
      where: { id: orderId },
      data: { invoiceTotal: totalAmount }
    });

    return NextResponse.json({
      message: 'Service added to order successfully',
      orderServiceMapping: newMapping,
      newTotalAmount: totalAmount
    });

  } catch (error) {
    console.error('Error adding service to order:', error);
    return NextResponse.json(
      { error: 'Failed to add service to order' },
      { status: 500 }
    );
  }
} 