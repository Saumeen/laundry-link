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
    description?: string;
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

export interface ApprovedReview {
  id: number;
  rating: number;
  title: string | null;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  order: {
    id: number;
    orderNumber: string;
  } | null;
}

export interface NewTestimonial {
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  orderNumber?: string;
}

