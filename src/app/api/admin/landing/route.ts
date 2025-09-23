import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminRole } from '@/lib/adminAuth';
import { processContentImages } from '@/lib/vercel-blob';

// GET /api/admin/landing - Retrieve landing page content for admin panel
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdminRole('SUPER_ADMIN');

    // Get landing page content
    const landingPage = await prisma.landingPage.findUnique({
      where: { pageName: 'default' }
    });

    if (!landingPage) {
      // Return default content structure if no landing page exists
      const defaultContent = {
        hero: {
          title: "Laundry & dry cleaning with 24h delivery",
          subtitle: "Free pickup and delivery service in Bahrain",
          ctaText: "Get Started",
          backgroundImage: "",
          sideImage: ""
        },
        howItWorks: {
          title: "How It Works",
          steps: [
            { id: "1", title: "Book Your Pickup", description: "Use our app or website to schedule a convenient pickup time.", icon: "schedule" },
            { id: "2", title: "We Collect & Clean", description: "Our team collects your laundry and treats it with expert care.", icon: "local_shipping" },
            { id: "3", title: "Swift Delivery", description: "We deliver your fresh, clean clothes back within 24 hours.", icon: "home" }
          ]
        },
        services: {
          title: "Our Services",
          items: [
            { id: "1", name: "Wash & Iron", description: "Crisp and clean everyday wear.", image: "" },
            { id: "2", name: "Dry Cleaning", description: "Gentle care for your finest garments.", image: "" },
            { id: "3", name: "Express Service", description: "Laundry in a hurry? We've got you.", image: "" },
            { id: "4", name: "Bedding & Linens", description: "Fresh, clean and hygienic bedding.", image: "" }
          ]
        },
        testimonials: {
          title: "What Our Customers Say",
          displayMode: "auto",
          selectedReviewIds: []
        },
        whyChooseUs: {
          title: "Why Choose Us?",
          reasons: [
            { id: "1", title: "Free Collection & Delivery", description: "No hidden fees, no hassle.", icon: "inventory_2" },
            { id: "2", title: "Dedicated Support", description: "Our team is always here to help.", icon: "headset_mic" },
            { id: "3", title: "Live Order Tracking", description: "Stay updated every step of the way.", icon: "notifications_active" }
          ]
        }
      };

      return NextResponse.json({ content: defaultContent });
    }

    return NextResponse.json({ content: landingPage.content });
  } catch (error) {
    console.error('Error fetching landing page content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landing page content' },
      { status: 500 }
    );
  }
}

// POST /api/admin/landing - Create or update landing page content
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdminRole('SUPER_ADMIN');

    const { content } = await request.json() as { content: any };

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Process and upload any base64 images to Vercel Blob Storage
    const processedContent = await processContentImages(content);

    // Upsert landing page content
    const landingPage = await prisma.landingPage.upsert({
      where: { pageName: 'default' },
      update: { content: processedContent },
      create: {
        pageName: 'default',
        content: processedContent
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Landing page content updated successfully',
      data: landingPage 
    });
  } catch (error) {
    console.error('Error updating landing page content:', error);
    return NextResponse.json(
      { error: 'Failed to update landing page content' },
      { status: 500 }
    );
  }
}
