import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import { TapInvoiceService } from '@/lib/tapInvoiceService';

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
    const result = await TapInvoiceService.createTapInvoiceIfNeeded(orderId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error creating Tap invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create Tap invoice' },
      { status: 500 }
    );
  }
} 