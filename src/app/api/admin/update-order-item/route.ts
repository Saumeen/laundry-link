// src/app/api/admin/update-order-item/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';

interface UpdateOrderItemRequest {
  orderItemId: number;
  itemName?: string;
  itemType?: string;
  quantity?: number;
  pricePerItem?: number;
  notes?: string;
}

export async function PUT(req: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const body = (await req.json()) as UpdateOrderItemRequest;
    const { orderItemId, itemName, itemType, quantity, pricePerItem, notes } =
      body;

    if (!orderItemId) {
      return NextResponse.json(
        { error: 'Order item ID is required' },
        { status: 400 }
      );
    }

    // Get the existing order item
    const existingItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        orderServiceMapping: {
          include: {
            order: true,
            service: true,
          },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Calculate new total price if quantity or price changes
    const newQuantity =
      quantity !== undefined ? quantity : existingItem.quantity;
    const newPricePerItem =
      pricePerItem !== undefined ? pricePerItem : existingItem.pricePerItem;
    const newTotalPrice = newQuantity * newPricePerItem;

    // Update the order item
    const updatedItem = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        ...(itemName !== undefined && { itemName }),
        ...(itemType !== undefined && { itemType }),
        ...(quantity !== undefined && { quantity: newQuantity }),
        ...(pricePerItem !== undefined && { pricePerItem: newPricePerItem }),
        ...(notes !== undefined && { notes }),
        totalPrice: newTotalPrice,
      },
      include: {
        orderServiceMapping: {
          include: {
            service: true,
          },
        },
      },
    });

    // Update processing item detail if it exists
    const processingItemDetail = await prisma.processingItemDetail.findFirst({
      where: { orderItemId },
    });

    if (processingItemDetail && quantity !== undefined) {
      await prisma.processingItemDetail.update({
        where: { id: processingItemDetail.id },
        data: { quantity: newQuantity },
      });
    }

    // Recalculate order total
    const allOrderItems = await prisma.orderItem.findMany({
      where: {
        orderServiceMapping: {
          orderId: existingItem.orderServiceMapping.order.id,
        },
      },
    });

    const newOrderTotal = allOrderItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    // Update order with new invoice total
    await prisma.order.update({
      where: { id: existingItem.orderServiceMapping.order.id },
      data: {
        invoiceTotal: newOrderTotal,
      },
    });

    return NextResponse.json({
      message: 'Order item updated successfully',
      orderItem: {
        id: updatedItem.id,
        orderServiceMappingId: updatedItem.orderServiceMappingId,
        itemName: updatedItem.itemName,
        itemType: updatedItem.itemType,
        quantity: updatedItem.quantity,
        pricePerItem: updatedItem.pricePerItem,
        totalPrice: updatedItem.totalPrice,
        notes: updatedItem.notes,
        service: updatedItem.orderServiceMapping.service,
      },
      newOrderTotal,
    });
  } catch (error) {
    logger.error('Error updating order item:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to update order item' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const { searchParams } = new URL(req.url);
    const orderItemId = searchParams.get('orderItemId');

    if (!orderItemId) {
      return NextResponse.json(
        { error: 'Order item ID is required' },
        { status: 400 }
      );
    }

    // Get the existing order item to get order ID for total recalculation
    const existingItem = await prisma.orderItem.findUnique({
      where: { id: parseInt(orderItemId) },
      include: {
        orderServiceMapping: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Delete processing item detail if it exists
    await prisma.processingItemDetail.deleteMany({
      where: { orderItemId: parseInt(orderItemId) },
    });

    // Delete the order item
    await prisma.orderItem.delete({
      where: { id: parseInt(orderItemId) },
    });

    // Recalculate order total
    const allOrderItems = await prisma.orderItem.findMany({
      where: {
        orderServiceMapping: {
          orderId: existingItem.orderServiceMapping.order.id,
        },
      },
    });

    const newOrderTotal = allOrderItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    // Update order with new invoice total
    await prisma.order.update({
      where: { id: existingItem.orderServiceMapping.order.id },
      data: {
        invoiceTotal: newOrderTotal,
      },
    });

    return NextResponse.json({
      message: 'Order item deleted successfully',
      newOrderTotal,
    });
  } catch (error) {
    logger.error('Error deleting order item:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to delete order item' },
      { status: 500 }
    );
  }
}
