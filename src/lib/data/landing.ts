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
    image: string;
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
      icon?: string;
      learnMore?: {
        enabled: boolean;
        text: string;
        link: string;
      };
    }>;
  };
  testimonials: {
    title: string;
    displayMode: "auto" | "manual";
    selectedReviewIds: number[];
  };
  trust: {
    title: string;
    subtitle: string;
    stats: Array<{
      id: string;
      icon: string;
      number: string;
      label: string;
    }>;
    indicators: Array<{
      id: string;
      icon: string;
      label: string;
      color: string;
    }>;
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
  id: number;
  rating: number;
  title: string | null;
  comment: string;
  imageUrl: string | null;
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
      { 
        id: "1", 
        name: "Wash & Iron", 
        description: "Crisp and clean everyday wear.", 
        image: "",
        icon: "local_laundry_service",
        learnMore: {
          enabled: true,
          text: "Learn More",
          link: "/services"
        }
      },
      { 
        id: "2", 
        name: "Dry Cleaning", 
        description: "Gentle care for your finest garments.", 
        image: "",
        icon: "dry_cleaning",
        learnMore: {
          enabled: true,
          text: "Learn More",
          link: "/services"
        }
      },
      { 
        id: "3", 
        name: "Express Service", 
        description: "Laundry in a hurry? We've got you.", 
        image: "",
        icon: "bolt",
        learnMore: {
          enabled: true,
          text: "Learn More",
          link: "/services"
        }
      },
      { 
        id: "4", 
        name: "Bedding & Linens", 
        description: "Fresh, clean and hygienic bedding.", 
        image: "",
        icon: "king_bed",
        learnMore: {
          enabled: true,
          text: "Learn More",
          link: "/services"
        }
      }
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

    const content = landingPage.content as unknown as LandingPageContent;
    
    // Ensure trust section exists, merge with defaults if missing
    if (!content.trust) {
      return {
        ...content,
        trust: defaultLandingContent.trust
      };
    }

    return content;
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
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerified: review.isVerified,
      createdAt: review.createdAt.toISOString(),
      imageUrl: review.imageUrl,
      customer: {
        name: `${review.customer.firstName} ${review.customer.lastName}`
      }
    }));
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}
