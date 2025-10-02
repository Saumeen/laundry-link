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

    // Transform reviews to include combined name field
    const transformedReviews = reviews.map(review => ({
      ...review,
      customer: {
        ...review.customer,
        name: `${review.customer.firstName} ${review.customer.lastName}`.trim()
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

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { email: customerEmail }
    });

    if (!customer) {
      // Create a new customer for the testimonial
      const [firstName, ...lastNameParts] = customerName.split(' ');
      customer = await prisma.customer.create({
        data: {
          firstName,
          lastName: lastNameParts.join(' ') || '',
          email: customerEmail,
          phone: '', // Admin-created testimonials might not have phone
          isActive: true
        }
      });
    }

    // Find order if orderNumber is provided
    let order = null;
    if (orderNumber) {
      order = await prisma.order.findUnique({
        where: { orderNumber }
      });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        customerId: customer.id,
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
      }
    });

    // Transform review to include combined name field
    const transformedReview = {
      ...review,
      customer: {
        ...review.customer,
        name: `${review.customer.firstName} ${review.customer.lastName}`.trim()
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
