import Head from 'next/head';

interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  alternateLocales?: Array<{ locale: string; url: string }>;
}

const MetaTags: React.FC<MetaTagsProps> = ({
  title = "Laundry Link - Professional Laundry & Dry Cleaning Service in Bahrain",
  description = "Professional laundry and dry cleaning service in Bahrain. Located in Juffair 341, Road 4101, Building 20, Shop 33. Call +973 33440841 or email info@ovobh.com. Free pickup and delivery, 24-hour service, eco-friendly cleaning.",
  keywords = "laundry service Bahrain, dry cleaning Bahrain, laundry pickup delivery, express laundry service, professional laundry, eco-friendly laundry, 24 hour laundry service",
  canonical,
  ogTitle,
  ogDescription,
  ogImage = "/laundry-link-main.png",
  ogUrl,
  twitterCard = "summary_large_image",
  twitterSite = "@laundrylinkbh",
  twitterCreator = "@laundrylinkbh",
  robots = "index, follow",
  author = "Laundry Link",
  publishedTime,
  modifiedTime,
  section = "Services",
  tags = ["laundry", "dry cleaning", "Bahrain", "pickup", "delivery"],
  locale = "en_US",
  alternateLocales = []
}) => {
  const fullTitle = title.includes('Laundry Link') ? title : `${title} | Laundry Link`;
  const fullOgTitle = ogTitle || fullTitle;
  const fullOgDescription = ogDescription || description;
  const fullOgUrl = ogUrl || canonical || '';

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robots} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Language and Locale */}
      <meta property="og:locale" content={locale} />
      <html lang="en" />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullOgTitle} />
      <meta property="og:description" content={fullOgDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={fullOgUrl} />
      <meta property="og:site_name" content="Laundry Link" />
      
      {/* Article specific tags */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      <meta property="article:section" content={section} />
      {tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:title" content={fullOgTitle} />
      <meta name="twitter:description" content={fullOgDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#1a28c2" />
      <meta name="msapplication-TileColor" content="#1a28c2" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Laundry Link" />
      
      {/* Alternate Language Versions */}
      {alternateLocales.map((alt, index) => (
        <link key={index} rel="alternate" hrefLang={alt.locale} href={alt.url} />
      ))}
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://lh3.googleusercontent.com" />
      <link rel="preconnect" href="https://images.unsplash.com" />
      
      {/* DNS Prefetch for performance */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
    </Head>
  );
};

export default MetaTags;
