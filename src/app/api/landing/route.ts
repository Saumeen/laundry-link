import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/landing - Fetch landing page content for public viewing with caching
export async function GET(request: NextRequest) {
  try {
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

    // Set cache headers for 60 seconds
    const response = NextResponse.json({ content: landingPage.content });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    console.error('Error fetching landing page content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landing page content' },
      { status: 500 }
    );
  }
}
