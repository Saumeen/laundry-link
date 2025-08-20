import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = parseInt(params.orderId);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Fetch order with all related data including addresses and service mappings
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        address: true,
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Transform the data to match the expected format with actual order data
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      invoiceTotal: order.invoiceTotal || 0,
      pickupStartTime: order.pickupStartTime.toISOString(),
      pickupEndTime: order.pickupEndTime.toISOString(),
      deliveryStartTime: order.deliveryStartTime?.toISOString(),
      deliveryEndTime: order.deliveryEndTime?.toISOString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      customerNotes: order.specialInstructions || null,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      // Use the actual address from the order if available
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
            collectionMethod: order.address.collectionMethod || null,
          }
        : {
            // Fallback to customer address if no specific address is linked
            id: 0,
            label: 'Customer Address',
            addressLine1: order.customerAddress,
            addressLine2: '',
            city: '',
            area: '',
            building: '',
            floor: '',
            apartment: '',
            contactNumber: order.customerPhone || '',
          },
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
            collectionMethod: order.address.collectionMethod || null,
          }
        : {
            // Fallback to customer address if no specific address is linked
            id: 0,
            label: 'Customer Address',
            addressLine1: order.customerAddress,
            addressLine2: '',
            city: '',
            area: '',
            building: '',
            floor: '',
            apartment: '',
            contactNumber: order.customerPhone || '',
          },
      // Show actual services selected by the user
      items: order.orderServiceMappings.map(mapping => ({
        id: mapping.id,
        serviceName:
          mapping.service?.displayName ||
          mapping.service?.name ||
          'Unknown Service',
        quantity: mapping.quantity,
        unitPrice: mapping.price,
        totalPrice: mapping.quantity * mapping.price,
        notes: mapping.service?.description || '',
      })),
      // Show order items with detailed information
      orderItems: order.orderServiceMappings.flatMap(mapping =>
        mapping.orderItems.map(orderItem => ({
          id: orderItem.id,
          itemName: orderItem.itemName,
          itemType: orderItem.itemType,
          serviceName:
            mapping.service?.displayName ||
            mapping.service?.name ||
            'Unknown Service',
          quantity: orderItem.quantity,
          unitPrice: orderItem.pricePerItem,
          totalPrice: orderItem.totalPrice,
          notes: orderItem.notes || '',
        }))
      ),
      processingDetails: null,
    };

    return NextResponse.json({ order: transformedOrder });
  } catch (error) {
    logger.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
