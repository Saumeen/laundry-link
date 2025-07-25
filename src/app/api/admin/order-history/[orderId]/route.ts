import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Verify admin authentication
    const admin = await requireAuthenticatedAdmin();

    const { orderId } = await params;
    const orderIdNumber = parseInt(orderId);
    if (isNaN(orderIdNumber)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get comprehensive order timeline with all related data
    const [history, updates, driverAssignments, orderProcessing, issueReports] = await Promise.all([
      // Order history entries
      prisma.orderHistory.findMany({
        where: { orderId: orderIdNumber },
        include: {
          staff: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      
      // Order updates (status changes)
      prisma.orderUpdate.findMany({
        where: { orderId: orderIdNumber },
        include: {
          staff: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      
      // Driver assignments with photos
      prisma.driverAssignment.findMany({
        where: { orderId: orderIdNumber },
        include: {
          driver: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          photos: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      
      // Order processing details
      prisma.orderProcessing.findMany({
        where: { orderId: orderIdNumber },
        include: {
          staff: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      
      // Issue reports with photos
      prisma.issueReport.findMany({
        where: {
          orderProcessing: {
            orderId: orderIdNumber,
          },
        },
        include: {
          staff: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { reportedAt: 'desc' },
      }),
    ]);

    // Transform order updates into history format for consistency
    const transformedUpdates = updates.map(update => ({
      id: update.id,
      orderId: update.orderId,
      staffId: update.staffId,
      action: 'status_change',
      oldValue: update.oldStatus,
      newValue: update.newStatus,
      description: update.notes || `Status changed from ${update.oldStatus} to ${update.newStatus}`,
      metadata: null,
      createdAt: update.createdAt.toISOString(),
      staff: update.staff,
    }));

    // Combine and sort all history entries
    const combinedHistory = [...history, ...transformedUpdates].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      history: combinedHistory,
      driverAssignments,
      orderProcessing,
      issueReports,
      timeline: {
        totalEvents: combinedHistory.length + driverAssignments.length + orderProcessing.length + issueReports.length,
        lastUpdated: combinedHistory[0]?.createdAt || null,
      },
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order history' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Verify admin authentication
    const admin = await requireAuthenticatedAdmin();

    const { orderId } = await params;
    const orderIdNumber = parseInt(orderId);
    if (isNaN(orderIdNumber)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body = (await request.json()) as {
      action?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.action || !body.description) {
      return NextResponse.json(
        { error: 'Action and description are required' },
        { status: 400 }
      );
    }

    // Create history entry
    const historyEntry = await prisma.orderHistory.create({
      data: {
        orderId: orderIdNumber,
        staffId: admin.id,
        action: body.action,
        description: body.description,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      historyEntry,
    });
  } catch (error) {
    console.error('Error creating order history entry:', error);
    return NextResponse.json(
      { error: 'Failed to create history entry' },
      { status: 500 }
    );
  }
}
