import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/emailService";
import { requireAuthenticatedCustomer, createAuthErrorResponse } from "@/lib/auth";

interface ServiceNames {
  [key: string]: string;
}

interface OrderRequestBody {
  isLoggedInCustomer: boolean;
  email: string;
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
    const body = await req.json() as OrderRequestBody;

    // Check if this is a logged-in customer order
    if (body.isLoggedInCustomer) {
      return await handleLoggedInCustomerOrder(body);
    } else {
      return NextResponse.json(
        { error: "Guest orders should use /api/orders endpoint" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

async function handleLoggedInCustomerOrder(body: OrderRequestBody) {
  try {
    // Find the customer by email
    const customer = await prisma.customer.findUnique({
      where: { email: body.email }
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get the selected address
    const address = await prisma.address.findFirst({
      where: {
        id: parseInt(body.addressId),
        customerId: customer.id
      }
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    // Generate order number
    const orderNumber = `LL${Date.now().toString().slice(-8)}`;

    // Combine pickup date and time
    const pickupDateTime = new Date(`${body.pickupDate}T${body.pickupTime}:00`);
    const deliveryDateTime = new Date(`${body.deliveryDate}T${body.deliveryTime}:00`);

    // Create order
    const order = await prisma.order.create({
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
    if (Array.isArray(body.services)) {
      for (const serviceId of body.services) {
        // Get service details to get the price
        const service = await prisma.service.findUnique({
          where: { id: parseInt(serviceId) }
        });

        if (service) {
          await prisma.orderServiceMapping.create({
            data: {
              orderId: order.id,
              serviceId: service.id,
              quantity: 1,
              price: service.price,
            }
          });
        }
      }
    }

    // Send emails (wrapped in try-catch to not fail order creation)
    try {
      // Send order confirmation email for logged-in customer
      await emailService.sendOrderConfirmationToCustomer(
        order,
        customer.email,
        `${customer.firstName} ${customer.lastName}`,
        {
          pickupDateTime,
          deliveryDateTime,
          services: body.services,
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
        services: body.services
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError || 'Unknown error');
      // Continue with order creation even if emails fail
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      message: "Order created successfully"
    });

  } catch (error) {
    console.error("Error creating logged-in customer order:", error || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
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

    // Build orderBy object
    let orderBy: any = { createdAt: 'desc' }; // default sorting
    if (sort === 'updatedAt') {
      orderBy = { updatedAt: order === 'asc' ? 'asc' : 'desc' };
    } else if (sort === 'createdAt') {
      orderBy = { createdAt: order === 'asc' ? 'asc' : 'desc' };
    }

    // Build take object for limiting results
    let take: number | undefined = undefined;
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        take = limitNum;
      }
    }

    const customer = await prisma.customer.findUnique({
      where: { id: authenticatedCustomer.id },
      include: {
        orders: {
          include: {
            address: true,
            orderServiceMappings: {
              include: {
                service: true,
                invoiceItems: {
                  include: {
                    orderServiceMapping: {
                      include: {
                        service: true,
                      },
                    },
                  },
                },
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

    // Transform orders to include invoice items with service information
    const transformedOrders = customer.orders.map((order: typeof customer.orders[0]) => {
      const transformedInvoiceItems = order.orderServiceMappings.flatMap((mapping: typeof order.orderServiceMappings[0]) => 
        mapping.invoiceItems.map((item: typeof mapping.invoiceItems[0]) => ({
          id: item.id,
          orderServiceMappingId: item.orderServiceMappingId,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          total: item.quantity * item.pricePerItem,
          service: mapping.service,
          notes: undefined,
        }))
      );

      return {
        ...order,
        invoiceItems: transformedInvoiceItems,
      };
    });

    return NextResponse.json({ 
      success: true,
      orders: transformedOrders 
    });
  } catch (error) {
    console.error("Error fetching orders:", error || 'Unknown error');
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

