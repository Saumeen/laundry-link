import { NextResponse } from 'next/server';
import { OrderTrackingService } from '@/lib/orderTracking';
import { OrderStatus } from '@prisma/client';
import { isValidOrderStatus } from '@/lib/orderStatus';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, notes, staffId, metadata } = body as {
      orderId: string;
      status: string;
      notes?: string;
      staffId?: number;
      metadata?: Record<string, unknown>;
    };

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status enum
    if (!isValidOrderStatus(status)) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      );
    }

    // Use the existing OrderTrackingService
    const result = await OrderTrackingService.updateOrderStatusWithEmail({
      orderId: parseInt(orderId),
      newStatus: status as OrderStatus,
      staffId,
      notes,
      metadata,
      shouldSendEmail: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to update order status' },
        { status: 400 }
      );
    }

    console.log(
      'Order status updated:',
      result.order?.orderNumber,
      '->',
      status
    );

    return NextResponse.json({
      message: 'Order status updated successfully',
      order: result.order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
