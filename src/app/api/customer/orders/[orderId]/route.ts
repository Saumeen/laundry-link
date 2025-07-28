import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireAuthenticatedCustomer,
  createAuthErrorResponse,
} from '@/lib/auth';
import { formatTimeSlotRange } from '@/lib/utils/timezone';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Get authenticated customer using NextAuth
    const authenticatedCustomer = await requireAuthenticatedCustomer();

    // Fetch order with order items and address, ensuring it belongs to the customer
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        customerId: authenticatedCustomer.id,
      },
      include: {
        orderServiceMappings: {
          include: {
            orderItems: true,
            service: true,
          },
        },
        address: true,
        orderProcessing: {
          include: {
            processingItems: {
              include: {
                processingItemDetails: {
                  include: {
                    orderItem: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Helper function to format timeslot display
    const formatTimeSlot = (startTime: Date, endTime: Date) => {
      return formatTimeSlotRange(startTime, endTime);
    };

    // Transform the data to match the expected interface
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      invoiceTotal: order.invoiceTotal || 0,
      pickupTime: order.pickupStartTime.toISOString(),
      deliveryTime: order.deliveryStartTime?.toISOString(),
      // Add full timeslot information
      pickupStartTime: order.pickupStartTime.toISOString(),
      pickupEndTime: order.pickupEndTime.toISOString(),
      deliveryStartTime: order.deliveryStartTime?.toISOString(),
      deliveryEndTime: order.deliveryEndTime?.toISOString(),
      pickupTimeSlot: formatTimeSlot(
        order.pickupStartTime,
        order.pickupEndTime
      ),
      deliveryTimeSlot:
        order.deliveryStartTime && order.deliveryEndTime
          ? formatTimeSlot(order.deliveryStartTime, order.deliveryEndTime)
          : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      customerNotes: order.specialInstructions || null,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      specialInstructions: order.specialInstructions,
      invoiceGenerated: order.invoiceGenerated,

      // Transform orderServiceMappings to items (for services tab)
      items: order.orderServiceMappings.map(mapping => ({
        id: mapping.id,
        serviceName: mapping.service.name,
        quantity: mapping.quantity,
        unitPrice: mapping.price,
        totalPrice: mapping.quantity * mapping.price,
        notes: mapping.service.description || null,
      })),

      // Transform orderItems to invoiceItems (for invoice tab)
      invoiceItems: order.orderServiceMappings.flatMap(mapping =>
        mapping.orderItems.map(item => ({
          id: item.id,
          serviceName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.pricePerItem,
          totalPrice: item.totalPrice,
          notes: item.notes || null,
        }))
      ),

      // Address transformation
      address: order.address
        ? {
            id: order.address.id,
            label: order.address.label,
            addressLine1: order.address.addressLine1,
            addressLine2: order.address.addressLine2 || '',
            city: order.address.city,
            area: order.address.area || '',
            building: order.address.building || '',
            floor: order.address.floor || '',
            apartment: order.address.apartment || '',
            contactNumber:
              order.address.contactNumber || order.customerPhone || '',
          }
        : null,

      // Use the same address for both pickup and delivery (as per current system)
      pickupAddress: order.address
        ? {
            id: order.address.id,
            label: order.address.label,
            addressLine1: order.address.addressLine1,
            addressLine2: order.address.addressLine2 || '',
            city: order.address.city,
            area: order.address.area || '',
            building: order.address.building || '',
            floor: order.address.floor || '',
            apartment: order.address.apartment || '',
            contactNumber:
              order.address.contactNumber || order.customerPhone || '',
          }
        : null,

      deliveryAddress: order.address
        ? {
            id: order.address.id,
            label: order.address.label,
            addressLine1: order.address.addressLine1,
            addressLine2: order.address.addressLine2 || '',
            city: order.address.city,
            area: order.address.area || '',
            building: order.address.building || '',
            floor: order.address.floor || '',
            apartment: order.address.apartment || '',
            contactNumber:
              order.address.contactNumber || order.customerPhone || '',
          }
        : null,

      // Processing details from orderProcessing
      processingDetails: order.orderProcessing
        ? {
            washType: order.orderProcessing.processingNotes || null,
            dryType: null, // Not currently stored in the schema
            specialInstructions: order.orderProcessing.processingNotes || null,
            fabricType: null, // Not currently stored in the schema
            stainTreatment: null, // Not currently stored in the schema
          }
        : null,
    };

    return NextResponse.json({ order: transformedOrder });
  } catch (error) {
    console.error('Error fetching order details:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return createAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
