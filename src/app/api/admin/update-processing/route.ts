// src/app/api/admin/update-processing/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';
import { OrderTrackingService } from '@/lib/orderTracking';
import { OrderStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    // Require admin authentication
    const admin = await requireAuthenticatedAdmin();
    const { orderId, processingNotes } = (await req.json()) as {
      orderId: string;
      totalPieces: number;
      totalWeight: number;
      processingNotes: string;
    };

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    //TODO
    const updatedOrder = await prisma.order.update({
      where: {
        id: parseInt(orderId),
      },
      data: {
        status: OrderStatus.PROCESSING_STARTED,
      },
    });

    // Also update order status and tracking
    await OrderTrackingService.updateOrderStatus({
      orderId: parseInt(orderId),
      staffId: admin.id,
      newStatus: OrderStatus.PROCESSING_STARTED,
      notes: processingNotes,
    });

    return NextResponse.json({
      message: 'Processing data updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating processing data:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to update processing data' },
      { status: 500 }
    );
  }
}
