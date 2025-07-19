import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

interface UpdateOrderRequest {
  status?: string;
  pickupTime?: string;
  deliveryTime?: string;
  specialInstructions?: string;
  // Address fields for order-specific address updates
  addressLabel?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  area?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  contactNumber?: string;
  locationType?: string;
  orderItems?: Array<{
    id?: number; // Add ID for existing items
    orderServiceMappingId: number;
    itemName: string;
    itemType: string;
    quantity: number;
    pricePerItem: number;
    totalPrice: number;
    notes?: string;
  }>;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    // Await params before using
    const resolvedParams = await params;

    // Validate params and orderId
    if (!resolvedParams || !resolvedParams.orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const { orderId } = resolvedParams;
    
    // Validate that orderId is a valid number
    const orderIdNum = parseInt(orderId);
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }
    
    const { 
      status, 
      pickupTime, 
      deliveryTime, 
      specialInstructions,
      addressLabel,
      addressLine1,
      addressLine2,
      city,
      area,
      building,
      floor,
      apartment,
      contactNumber,
      locationType,
      orderItems 
    }: UpdateOrderRequest = await req.json();

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (pickupTime) updateData.pickupTime = new Date(pickupTime);
    if (deliveryTime) updateData.deliveryTime = new Date(deliveryTime);
    if (specialInstructions !== undefined) updateData.specialInstructions = specialInstructions;

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderIdNum,
      },
      data: updateData,
    });

    // Handle address updates if provided
    if (addressLine1 || addressLabel || city || contactNumber) {
      // Get the current order to check if it has an address
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderIdNum },
        include: { address: true }
      });

      if (currentOrder?.address) {
        // Update existing address
        const addressUpdateData: Record<string, unknown> = {};
        if (addressLabel) addressUpdateData.label = addressLabel;
        if (addressLine1) addressUpdateData.addressLine1 = addressLine1;
        if (addressLine2 !== undefined) addressUpdateData.addressLine2 = addressLine2;
        if (city) addressUpdateData.city = city;
        if (area !== undefined) addressUpdateData.area = area;
        if (building !== undefined) addressUpdateData.building = building;
        if (floor !== undefined) addressUpdateData.floor = floor;
        if (apartment !== undefined) addressUpdateData.apartment = apartment;
        if (contactNumber !== undefined) addressUpdateData.contactNumber = contactNumber;
        if (locationType !== undefined) addressUpdateData.locationType = locationType;

        await prisma.address.update({
          where: { id: currentOrder.address.id },
          data: addressUpdateData,
        });
      } else {
        // Create new address for this order
        const newAddress = await prisma.address.create({
          data: {
            customerId: currentOrder!.customerId,
            label: addressLabel || 'Order Address',
            addressLine1: addressLine1 || '',
            addressLine2: addressLine2 || '',
            city: city || 'Bahrain',
            area: area || '',
            building: building || '',
            floor: floor || '',
            apartment: apartment || '',
            contactNumber: contactNumber || '',
            locationType: locationType || 'flat',
          }
        });

        // Link the new address to the order
        await prisma.order.update({
          where: { id: orderIdNum },
          data: { addressId: newAddress.id }
        });
      }
    }

    // If order items are provided, update them intelligently
    if (orderItems && Array.isArray(orderItems)) {
      // Get existing order items for this order
      const existingItems = await prisma.orderItem.findMany({
        where: {
          orderServiceMapping: {
            orderId: orderIdNum,
          },
        },
      });

      // Separate items into existing (with ID) and new (without ID)
      const itemsToUpdate = orderItems.filter(item => item.id && item.id > 0);
      const itemsToCreate = orderItems.filter(item => !item.id || item.id <= 0);
      
      // Get IDs of items that should be deleted (existing items not in the new list)
      const newItemIds = itemsToUpdate.map(item => item.id!);
      const itemsToDelete = existingItems.filter((item: { id: number }) => !newItemIds.includes(item.id));

      // Delete items that are no longer needed
      if (itemsToDelete.length > 0) {
        await prisma.orderItem.deleteMany({
          where: {
            id: {
              in: itemsToDelete.map((item: { id: number }) => item.id),
            },
          },
        });
      }

      // Update existing items
      for (const item of itemsToUpdate) {
        if (item.id && item.orderServiceMappingId && item.quantity > 0) {
          await prisma.orderItem.update({
            where: {
              id: item.id,
            },
            data: {
              orderServiceMappingId: item.orderServiceMappingId,
              itemName: item.itemName,
              itemType: item.itemType,
              quantity: item.quantity,
              pricePerItem: item.pricePerItem,
              totalPrice: item.totalPrice,
              notes: item.notes,
            },
          });
        }
      }

      // Create new items
      for (const item of itemsToCreate) {
        if (item.orderServiceMappingId && item.quantity > 0) {
          await prisma.orderItem.create({
            data: {
              orderServiceMappingId: item.orderServiceMappingId,
              itemName: item.itemName,
              itemType: item.itemType,
              quantity: item.quantity,
              pricePerItem: item.pricePerItem,
              totalPrice: item.totalPrice,
              notes: item.notes,
            },
          });
        }
      }

      // Recalculate total amount
      const newOrderItems = await prisma.orderItem.findMany({
        where: {
          orderServiceMapping: {
            orderId: orderIdNum,
          },
        },
        include: {
          orderServiceMapping: {
            include: {
              service: true,
            },
          },
        },
      });

      // Calculate total using totalPrice for each item
      const newTotalAmount = newOrderItems.reduce((sum: number, item: { totalPrice: number }) => 
        sum + item.totalPrice, 0);

      // Update order with new total amount
      await prisma.order.update({
        where: {
          id: orderIdNum,
        },
        data: {
          invoiceTotal: newTotalAmount,
        },
      });
    }

    // Fetch the updated order with all related data
    const finalOrder = await prisma.order.findUnique({
      where: {
        id: orderIdNum,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({
      message: "Order updated successfully",
      order: finalOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error || 'Unknown error');
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
} 