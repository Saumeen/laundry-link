import { NextResponse } from 'next/server';
import { OrderTrackingService } from '@/lib/orderTracking';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import { ProcessingStatus } from '@prisma/client';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    // Get authenticated admin from session
    const admin = await requireAuthenticatedAdmin();

    const body = await req.json();
    const { orderId, action, notes, totalPieces, totalWeight, qualityScore } =
      body as {
        orderId: number;
        action:
          | 'receive_order'
          | 'start_processing'
          | 'complete_processing'
          | 'ready_for_delivery'
          | 'generate_invoice'
          | 'assign_delivery_driver';
        notes?: string;
        totalPieces?: number;
        totalWeight?: number;
        qualityScore?: number;
      };

    if (!orderId || !action) {
      return NextResponse.json(
        { error: 'Order ID and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = [
      'receive_order',
      'start_processing',
      'complete_processing',
      'ready_for_delivery',
      'generate_invoice',
      'assign_delivery_driver',
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Handle processing data for processing actions
    if (action === 'start_processing' || action === 'complete_processing') {
      // Check if processing exists
      const existingProcessing = await prisma.orderProcessing.findUnique({
        where: { orderId },
      });

      if (!existingProcessing) {
        // Create new processing record
        await prisma.orderProcessing.create({
          data: {
            orderId,
            staffId: admin.id,
            processingStatus:
              action === 'start_processing'
                ? ProcessingStatus.IN_PROGRESS
                : ProcessingStatus.COMPLETED,
            totalPieces,
            totalWeight,
            processingNotes: notes,
            qualityScore,
            processingStartedAt: new Date(),
            processingCompletedAt:
              action === 'complete_processing' ? new Date() : undefined,
          },
        });
      } else {
        // Update existing processing record
        await prisma.orderProcessing.update({
          where: { orderId },
          data: {
            processingStatus:
              action === 'start_processing'
                ? ProcessingStatus.IN_PROGRESS
                : ProcessingStatus.COMPLETED,
            totalPieces,
            totalWeight,
            processingNotes: notes,
            qualityScore,
            processingCompletedAt:
              action === 'complete_processing' ? new Date() : undefined,
          },
        });
      }
    }

    // Handle facility action using the existing OrderTrackingService
    const result = await OrderTrackingService.handleFacilityAction({
      orderId,
      staffId: admin.id, // Get staff ID from backend session
      action,
      notes,
      metadata: { action }, // Only pass action for history tracking
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to handle facility action' },
        { status: 400 }
      );
    }

    logger.info(`Facility action completed: ${action} for order ${orderId} by staff ${admin.id}`
    );

    return NextResponse.json({
      message: 'Facility action completed successfully',
      action,
      orderId,
    });
  } catch (error) {
    logger.error('Error handling facility action:', error);
    return NextResponse.json(
      { error: 'Failed to handle facility action' },
      { status: 500 }
    );
  }
}
