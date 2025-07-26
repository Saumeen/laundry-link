import { NextResponse } from 'next/server';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import { ORDER_STATUS_CONFIG } from '@/lib/orderStatus';
import { OrderStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const { searchParams } = new URL(req.url);
    const currentStatus = searchParams.get('currentStatus') as OrderStatus;

    if (!currentStatus) {
      return NextResponse.json(
        { error: 'Current status is required' },
        { status: 400 }
      );
    }

    // Get the status configuration for the current status
    const statusConfig = ORDER_STATUS_CONFIG[currentStatus];
    
    if (!statusConfig) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      );
    }

    // Get the allowed transitions with their full configuration
    const allowedTransitions = statusConfig.canTransitionTo.map((status: OrderStatus) => ({
      value: status,
      label: ORDER_STATUS_CONFIG[status].label,
      description: ORDER_STATUS_CONFIG[status].description,
      color: ORDER_STATUS_CONFIG[status].color,
      icon: ORDER_STATUS_CONFIG[status].icon,
    }));

    return NextResponse.json({
      currentStatus: {
        value: currentStatus,
        label: statusConfig.label,
        description: statusConfig.description,
        color: statusConfig.color,
        icon: statusConfig.icon,
      },
      allowedTransitions,
    });
  } catch (error) {
    console.error('Error fetching status transitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status transitions' },
      { status: 500 }
    );
  }
} 