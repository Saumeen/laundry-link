import { NextRequest, NextResponse } from 'next/server';
import { handleTapWebhook, validateTapWebhookSignature } from '@/lib/utils/tapPaymentUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-tap-signature');

    // Validate webhook signature
    const secretKey = process.env.TAP_WEBHOOK_SECRET;
    if (!secretKey) {
      console.error('TAP_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature || !validateTapWebhookSignature(body, signature, secretKey)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook data
    const webhookData = JSON.parse(body);
    console.log('Received Tap webhook:', webhookData);

    // Handle the webhook
    const result = await handleTapWebhook(webhookData);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error processing Tap webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 