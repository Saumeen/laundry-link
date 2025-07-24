import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Verify admin authentication
    const admin = await requireAuthenticatedAdmin();

    const orderId = parseInt(params.orderId);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get comprehensive order timeline
    const [history, updates, driverAssignments, processing] = await Promise.all(
      [
        prisma.orderHistory.findMany({
          where: { orderId },
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
        prisma.orderUpdate.findMany({
          where: { orderId },
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
        prisma.driverAssignment.findMany({
          where: { orderId },
          include: {
            driver: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.orderProcessing.findMany({
          where: { orderId },
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
      ]
    );

    // Transform and combine all events
    const timeline = [
      ...history.map(h => ({
        id: `history-${h.id}`,
        type: 'history' as const,
        createdAt: h.createdAt,
        description: h.description,
        staff: h.staff,
        metadata: h.metadata,
        action: h.action,
        oldValue: h.oldValue,
        newValue: h.newValue,
      })),
      ...updates.map(u => ({
        id: `update-${u.id}`,
        type: 'update' as const,
        createdAt: u.createdAt,
        description: `Status updated from ${u.oldStatus} to ${u.newStatus}`,
        staff: u.staff,
        metadata: { notes: u.notes },
        oldStatus: u.oldStatus,
        newStatus: u.newStatus,
        notes: u.notes,
      })),
      ...driverAssignments.map(d => ({
        id: `driver-${d.id}`,
        type: 'driver_assignment' as const,
        createdAt: d.createdAt,
        description: `Driver assignment for ${d.assignmentType} - ${d.status}`,
        staff: d.driver,
        metadata: {
          assignmentType: d.assignmentType,
          status: d.status,
          estimatedTime: d.estimatedTime,
          actualTime: d.actualTime,
          notes: d.notes,
        },
      })),
      ...processing.map(p => ({
        id: `processing-${p.id}`,
        type: 'processing' as const,
        createdAt: p.createdAt,
        description: `Processing status: ${p.processingStatus}`,
        staff: p.staff,
        metadata: {
          processingStatus: p.processingStatus,
          totalPieces: p.totalPieces,
          totalWeight: p.totalWeight,
          processingNotes: p.processingNotes,
          qualityScore: p.qualityScore,
        },
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(timeline);
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
  { params }: { params: { orderId: string } }
) {
  try {
    // Verify admin authentication
    const admin = await requireAuthenticatedAdmin();

    const orderId = parseInt(params.orderId);
    if (isNaN(orderId)) {
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
        orderId,
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

    return NextResponse.json(historyEntry);
  } catch (error) {
    console.error('Error creating order history entry:', error);
    return NextResponse.json(
      { error: 'Failed to create history entry' },
      { status: 500 }
    );
  }
}
