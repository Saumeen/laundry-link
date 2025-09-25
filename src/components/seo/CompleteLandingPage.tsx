import React from 'react';
import MetaTags from './MetaTags';
import StructuredData from './StructuredData';
import Hero from '@/components/landing/Hero';
import Services from '@/components/landing/Services';
import Testimonials from '@/components/landing/Testimonials';
import WhyChooseUs from '@/components/landing/WhyChooseUs';
import HowItWorks from '@/components/landing/HowItWorks';
import Trust from '@/components/landing/Trust';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

interface LandingPageProps {
  heroContent?: {
    title: string;
    subtitle: string;
    ctaText: string;
    backgroundImage: string;
    sideImage: string;
  };
  servicesContent?: {
    title: string;
    items: Array<{
      id: string;
      name: string;
      description: string;
      image: string;
    }>;
  };
  testimonialsContent?: {
    title: string;
    displayMode: "auto" | "manual";
    selectedReviewIds: number[];
  };
  whyChooseUsContent?: {
    title: string;
    reasons: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
  };
  howItWorksContent?: {
    title: string;
    steps: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
  };
  testimonials?: Array<{
    id: number;
    rating: number;
    title: string | null;
    comment: string;
    isVerified: boolean;
    createdAt: string;
    customer: {
      name: string;
    };
  }>;
  canonicalUrl?: string;
}

const CompleteLandingPage: React.FC<LandingPageProps> = ({
  heroContent,
  servicesContent,
  testimonialsContent,
  whyChooseUsContent,
  howItWorksContent,
  testimonials = [],
  canonicalUrl = 'https://laundrylink.net'
}) => {
  return (
    <>
      {/* SEO Meta Tags */}
      <MetaTags
        title="Laundry Link - Professional Laundry & Dry Cleaning Service in Bahrain | 24 Hour Delivery"
         description="Professional laundry and dry cleaning service in Bahrain. Located in Juffair 341, Road 4101, Building 20, Shop 33. Call +973 33440841 or email info@ovobh.com. Free pickup and delivery, 24-hour service, eco-friendly cleaning."
        keywords="laundry service Bahrain, dry cleaning Bahrain, laundry pickup delivery, express laundry service, professional laundry, eco-friendly laundry, 24 hour laundry service, laundry service Manama, dry cleaning service Bahrain"
        canonical={canonicalUrl}
        ogTitle="Laundry Link - Professional Laundry & Dry Cleaning Service in Bahrain"
         ogDescription="Professional laundry and dry cleaning service in Bahrain. Located in Juffair 341, Road 4101, Building 20, Shop 33. Call +973 33440841 or email info@ovobh.com. Free pickup and delivery, 24-hour service, eco-friendly cleaning."
        ogImage="/laundry-link-main.png"
        ogUrl={canonicalUrl}
        twitterCard="summary_large_image"
        twitterSite="@laundrylinkbh"
        twitterCreator="@laundrylinkbh"
        author="Laundry Link"
        publishedTime={new Date().toISOString()}
        section="Laundry Services"
        tags={["laundry", "dry cleaning", "Bahrain", "pickup", "delivery", "24 hour service", "eco-friendly"]}
        locale="en_US"
        alternateLocales={[
          { locale: "ar", url: `${canonicalUrl}/ar` }
        ]}
      />

      {/* Structured Data */}
      <StructuredData type="LocalBusiness" data={{}} />
      <StructuredData type="Organization" data={{}} />
      
      {/* FAQ Structured Data */}
      <StructuredData 
        type="FAQ" 
        data={{
          faqs: [
            {
              question: "How does Laundry Link's pickup and delivery service work?",
              answer: "Simply book a pickup time through our app or website, and our team will collect your laundry from your location. We clean it professionally and deliver it back within 24 hours."
            },
            {
              question: "What types of laundry services do you offer in Bahrain?",
              answer: "We offer wash & iron, dry cleaning, express service, and bedding & linens cleaning. All services include free pickup and delivery across Bahrain."
            },
            {
              question: "Is Laundry Link's service available 24/7?",
              answer: "Yes, we offer 24-hour service with flexible pickup and delivery times to accommodate your schedule."
            },
            {
              question: "Do you use eco-friendly cleaning methods?",
              answer: "Yes, we use eco-friendly and safe cleaning methods that are gentle on your clothes and the environment."
            }
          ]
        }} 
      />

      {/* Breadcrumb Structured Data */}
      <StructuredData 
        type="BreadcrumbList" 
        data={{
          breadcrumbs: [
            { name: "Home", url: canonicalUrl },
            { name: "Laundry Services", url: `${canonicalUrl}/services` },
            { name: "Professional Laundry Service", url: canonicalUrl }
          ]
        }} 
      />

      {/* Main Content */}
      <main id="main-content">
        <Header />
        
        <Hero content={heroContent || {
          title: "Professional Laundry & Dry Cleaning Service in Bahrain - 24 Hour Delivery",
          subtitle: "Free pickup and delivery service in Bahrain. Professional laundry and dry cleaning with eco-friendly methods.",
          ctaText: "Book Now",
          backgroundImage: "",
          sideImage: ""
        }} />
        
        <HowItWorks content={howItWorksContent || {
          title: "How Our Laundry Service Works",
          steps: [
            {
              id: "1",
              title: "Book Your Pickup",
              description: "Use our app or website to schedule a convenient pickup time that works for you.",
              icon: "schedule"
            },
            {
              id: "2",
              title: "We Collect & Clean",
              description: "Our professional team collects your laundry and treats it with expert care using eco-friendly methods.",
              icon: "local_shipping"
            },
            {
              id: "3",
              title: "Swift Delivery",
              description: "We deliver your fresh, clean clothes back within 24 hours, right to your doorstep.",
              icon: "home"
            }
          ]
        }} />
        
        <Services content={servicesContent || {
          title: "Professional Laundry & Dry Cleaning Services in Bahrain",
          items: [
            {
              id: "1",
              name: "Wash & Iron",
              description: "Professional washing and ironing service for everyday wear with crisp, clean results.",
              image: ""
            },
            {
              id: "2", 
              name: "Dry Cleaning",
              description: "Expert dry cleaning for delicate garments and formal wear with gentle care.",
              image: ""
            },
            {
              id: "3",
              name: "Express Service", 
              description: "Fast 24-hour laundry service for urgent cleaning needs.",
              image: ""
            },
            {
              id: "4",
              name: "Bedding & Linens",
              description: "Fresh, clean and hygienic bedding and household linens service.",
              image: ""
            }
          ]
        }} />
        
        <Testimonials 
          content={testimonialsContent || {
            title: "What Our Customers Say About Our Laundry Service",
            displayMode: "auto",
            selectedReviewIds: []
          }}
          testimonials={testimonials}
        />
        
        <WhyChooseUs content={whyChooseUsContent || {
          title: "Why Choose Laundry Link for Your Laundry Needs?",
          reasons: [
            {
              id: "1",
              title: "Free Collection & Delivery",
              description: "No hidden fees, no hassle. We come to you.",
              icon: "inventory_2"
            },
            {
              id: "2",
              title: "Dedicated Support",
              description: "Our customer service team is always here to help.",
              icon: "headset_mic"
            },
            {
              id: "3",
              title: "Live Order Tracking",
              description: "Stay updated every step of the way with real-time tracking.",
              icon: "notifications_active"
            }
          ]
        }} />
        
        <Trust />
        
        <Footer />
      </main>
    </>
  );
};

export default CompleteLandingPage;
