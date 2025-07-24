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
    pickupTime: string;
    deliveryTime: string;
    specialInstructions?: string;
    contactNumber?: string;
  },
  customer: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    walletBalance: number;
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

    // Combine pickup date and time
    const pickupDateTime = new Date(`${body.pickupDate}T${body.pickupTime}:00`);
    const deliveryDateTime = new Date(
      `${body.deliveryDate}T${body.deliveryTime}:00`
    );

    // Create order using transaction
    const order = await prisma.$transaction(async tx => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: orderNumber,
          customerId: customer.id,
          addressId: address.id,
          pickupTime: pickupDateTime,
          deliveryTime: deliveryDateTime,
          specialInstructions: body.specialInstructions || '',
          status: OrderStatus.ORDER_PLACED,
          customerFirstName: customer.firstName,
          customerLastName: customer.lastName,
          customerEmail: customer.email,
          customerPhone: address.contactNumber || body.contactNumber || '',
          customerAddress: address.address || address.addressLine1,
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      // Create order service mappings for each service
      if (Array.isArray(body.services)) {
        for (const serviceId of body.services) {
          const service = await tx.service.findUnique({
            where: { id: parseInt(serviceId) },
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
      // Send order confirmation email for logged-in customer
      await emailService.sendOrderConfirmationToCustomer(
        orderWithRelations!,
        customer.email,
        `${customer.firstName} ${customer.lastName}`,
        {
          pickupDateTime,
          deliveryDateTime,
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

async function handleGuestCustomerOrder(body: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  locationType: string;
  hotelName?: string;
  roomNumber?: string;
  collectionMethod?: string;
  house?: string;
  road?: string;
  block?: string;
  building?: string;
  flatNumber?: string;
  officeNumber?: string;
  contactNumber?: string;
  pickupTime: string;
  deliveryTime: string;
  services: (string | number)[];
  specialInstructions?: string;
}) {
  try {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { email: body.email },
    });

    // If customer exists, return error to prompt login
    if (customer) {
      return NextResponse.json(
        {
          error: 'Customer already exists',
          message: 'Please log in to continue with your order.',
        },
        { status: 409 }
      );
    }

    // Generate random password for new customer
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Build address string based on location type
    let addressString = '';
    let addressData: AddressData = {
      customerId: 0, // Will be set after customer creation
      label:
        body.locationType.charAt(0).toUpperCase() + body.locationType.slice(1),
      addressLine1: '',
      city: 'Bahrain',
      isDefault: true,
      locationType: body.locationType,
      contactNumber: body.contactNumber || body.phone || null,
    };

    if (body.locationType === 'hotel') {
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
    } else if (body.locationType === 'home') {
      addressString = `House ${body.house}, Road ${body.road}`;
      if (body.block) addressString += `, Block ${body.block}`;
      addressData = {
        ...addressData,
        addressLine1: addressString,
        area: body.road,
        building: body.house,
      };
    } else if (body.locationType === 'flat') {
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
    } else if (body.locationType === 'office') {
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

    // Generate order number
    const orderNumber = `LL${Date.now().toString().slice(-8)}`;

    // Combine pickup date and time
    const pickupDateTime = new Date(`${body.pickupDate}T${body.pickupTime}:00`);
    const deliveryDateTime = new Date(
      `${body.deliveryDate}T${body.deliveryTime}:00`
    );

    // Create customer, address, and order using transaction
    const { customer: newCustomer, order } = await prisma.$transaction(
      async tx => {
        // Create new customer
        const createdCustomer = await tx.customer.create({
          data: {
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone || body.contactNumber,
            password: hashedPassword,
            isActive: true, // Auto-activate since we're sending login credentials
          },
        });

        // Create address
        const address = await tx.address.create({
          data: {
            ...addressData,
            customerId: createdCustomer.id,
          },
        });

        // Create order
        const newOrder = await tx.order.create({
          data: {
            orderNumber: orderNumber,
            customerId: createdCustomer.id,
            addressId: address.id,
            pickupTime: pickupDateTime,
            deliveryTime: deliveryDateTime,
            specialInstructions: body.specialInstructions || '',
            status: OrderStatus.ORDER_PLACED,
            customerFirstName: createdCustomer.firstName,
            customerLastName: createdCustomer.lastName,
            customerEmail: createdCustomer.email,
            customerPhone:
              address.contactNumber ||
              createdCustomer.phone ||
              body.contactNumber ||
              '',
            customerAddress: addressString,
            paymentStatus: PaymentStatus.PENDING,
          },
        });

        // Create order service mappings for each service
        if (Array.isArray(body.services)) {
          for (const serviceId of body.services) {
            const service = await tx.service.findUnique({
              where: { id: parseInt(serviceId) },
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
            }
          }
        }

        return { customer: createdCustomer, order: newOrder };
      }
    );

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
      // 1. Send welcome email with credentials
      await emailService.sendWelcomeEmailWithCredentials(
        newCustomer,
        `${newCustomer.firstName} ${newCustomer.lastName}`,
        newCustomer.email,
        randomPassword
      );

      // 2. Send order confirmation email
      await emailService.sendOrderConfirmationToCustomer(
        orderWithRelations!,
        newCustomer.email,
        `${newCustomer.firstName} ${newCustomer.lastName}`,
        {
          pickupDateTime,
          deliveryDateTime,
          services: body.services.map((id: number) => id),
          address: addressString,
        }
      );

      // Send admin notification
      await emailService.sendOrderNotificationToAdmin(orderWithRelations!, {
        name: `${newCustomer.firstName} ${newCustomer.lastName}`,
        email: newCustomer.email,
        phone: newCustomer.phone || body.contactNumber || '',
        address: addressString,
        services: body.services.map((id: number) => id.toString()),
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
    console.error('Error creating guest customer order:', error);
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
