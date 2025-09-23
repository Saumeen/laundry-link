import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Review, Customer, Order } from '@prisma/client';
import { requireAdminRole } from '@/lib/adminAuth';

// GET /api/admin/reviews/approved - Fetch approved reviews for admin panel selection
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdminRole('SUPER_ADMIN');

    // Get approved reviews with customer information
    const approvedReviews = await prisma.review.findMany({
      where: {
        isApproved: true,
        isPublic: true
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedReviews = approvedReviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerified: review.isVerified,
      createdAt: review.createdAt,
      customer: {
        id: review.customerId,
        name: `${review.customer.firstName} ${review.customer.lastName.charAt(0)}.`,
        email: review.customer.email
      },
      order: review.order ? {
        id: review.order.id,
        orderNumber: review.order.orderNumber
      } : null
    }));

    return NextResponse.json({ reviews: formattedReviews });
  } catch (error) {
    console.error('Error fetching approved reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approved reviews' },
      { status: 500 }
    );
  }
}
