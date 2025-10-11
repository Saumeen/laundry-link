import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// PUT - Update a specific review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reviewId = parseInt(id);
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
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
    if (!customerName || !customerEmail || !comment) {
      return NextResponse.json({ 
        error: 'Customer name, email, and comment are required' 
      }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { order: true }
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Find order if orderNumber is provided
    let order = null;
    if (orderNumber) {
      order = await prisma.order.findFirst({
        where: { orderNumber }
      });
    }

    // Update the review with direct customer fields
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        customerName,
        customerEmail,
        orderId: order?.id || null,
        rating,
        title: title || null,
        comment,
        imageUrl: imageUrl || null,
        isVerified,
        isApproved: true, // Keep it approved
        isPublic: true, // Keep it public
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    // Transform review to include customer object for backward compatibility
    const transformedReview = {
      ...updatedReview,
      customer: {
        name: updatedReview.customerName,
        email: updatedReview.customerEmail
      }
    };

    return NextResponse.json({
      message: 'Review updated successfully',
      review: transformedReview
    });

  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a specific review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reviewId = parseInt(id);
    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId }
    });

    return NextResponse.json({
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
