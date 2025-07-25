import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';
import { ProcessingStatus, OrderStatus } from '@prisma/client';

// GET - Fetch orders ready for facility team processing
export async function GET(req: Request) {
  try {
    await requireAuthenticatedAdmin();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause based on status
    const whereClause: {
      OR?: Array<Record<string, unknown>>;
      AND?: Array<Record<string, unknown>>;
    } = {
      // Show orders that have been picked up by driver (PICKUP_COMPLETED status)
      // OR orders that are already at the facility
      OR: [
        {
          status: OrderStatus.PICKUP_COMPLETED,
        },
        {
          status: {
            in: [
              OrderStatus.RECEIVED_AT_FACILITY,
              OrderStatus.PROCESSING_STARTED,
              OrderStatus.PROCESSING_COMPLETED,
              OrderStatus.QUALITY_CHECK,
              OrderStatus.READY_FOR_DELIVERY,
            ],
          },
        },
      ],
    };

    // Filter by processing status if specified
    if (status !== 'all') {
      if (status === 'picked_up') {
        whereClause.AND = [
          {
            status: OrderStatus.PICKUP_COMPLETED,
            orderProcessing: null, // No processing record exists yet
          },
        ];
      } else if (status === 'received') {
        whereClause.AND = [
          {
            status: OrderStatus.RECEIVED_AT_FACILITY,
            orderProcessing: null, // No processing record exists yet
          },
        ];
      } else if (status === 'ready_for_processing') {
        whereClause.AND = [
          {
            status: OrderStatus.RECEIVED_AT_FACILITY,
            orderProcessing: null, // No processing record exists
          },
        ];
      } else if (status === 'in_processing') {
        whereClause.AND = [
          {
            orderProcessing: {
              processingStatus: {
                in: [ProcessingStatus.PENDING, ProcessingStatus.IN_PROGRESS],
              },
            },
          },
        ];
      } else if (status === 'ready_for_delivery') {
        whereClause.AND = [
          {
            orderProcessing: {
              processingStatus: ProcessingStatus.READY_FOR_DELIVERY,
            },
          },
        ];
      } else if (status === 'completed') {
        whereClause.AND = [
          {
            orderProcessing: {
              processingStatus: ProcessingStatus.READY_FOR_DELIVERY,
            },
          },
        ];
      } else if (status === 'processing_completed') {
        whereClause.AND = [
          {
            status: OrderStatus.PROCESSING_COMPLETED,
          },
        ];
      } else if (status === 'quality_check') {
        whereClause.AND = [
          {
            orderProcessing: {
              processingStatus: OrderStatus.QUALITY_CHECK,
            },
          },
        ];
      } else if (status === 'issue_reported') {
        whereClause.AND = [
          {
            orderProcessing: {
              processingStatus: ProcessingStatus.ISSUE_REPORTED,
            },
          },
        ];
      }
    }

    // Add search functionality
    if (search) {
      const searchClause = {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customerFirstName: { contains: search, mode: 'insensitive' } },
          { customerLastName: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
        ],
      };

      if (whereClause.AND) {
        whereClause.AND.push(searchClause);
      } else {
        whereClause.AND = [searchClause];
      }
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          orderServiceMappings: {
            include: {
              service: true,
              orderItems: true, // Include individual order items
            },
          },
          orderProcessing: {
            include: {
              staff: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              processingItems: {
                include: {
                  orderServiceMapping: {
                    include: {
                      service: true,
                      orderItems: true, // Include order items
                    },
                  },
                  processingItemDetails: {
                    include: {
                      orderItem: true, // Include order item details
                    },
                  },
                },
              },
              issueReports: {
                include: {
                  staff: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          driverAssignments: {
            where: {
              assignmentType: 'pickup',
            },
            include: {
              driver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          pickupStartTime: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
