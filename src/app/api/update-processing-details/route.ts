import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderTrackingService } from '@/lib/orderTracking';
import { ProcessingStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      numberOfPieces,
      weight,
      processingNotes,
      processingStatus,
      staffId,
    } = body as {
      orderId: string | number;
      numberOfPieces?: string | number;
      weight?: string | number;
      processingNotes?: string;
      processingStatus?: ProcessingStatus;
      staffId?: number;
    };

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Update or create order processing record
    const processingData = {
      totalPieces: numberOfPieces
        ? parseInt(numberOfPieces.toString())
        : undefined,
      totalWeight: weight ? parseFloat(weight.toString()) : undefined,
      processingNotes: processingNotes,
      processingStatus: processingStatus || ProcessingStatus.IN_PROGRESS,
    };

    const orderProcessing = await prisma.orderProcessing.upsert({
      where: {
        orderId: parseInt(orderId.toString()),
      },
      update: processingData,
      create: {
        orderId: parseInt(orderId.toString()),
        staffId: staffId || 1, // Default staff ID if not provided
        ...processingData,
      },
    });

    // Track the processing update
    if (staffId) {
      await OrderTrackingService.trackProcessingUpdate(
        parseInt(orderId.toString()),
        staffId,
        processingStatus || ProcessingStatus.IN_PROGRESS,
        processingNotes
      );
    }

    return NextResponse.json({
      message: 'Processing details updated successfully',
      processing: orderProcessing,
    });
  } catch (error) {
    console.error('Error updating processing details:', error);
    return NextResponse.json(
      { error: 'Failed to update processing details' },
      { status: 500 }
    );
  }
}
