import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/emailService";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json() as any;

    // Check if this is a logged-in customer order
    if (body.isLoggedInCustomer) {
      return await handleLoggedInCustomerOrder(body);
    } else {
      return await handleGuestCustomerOrder(body);
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

async function handleLoggedInCustomerOrder(body: any) {
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
        serviceType: Array.isArray(body.services) ? body.services.join(", ") : body.services || "Standard Service",
        totalAmount: 0, // Will be calculated after items are sorted
        pickupTime: pickupDateTime,
        deliveryTime: deliveryDateTime,
        specialInstructions: body.specialInstructions || "",
        status: "Order Placed",
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerEmail: customer.email,
        customerPhone: customer.phone || "",
        customerAddress: address.address || address.addressLine1,
        items: Array.isArray(body.services) ? body.services : [body.services || "Standard Service"],
        paymentStatus: "Pending",
      },
    });

    // Create invoice items for each service
    if (Array.isArray(body.services)) {
      const serviceNames = {
        wash: "Wash (by weight)",
        wash_iron: "Wash & Iron (by piece)",
        dry_clean: "Dry Clean (by piece)",
        duvet_bulky: "Duvet & Bulky Items (by piece)",
        carpet: "Carpet Cleaning (by square meter)"
      };

      for (const serviceId of body.services) {
        await prisma.invoiceItem.create({
          data: {
            orderId: order.id,
            itemType: serviceNames[serviceId] || serviceId,
            serviceType: serviceId,
            quantity: 1,
            pricePerItem: 0, // Will be updated after sorting
            totalPrice: 0,
          }
        });
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
      console.error("Email sending failed:", emailError);
      // Continue with order creation even if emails fail
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      message: "Order created successfully"
    });

  } catch (error) {
    console.error("Error creating logged-in customer order:", error);
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
    let addressData = {
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
        address: addressString,
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
        address: addressString,
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
        address: addressString,
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
        address: addressString,
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
        serviceType: Array.isArray(body.services) ? body.services.join(", ") : body.services || "Standard Service",
        totalAmount: 0, // Will be calculated after items are sorted
        pickupTime: pickupDateTime,
        deliveryTime: deliveryDateTime,
        specialInstructions: body.specialInstructions || "",
        status: "Order Placed",
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerEmail: customer.email,
        customerPhone: customer.phone || "",
        customerAddress: addressString,
        items: Array.isArray(body.services) ? body.services : [body.services || "Standard Service"],
        paymentStatus: "Pending",
      },
    });

    // Create invoice items for each service
    if (Array.isArray(body.services)) {
      const serviceNames = {
        wash: "Wash (by weight)",
        wash_iron: "Wash & Iron (by piece)",
        dry_clean: "Dry Clean (by piece)",
        duvet_bulky: "Duvet & Bulky Items (by piece)",
        carpet: "Carpet Cleaning (by square meter)"
      };

      for (const serviceId of body.services) {
        await prisma.invoiceItem.create({
          data: {
            orderId: order.id,
            itemType: serviceNames[serviceId] || serviceId,
            serviceType: serviceId,
            quantity: 1,
            pricePerItem: 0, // Will be updated after sorting
            totalPrice: 0,
          }
        });
      }
    }

    // Send emails (wrapped in try-catch to not fail order creation)
    try {
      // 1. Send email with autogenerated account and password
      const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/customer/dashboard`;
      
      const accountEmailContent = `
        <h2>Welcome to Laundry Link!</h2>
        <p>Dear ${customer.firstName} ${customer.lastName},</p>
        
        <p>Thank you for your order! We've created an account for you to manage your laundry services.</p>
        
        <h3>Your Login Information:</h3>
        <p><strong>Email:</strong> ${customer.email}</p>
        <p><strong>Password:</strong> ${randomPassword}</p>
        
        <h3>What you can view in your account:</h3>
        <ul>
          <li>Addresses - Manage your pickup and delivery locations</li>
          <li>Wallet - View your account balance and payment history</li>
          <li>Orders - Track your current and past orders</li>
          <li>Payments - View payment history and invoices</li>
          <li>Statuses - Real-time updates on your order progress</li>
        </ul>
        
        <p><a href="${dashboardLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Access Your Dashboard</a></p>
        
        <p>Best regards,<br>Laundry Link Team</p>
      `;

      await emailService.sendCustomEmail(
        customer.email,
        "Your Laundry Link Account Details",
        accountEmailContent
      );

      // 2. Send email with order confirmation
      const orderEmailContent = `
        <h2>Order Confirmation</h2>
        <p>Dear ${customer.firstName} ${customer.lastName},</p>
        
        <p>Your order has been successfully placed!</p>
        
        <h3>Order Details:</h3>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Customer Name:</strong> ${customer.firstName} ${customer.lastName}</p>
        <p><strong>Pickup Date/Time:</strong> ${pickupDateTime.toLocaleDateString()} at ${pickupDateTime.toLocaleTimeString()}</p>
        <p><strong>Delivery Date/Time:</strong> ${deliveryDateTime.toLocaleDateString()} at ${deliveryDateTime.toLocaleTimeString()}</p>
        
        <p><strong>Note:</strong> Duvet, carpet, and dry clean items usually take 72 hours of processing, so the delivery timing might be different.</p>
        
        <p>The invoice and service value will be available to view once the items are sorted in our facility.</p>
        
        <p>You can contact us by WhatsApp on <strong>+97333440841</strong></p>
        
        <p>Best regards,<br>Laundry Link Team</p>
      `;

      await emailService.sendCustomEmail(
        customer.email,
        `Order Confirmation - ${order.orderNumber}`,
        orderEmailContent
      );

      // Send admin notification
      await emailService.sendOrderNotificationToAdmin(order, {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
        address: addressString,
        services: body.services
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Continue with order creation even if emails fail
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      message: "Order created successfully"
    });

  } catch (error) {
    console.error("Error creating guest customer order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerEmail = searchParams.get('email');
    
    if (!customerEmail) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email: customerEmail },
      include: {
        orders: {
          include: {
            address: true,
            invoiceItems: true,
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      orders: customer.orders 
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

