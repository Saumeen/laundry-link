import prisma from '@/lib/prisma';

// Types for the landing page content
export interface LandingPageContent {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    backgroundImage: string;
    sideImage: string;
  };
  howItWorks: {
    title: string;
    steps: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
  };
  services: {
    title: string;
    items: Array<{
      id: string;
      name: string;
      description: string;
      image: string;
    }>;
  };
  testimonials: {
    title: string;
    displayMode: "auto" | "manual";
    selectedReviewIds: number[];
  };
  whyChooseUs: {
    title: string;
    reasons: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
  };
}

export interface Testimonial {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  customer: {
    name: string;
  };
}

// Default content fallback
const defaultLandingContent: LandingPageContent = {
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

// Fetch landing page content directly from database
export async function getLandingPageContent(): Promise<LandingPageContent> {
  try {
    // Check if database connection is available
    if (!process.env.DATABASE_URL) {
      console.log('No DATABASE_URL found, using default content');
      return defaultLandingContent;
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 3000);
    });

    const queryPromise = prisma.landingPage.findUnique({
      where: { pageName: 'default' }
    });

    const landingPage = await Promise.race([queryPromise, timeoutPromise]);

    if (!landingPage) {
      console.log('No landing page found in database, using default content');
      return defaultLandingContent;
    }

    return landingPage.content as unknown as LandingPageContent;
  } catch (error) {
    console.error('Error fetching landing page content:', error);
    return defaultLandingContent;
  }
}

// Fetch testimonials directly from database
export async function getTestimonials(testimonialsConfig: LandingPageContent['testimonials']): Promise<Testimonial[]> {
  try {
    // Check if database connection is available
    if (!process.env.DATABASE_URL) {
      console.log('No DATABASE_URL found, returning empty testimonials');
      return [];
    }

    let whereClause: any = {
      isApproved: true,
      isPublic: true
    };

    // If specific IDs are provided, filter by those IDs
    if (testimonialsConfig.displayMode === 'manual' && testimonialsConfig.selectedReviewIds.length > 0) {
      whereClause.id = { in: testimonialsConfig.selectedReviewIds };
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 3000);
    });

    const queryPromise = prisma.review.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
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
      },
      take: 6
    });

    const testimonials = await Promise.race([queryPromise, timeoutPromise]);

    // Format the response
    return testimonials.map(review => ({
      id: review.id.toString(),
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerified: review.isVerified,
      createdAt: review.createdAt.toISOString(),
      customer: {
        name: `${review.customer.firstName} ${review.customer.lastName}`
      }
    }));
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}
