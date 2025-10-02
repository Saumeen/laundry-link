import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET - Fetch approved reviews for testimonials management
export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const search = searchParams.get('search') || '';
    const rating = searchParams.get('rating');
    const sortBy = searchParams.get('sortBy') || 'newest';

    // Build where clause
    const whereClause: any = {
      isApproved: true,
      isPublic: true
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { customer: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    // Add rating filter
    if (rating && rating !== 'all') {
      whereClause.rating = parseInt(rating);
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'name':
        orderBy = { customer: { firstName: 'asc' } };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Get total count for pagination
    const totalCount = await prisma.review.count({ where: whereClause });

    // Get paginated reviews
    const reviews = await prisma.review.findMany({
      where: whereClause,
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
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Transform reviews to include combined name field
    const transformedReviews = reviews.map(review => ({
      ...review,
      customer: {
        ...review.customer,
        name: `${review.customer.firstName} ${review.customer.lastName}`.trim()
      }
    }));

    return NextResponse.json({ 
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching approved reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch approved reviews' }, { status: 500 });
  }
}