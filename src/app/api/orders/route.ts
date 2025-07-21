import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/emailService";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { requireAuthenticatedCustomer, createAuthErrorResponse } from "@/lib/auth";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { OrderTrackingService } from "@/lib/orderTracking";

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
    body = await req.json();
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
      // Guest order
      return await handleGuestCustomerOrder(body);
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

async function handleLoggedInCustomerOrder(body: any, customer: { id: number; email: string; firstName: string; lastName: string; isActive: boolean; walletBalance: number; }) {
  try {
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
        status: OrderStatus.ORDER_PLACED,
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerEmail: customer.email,
        customerPhone: address.contactNumber || body.contactNumber || "",
        customerAddress: address.address || address.addressLine1,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    // Create order service mappings for each service
    if (Array.isArray(body.services)) {
      for (const serviceId of body.services) {
        try {
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
          } else {
            console.error(`Service not found for ID: ${serviceId}`);
          }
        } catch (serviceError) {
          console.error(`Error creating service mapping for service ID ${serviceId}:`, serviceError || 'Unknown error');
          throw serviceError;
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

      // Send admin and operations notification
      await emailService.sendOrderNotificationToAdminAndOperations(order, {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: address.contactNumber || body.contactNumber || "",
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

async function handleGuestCustomerOrder(body: any) {
  try {
    // Check if customer exists
    let customer = await prisma.customer.findUnique({
      where: { email: body.email }
    });

    // If customer exists, return error to prompt login
    if (customer) {
      return NextResponse.json(
        { error: "Customer already exists", message: "Please log in to continue with your order." },
        { status: 409 }
      );
    }

    // Generate random password for new customer
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Create new customer
    customer = await prisma.customer.create({
      data: {
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone || body.contactNumber,
        password: hashedPassword,
        isActive: true, // Auto-activate since we're sending login credentials
      },
    });

    // Build address string based on location type
    let addressString = "";
    let addressData: AddressData = {
      customerId: customer.id,
      label: body.locationType.charAt(0).toUpperCase() + body.locationType.slice(1),
      addressLine1: "",
      city: "Bahrain",
      isDefault: true,
      locationType: body.locationType,
      contactNumber: body.contactNumber || body.phone || null,
    };

    if (body.locationType === "hotel") {
      addressString = `${body.hotelName}, Room ${body.roomNumber}`;
      if (body.collectionMethod) {
        addressString += ` (${body.collectionMethod})`;
      }
      addressData = {
        ...addressData,
        addressLine1: addressString,
        area: body.collectionMethod,
        building: body.hotelName,
        floor: body.roomNumber,
      };
    } else if (body.locationType === "home") {
      addressString = `House ${body.house}, Road ${body.road}`;
      if (body.block) addressString += `, Block ${body.block}`;
      addressData = {
        ...addressData,
        addressLine1: addressString,
        area: body.road,
        building: body.house,
      };
    } else if (body.locationType === "flat") {
      addressString = `Building ${body.building}, Road ${body.road}`;
      if (body.block) addressString += `, Block ${body.block}`;
      if (body.flatNumber) addressString += `, Flat ${body.flatNumber}`;
      addressData = {
        ...addressData,
        addressLine1: addressString,
        area: body.road,
        building: body.building,
        apartment: body.flatNumber || null,
      };
    } else if (body.locationType === "office") {
      addressString = `Building ${body.building}, Road ${body.road}`;
      if (body.block) addressString += `, Block ${body.block}`;
      if (body.officeNumber) addressString += `, Office ${body.officeNumber}`;
      addressData = {
        ...addressData,
        addressLine1: addressString,
        area: body.road,
        building: body.building,
        apartment: body.officeNumber || null,
      };
    }

    // Create address
    const address = await prisma.address.create({
      data: addressData,
    });

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
        status: OrderStatus.ORDER_PLACED,
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerEmail: customer.email,
        customerPhone: address.contactNumber || customer.phone || body.contactNumber || "",
        customerAddress: addressString,
        paymentStatus: PaymentStatus.PENDING,
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
      // 1. Send welcome email with credentials
      await emailService.sendWelcomeEmailWithCredentials(
        customer,
        `${customer.firstName} ${customer.lastName}`,
        customer.email,
        randomPassword
      );

      // 2. Send order confirmation email
      await emailService.sendOrderConfirmationToCustomer(
        order,
        customer.email,
        `${customer.firstName} ${customer.lastName}`,
        {
          pickupDateTime,
          deliveryDateTime,
          services: body.services,
          address: addressString,
          locationType: body.locationType
        }
      );

      // Send admin and operations notification
      await emailService.sendOrderNotificationToAdminAndOperations(order, {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: address.contactNumber || body.contactNumber || "",
        address: addressString,
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
    console.error("Error creating guest customer order:", error || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to create order" },
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
        { error: "Order number is required" },
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
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

