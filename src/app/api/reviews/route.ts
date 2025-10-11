import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/reviews - Get all approved public reviews for display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const reviews = await prisma.review.findMany({
      where: {
        isApproved: true,
        isPublic: true,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Transform reviews to include customer object for backward compatibility
    const transformedReviews = reviews.map(review => ({
      ...review,
      customer: {
        name: review.customerName,
        email: review.customerEmail
      }
    }));

    // Get total count for pagination
    const totalCount = await prisma.review.count({
      where: {
        isApproved: true,
        isPublic: true,
      },
    });

    return NextResponse.json({
      reviews: transformedReviews,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
