import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import { createTapInvoiceIfNeeded } from '@/lib/tapInvoiceService';
import logger from '@/lib/logger';

interface CreateTapInvoiceRequest {
  orderId: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    await requireAuthenticatedAdmin();

    const body = await request.json();
    const { orderId } = body as CreateTapInvoiceRequest;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Use the TapInvoiceService
    const result = await createTapInvoiceIfNeeded(orderId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Error creating Tap invoice:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create Tap invoice';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Set appropriate status codes based on error type
      if (error.message.includes('Order not found') || 
          error.message.includes('Order is missing') ||
          error.message.includes('Order has invalid')) {
        statusCode = 400;
      } else if (error.message.includes('Customer data') || 
                 error.message.includes('Invalid amount') ||
                 error.message.includes('Invalid email')) {
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 