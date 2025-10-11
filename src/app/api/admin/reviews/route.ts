import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// GET - Fetch all reviews for admin management
export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      include: {
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

    // Transform reviews to include customer object for backward compatibility
    const transformedReviews = reviews.map(review => ({
      ...review,
      customer: {
        name: review.customerName,
        email: review.customerEmail
      }
    }));

    return NextResponse.json({ reviews: transformedReviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST - Create a new review/testimonial as admin
export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      customerName: string;
      customerEmail: string;
      rating: number;
      title?: string;
      comment: string;
      imageUrl?: string;
      isVerified?: boolean;
      orderNumber?: string;
    };
    
    const { 
      customerName, 
      customerEmail, 
      rating, 
      title, 
      comment, 
      imageUrl = null,
      isVerified = false, 
      orderNumber = null 
    } = body;

    // Validate required fields
    if (!customerName || !customerEmail || !rating || !comment) {
      return NextResponse.json({ 
        error: 'Missing required fields: customerName, customerEmail, rating, comment' 
      }, { status: 400 });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }

    // Find order if orderNumber is provided
    let order = null;
    if (orderNumber) {
      order = await prisma.order.findUnique({
        where: { orderNumber }
      });
    }

    // Create the review with direct customer fields
    const review = await prisma.review.create({
      data: {
        customerName,
        customerEmail,
        orderId: order?.id,
        rating,
        title: title || null,
        comment,
        imageUrl: imageUrl || null,
        isVerified,
        isApproved: true, // Admin-created reviews are auto-approved
        isPublic: true
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true
          }
        }
      }
    });

    // Transform review to include customer object for backward compatibility
    const transformedReview = {
      ...review,
      customer: {
        name: review.customerName,
        email: review.customerEmail
      }
    };

    return NextResponse.json({ 
      review: transformedReview,
      message: 'Testimonial created successfully' 
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
