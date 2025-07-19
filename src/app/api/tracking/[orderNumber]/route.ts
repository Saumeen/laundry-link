import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params;

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Order number is required" },
        { status: 400 }
      );
    }

    // Find order by order number
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.toUpperCase(),
      },
      include: {
        address: true,
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true,
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Transform the data to match the expected interface
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      invoiceTotal: order.invoiceTotal,
      pickupTime: order.pickupTime,
      deliveryTime: order.deliveryTime,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      customerFirstName: order.customer.firstName,
      customerLastName: order.customer.lastName,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone || "",
      customerAddress: order.customerAddress,
      specialInstructions: order.specialInstructions,
      paymentStatus: order.paymentStatus,
      orderServiceMappings: order.orderServiceMappings.map((mapping) => ({
        id: mapping.id,
        service: {
          id: mapping.service.id,
          name: mapping.service.name,
          displayName: mapping.service.displayName,
          description: mapping.service.description,
          price: mapping.service.price,
        },
        quantity: mapping.quantity,
        price: mapping.price,
        orderItems: mapping.orderItems.map((item) => ({
          id: item.id,
          itemName: item.itemName,
          itemType: item.itemType,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          totalPrice: item.totalPrice,
          notes: item.notes,
        })),
      })),
      address: order.address ? {
        id: order.address.id,
        label: order.address.label,
        addressLine1: order.address.addressLine1,
        addressLine2: order.address.addressLine2,
        city: order.address.city,
        area: order.address.area,
        building: order.address.building,
        floor: order.address.floor,
        apartment: order.address.apartment,
        contactNumber: order.address.contactNumber,
      } : undefined,
    };

    return NextResponse.json({ order: transformedOrder });
  } catch (error) {
    console.error("Error fetching order for tracking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 