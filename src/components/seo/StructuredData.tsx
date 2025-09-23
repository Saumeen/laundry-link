import Head from 'next/head';

interface StructuredDataProps {
  type: 'LocalBusiness' | 'Service' | 'Organization' | 'Review' | 'FAQ' | 'BreadcrumbList';
  data: Record<string, any>;
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const getStructuredData = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net';
    
    switch (type) {
      case 'LocalBusiness':
        return {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Laundry Link",
          "description": "Professional laundry and dry cleaning service in Bahrain with free pickup and delivery",
          "url": baseUrl,
           "telephone": "+973 33440841",
           "email": "info@ovobh.com",
           "address": {
             "@type": "PostalAddress",
             "streetAddress": "Juffair 341, Road 4101, Building 20, Shop 33",
             "addressCountry": "BH",
             "addressLocality": "Bahrain",
             "addressRegion": "Bahrain"
           },
           "openingHours": [
             "Sa 09:00-00:00",
             "Su 09:00-00:00",
             "Mo 09:00-00:00",
             "Tu 09:00-00:00", 
             "We 09:00-00:00",
             "Th 09:00-00:00",
             "Fr 10:00-22:00"
           ],
          "serviceArea": {
            "@type": "GeoCircle",
            "geoMidpoint": {
              "@type": "GeoCoordinates",
              "latitude": 26.0667,
              "longitude": 50.5577
            },
            "geoRadius": "50000"
          },
          "priceRange": "$$",
          "paymentAccepted": ["Cash", "Credit Card", "Debit Card", "Digital Wallet"],
          "currenciesAccepted": "BHD",
          "image": `${baseUrl}/laundry-link-main.png`,
          "logo": `${baseUrl}/laundry-link-logo.png`,
          "sameAs": [
            "https://www.facebook.com/laundrylinkbh",
            "https://www.instagram.com/laundrylinkbh",
            "https://www.twitter.com/laundrylinkbh"
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "500",
            "bestRating": "5",
            "worstRating": "1"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Laundry Services",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Wash & Iron",
                  "description": "Professional washing and ironing service"
                }
              },
              {
                "@type": "Offer", 
                "itemOffered": {
                  "@type": "Service",
                  "name": "Dry Cleaning",
                  "description": "Expert dry cleaning for delicate garments"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service", 
                  "name": "Express Service",
                  "description": "Fast 24-hour laundry service"
                }
              }
            ]
          }
        };

      case 'Service':
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": data.name || "Laundry Service",
          "description": data.description || "Professional laundry and dry cleaning service",
          "provider": {
            "@type": "LocalBusiness",
            "name": "Laundry Link",
            "url": baseUrl
          },
          "serviceType": "Laundry Service",
          "areaServed": {
            "@type": "Country",
            "name": "Bahrain"
          },
          "availableChannel": {
            "@type": "ServiceChannel",
            "serviceUrl": `${baseUrl}/customer/schedule`,
            "serviceName": "Online Booking"
          }
        };

      case 'Organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Laundry Link",
          "url": baseUrl,
          "logo": `${baseUrl}/laundry-link-logo.png`,
          "description": "Professional laundry and dry cleaning service in Bahrain",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "BH",
            "addressLocality": "Bahrain"
          },
           "contactPoint": {
             "@type": "ContactPoint",
             "telephone": "+973 33440841",
             "contactType": "customer service",
             "availableLanguage": ["English", "Arabic"]
           },
          "sameAs": [
            "https://www.facebook.com/laundrylinkbh",
            "https://www.instagram.com/laundrylinkbh",
            "https://www.twitter.com/laundrylinkbh"
          ]
        };

      case 'Review':
        return {
          "@context": "https://schema.org",
          "@type": "Review",
          "itemReviewed": {
            "@type": "LocalBusiness",
            "name": "Laundry Link"
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": data.rating || "5",
            "bestRating": "5",
            "worstRating": "1"
          },
          "author": {
            "@type": "Person",
            "name": data.author || "Customer"
          },
          "reviewBody": data.reviewBody || "Excellent laundry service!",
          "datePublished": data.datePublished || new Date().toISOString()
        };

      case 'FAQ':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": data.faqs?.map((faq: any) => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          })) || []
        };

      case 'BreadcrumbList':
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": data.breadcrumbs?.map((breadcrumb: any, index: number) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": breadcrumb.name,
            "item": breadcrumb.url
          })) || []
        };

      default:
        return {};
    }
  };

  const structuredData = getStructuredData();

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData, null, 2)
        }}
      />
    </Head>
  );
};

export default StructuredData;
