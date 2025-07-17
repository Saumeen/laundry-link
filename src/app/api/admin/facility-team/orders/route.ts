import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

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
    let whereClause: any = {
      // Only show orders that have been picked up by driver
      driverAssignments: {
        some: {
          assignmentType: 'pickup',
          status: 'completed'
        }
      }
    };

    // Filter by processing status if specified
    if (status !== 'all') {
      if (status === 'ready_for_processing') {
        whereClause.orderProcessing = null; // No processing record exists
      } else if (status === 'in_processing') {
        whereClause.orderProcessing = {
          processingStatus: {
            in: ['pending', 'in_progress']
          }
        };
      } else if (status === 'completed') {
        whereClause.orderProcessing = {
          processingStatus: 'ready_for_delivery'
        };
      }
    }

    // Add search functionality
    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerFirstName: { contains: search, mode: 'insensitive' } },
        { customerLastName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } }
      ];
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
              phone: true
            }
          },
          orderServiceMappings: {
            include: {
              service: true,
              orderItems: true // Include individual order items
            }
          },
          orderProcessing: {
            include: {
              staff: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              },
              processingItems: {
                include: {
                  orderServiceMapping: {
                    include: {
                      service: true,
                      orderItems: true // Include order items
                    }
                  },
                  processingItemDetails: {
                    include: {
                      orderItem: true // Include order item details
                    }
                  }
                }
              },
              issueReports: {
                include: {
                  staff: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          },
          driverAssignments: {
            where: {
              assignmentType: 'pickup'
            },
            include: {
              driver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          pickupTime: 'asc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({
        where: whereClause
      })
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching facility team orders:", error || 'Unknown error');
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
} 