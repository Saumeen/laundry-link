import type { Metadata } from "next";
import CompleteLandingPage from "@/components/seo/CompleteLandingPage";
import { getLandingPageContent, getTestimonials } from "@/lib/data/landing";

export const metadata: Metadata = {
  title: "Laundry Link Bahrain | 24h Laundry & Dry Cleaning Service",
  description: "Professional laundry & dry cleaning in Bahrain. Free pickup & delivery, 24-hour service, eco-friendly. Located in Juffair. Call +973 33440841",
  keywords: "laundry service Bahrain, dry cleaning Bahrain, laundry pickup delivery, express laundry service, professional laundry, eco-friendly laundry, 24 hour laundry service, laundry service Manama, dry cleaning service Bahrain",
  openGraph: {
    title: "Laundry Link Bahrain | 24h Laundry & Dry Cleaning",
    description: "Professional laundry & dry cleaning in Bahrain. Free pickup & delivery, 24-hour service. Call +973 33440841",
    images: ["/laundry-link-main.png"],
    url: "https://www.laundrylink.net",
    siteName: "Laundry Link",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Laundry Link Bahrain | 24h Laundry & Dry Cleaning",
    description: "Professional laundry & dry cleaning in Bahrain. Free pickup & delivery, 24-hour service. Call +973 33440841",
    images: ["/laundry-link-main.png"],
    creator: "@laundrylinkbh",
    site: "@laundrylinkbh",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Add your actual Google verification code
  },
  alternates: {
    canonical: "https://www.laundrylink.net",
    languages: {
      "en-US": "https://www.laundrylink.net",
      "ar-BH": "https://www.laundrylink.net/ar",
    },
  },
  metadataBase: new URL("https://www.laundrylink.net"),
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// Configure for static generation with revalidation
export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  // Fetch landing page content and testimonials directly from database
  const content = await getLandingPageContent();
  const testimonials = await getTestimonials(content.testimonials);

  return (
    <>
      {/* Font Preconnects for Performance */}
      <link rel="preconnect" href="https://fonts.gstatic.com/" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?display=swap&family=Inter:wght@400;500;700;900&family=Noto+Sans:wght@400;500;700;900"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
      />
      
      {/* Complete Landing Page with SEO, Accessibility & Performance */}
      <CompleteLandingPage 
        heroContent={content.hero}
        servicesContent={content.services}
        testimonialsContent={content.testimonials}
        trustContent={content.trust}
        whyChooseUsContent={content.whyChooseUs}
        howItWorksContent={content.howItWorks}
        testimonials={testimonials}
        canonicalUrl="https://www.laundrylink.net"
      />
    </>
  );
}
