import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/reviews/testimonials - Fetch testimonials for the landing page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20); // Cap at 20 for performance
    const idsParam = searchParams.get('ids');

    let whereClause: any = {
      isApproved: true,
      isPublic: true
    };

    // If specific IDs are provided, filter by those IDs
    if (idsParam) {
      const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        whereClause.id = { in: ids };
      }
    }

    // Get testimonials with customer information
    const testimonials = await prisma.review.findMany({
      where: whereClause,
      include: {
        customer: {
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
      take: limit
    });

    // Format the response
    const formattedTestimonials = testimonials.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      imageUrl: review.imageUrl,
      isVerified: review.isVerified,
      createdAt: review.createdAt,
      customer: {
        name: `${review.customer.firstName} ${review.customer.lastName}`
      }
    }));

    // Set cache headers for 5 minutes
    const response = NextResponse.json({ testimonials: formattedTestimonials });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}
