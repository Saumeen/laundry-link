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
      return NextResponse.json({ content: getDefaultContent() });
    }

    const content = landingPage.content as any;
    
    // Ensure trust section exists for backward compatibility
    if (!content.trust) {
      content.trust = {
        title: "Trusted by Our Community in Bahrain",
        subtitle: "See what our customers say and the trust we've built as the leading laundry service in Bahrain",
        stats: [
          { id: "1", icon: "groups", number: "5,000+", label: "Trusted Customers" },
          { id: "2", icon: "local_shipping", number: "30,000+", label: "Pickups Completed" },
          { id: "3", icon: "verified", number: "Efada", label: "Certified Partner" }
        ],
        indicators: [
          { id: "1", icon: "security", label: "Secure & Reliable", color: "green-600" },
          { id: "2", icon: "schedule", label: "24/7 Service", color: "blue-600" },
          { id: "3", icon: "eco", label: "Eco-Friendly", color: "purple-600" }
        ]
      };
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching landing page content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landing page content' },
      { status: 500 }
    );
  }
}

function getDefaultContent() {
  return {
        hero: {
          title: "Laundry & dry cleaning with 24h delivery",
          subtitle: "Free pickup and delivery service in Bahrain",
          ctaText: "Get Started",
          backgroundImage: "",
          sideImage: ""
        },
        howItWorks: {
          title: "How It Works",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgOE90kaFAPm69T9BvHJyq8kOF90vb_vY8GI48t7lPt6okwKyVIhXp0AQvbyY7380sRFaZK1aAff_hP5EkTfDZIvLqbITE2R2joS6m-qcR7F5UT-5WRTfvDJrxqNaU9ynmc0Ny-G_btd4nFF1PprRAEHffArbq4_Ld25xtRKznG6H3suTg9oSBJSFQK7wPIfOJeYwGFOxcmInjx40TU72A3BDyo-eDqDGibNHhNVGbsU7cFNDW7Dzd4TzsNbyaEFhsiE9drbF0rrc",
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
        trust: {
          title: "Trusted by Our Community in Bahrain",
          subtitle: "See what our customers say and the trust we've built as the leading laundry service in Bahrain",
          stats: [
            { id: "1", icon: "groups", number: "5,000+", label: "Trusted Customers" },
            { id: "2", icon: "local_shipping", number: "30,000+", label: "Pickups Completed" },
            { id: "3", icon: "verified", number: "Efada", label: "Certified Partner" }
          ],
          indicators: [
            { id: "1", icon: "security", label: "Secure & Reliable", color: "green-600" },
            { id: "2", icon: "schedule", label: "24/7 Service", color: "blue-600" },
            { id: "3", icon: "eco", label: "Eco-Friendly", color: "purple-600" }
          ]
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
