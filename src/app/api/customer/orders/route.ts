import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/emailService";
import { requireAuthenticatedCustomer, createAuthErrorResponse } from "@/lib/auth";

interface OrderRequestBody {
  addressId: string;
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
  services: string[];
  specialInstructions?: string;
  contactNumber?: string;
}

export async function POST(req: Request) {
  try {
    // Get authenticated customer using NextAuth
    const authenticatedCustomer = await requireAuthenticatedCustomer();
    
    const body = await req.json() as OrderRequestBody;

    // Validate required fields
    if (!body.addressId || !body.pickupDate || !body.pickupTime || 
        !body.deliveryDate || !body.deliveryTime || !body.services || body.services.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: addressId, pickupDate, pickupTime, deliveryDate, deliveryTime, and services are required" },
        { status: 400 }
      );
    }

    return await handleCustomerOrder(body, authenticatedCustomer);
  } catch (error) {
    console.error("Error creating order:", error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

async function handleCustomerOrder(body: OrderRequestBody, customer: any) {
  try {
    // Get the selected address and validate ownership
    const address = await prisma.address.findFirst({
      where: {
        id: parseInt(body.addressId),
        customerId: customer.id
      }
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found or access denied" },
        { status: 404 }
      );
    }

    // Generate unique order number
    const orderNumber = `LL${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Parse and validate datetime
    const pickupDateTime = new Date(`${body.pickupDate}T${body.pickupTime}:00`);
    const deliveryDateTime = new Date(`${body.deliveryDate}T${body.deliveryTime}:00`);

    // Validate that delivery is after pickup
    if (deliveryDateTime <= pickupDateTime) {
      return NextResponse.json(
        { error: "Delivery time must be after pickup time" },
        { status: 400 }
      );
    }

    // Validate that pickup is not in the past
    const now = new Date();
    if (pickupDateTime <= now) {
      return NextResponse.json(
        { error: "Pickup time cannot be in the past" },
        { status: 400 }
      );
    }

    // Create order with transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber,
          customerId: customer.id,
          addressId: address.id,
          pickupTime: pickupDateTime,
          deliveryTime: deliveryDateTime,
          specialInstructions: body.specialInstructions || "",
          status: "Order Placed",
          customerFirstName: customer.firstName,
          customerLastName: customer.lastName,
          customerEmail: customer.email,
          customerPhone: address.contactNumber || customer.phone || body.contactNumber || "",
          customerAddress: address.address || address.addressLine1,
          paymentStatus: "Pending",
        },
      });

      // Create order service mappings for each service
      const serviceMappings = [];
      for (const serviceId of body.services) {
        // Get service details to get the price
        const service = await tx.service.findUnique({
          where: { id: parseInt(serviceId) }
        });

        if (!service) {
          throw new Error(`Service with ID ${serviceId} not found`);
        }

        const mapping = await tx.orderServiceMapping.create({
          data: {
            orderId: order.id,
            serviceId: service.id,
            quantity: 1,
            price: service.price,
          }
        });
        
        serviceMappings.push(mapping);
      }

      return { order, serviceMappings };
    });

    // Send emails asynchronously (don't block order creation)
    sendOrderEmails(result.order, customer, address, body.services).catch(emailError => {
      console.error("Email sending failed:", emailError);
    });

    return NextResponse.json({
      success: true,
      orderNumber: result.order.orderNumber,
      message: "Order created successfully",
      orderId: result.order.id
    });

  } catch (error) {
    console.error("Error creating customer order:", error);
    
    if (error instanceof Error && error.message.includes('Service with ID')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

async function sendOrderEmails(order: any, customer: any, address: any, services: string[]) {
  try {
    const pickupDateTime = order.pickupTime;
    const deliveryDateTime = order.deliveryTime;

    // Send order confirmation email to customer
    await emailService.sendOrderConfirmationToCustomer(
      order,
      customer.email,
      `${customer.firstName} ${customer.lastName}`,
      {
        pickupDateTime,
        deliveryDateTime,
        services,
        address: address.address || address.addressLine1,
        locationType: address.locationType
      }
    );

    // Send admin notification
    await emailService.sendOrderNotificationToAdmin(order, {
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      phone: customer.phone,
      address: address.address || address.addressLine1,
      services
    });
  } catch (error) {
    console.error("Email sending failed:", error);
    // Don't throw - emails are not critical for order creation
  }
}

export async function GET(req: Request) {
  try {
    // Get authenticated customer using NextAuth
    const authenticatedCustomer = await requireAuthenticatedCustomer();

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit');
    const sort = searchParams.get('sort');
    const order = searchParams.get('order');
    const status = searchParams.get('status');

    // Build orderBy object
    let orderBy: any = { createdAt: 'desc' }; // default sorting
    if (sort === 'updatedAt') {
      orderBy = { updatedAt: order === 'asc' ? 'asc' : 'desc' };
    } else if (sort === 'createdAt') {
      orderBy = { createdAt: order === 'asc' ? 'asc' : 'desc' };
    } else if (sort === 'pickupTime') {
      orderBy = { pickupTime: order === 'asc' ? 'asc' : 'desc' };
    }

    // Build take object for limiting results
    let take: number | undefined = undefined;
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) { // Add reasonable upper limit
        take = limitNum;
      }
    }

    // Build where clause
    const whereClause: any = {
      customerId: authenticatedCustomer.id
    };

    if (status) {
      whereClause.status = status;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: authenticatedCustomer.id },
      include: {
        orders: {
          where: whereClause,
          include: {
            address: true,
            orderServiceMappings: {
              include: {
                service: true,
                orderItems: true,
              },
            },
          },
          orderBy,
          ...(take && { take })
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Transform orders to include order items with service information
    const transformedOrders = customer.orders.map((order: typeof customer.orders[0]) => {
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        invoiceTotal: order.invoiceTotal || 0,
        pickupTime: order.pickupTime.toISOString(),
        deliveryTime: order.deliveryTime?.toISOString(),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        customerFirstName: order.customerFirstName,
        customerLastName: order.customerLastName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        specialInstructions: order.specialInstructions,
        paymentStatus: order.paymentStatus,
        orderServiceMappings: order.orderServiceMappings.map(mapping => ({
          id: mapping.id,
          service: mapping.service,
          quantity: mapping.quantity,
          price: mapping.price,
          orderItems: mapping.orderItems
        })),
        address: order.address
      };
    });

    return NextResponse.json({ 
      success: true,
      orders: transformedOrders,
      total: transformedOrders.length
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

