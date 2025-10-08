# SEO Best Practices - Laundry Link

## Quick Reference Guide for Developers

### Page Title Guidelines

**Format:**
```
Primary Keyword | Brand Name
```

**Rules:**
- Keep under 60 characters (580 pixels)
- Include primary keyword at the start
- Make it unique for each page
- Avoid keyword stuffing

**Examples:**
✅ Good: `Laundry Services Bahrain | Laundry Link`  
❌ Bad: `Laundry Link - Professional Laundry & Dry Cleaning Service in Bahrain with Free Pickup and Delivery`

### Meta Description Guidelines

**Format:**
```
Action-oriented description with primary keywords, USPs, and CTA
```

**Rules:**
- Keep under 155 characters (1000 pixels)
- Include primary keyword naturally
- Add unique selling points
- Include call-to-action
- Make it compelling

**Examples:**
✅ Good: `Professional laundry & dry cleaning in Bahrain. Free pickup & delivery, 24-hour service. Call +973 33440841`  
❌ Bad: `Professional laundry and dry cleaning service in Bahrain. Located in Juffair 341, Road 4101, Building 20, Shop 33. Call +973 33440841 or email info@ovobh.com...`

### Image Optimization Checklist

#### Alt Text Best Practices
```typescript
// ❌ Bad - Too generic
<Image src="/logo.png" alt="logo" />

// ✅ Good - Descriptive and keyword-rich
<Image 
  src="/logo.png" 
  alt="Laundry Link - Professional Laundry Service in Bahrain" 
/>

// ✅ Better - Context-specific
<Image 
  src="/service-image.jpg" 
  alt="Wash and Iron service - Professional shirt ironing in Bahrain" 
/>
```

#### Image Performance
```typescript
// For above-the-fold images (hero, logo)
<Image 
  src="/hero.jpg"
  alt="..."
  priority={true}  // Disable lazy loading
  loading="eager"   // Load immediately
/>

// For below-the-fold images
<Image 
  src="/service.jpg"
  alt="..."
  loading="lazy"    // Default, enable lazy loading
  sizes="(max-width: 768px) 100vw, 50vw"  // Responsive sizes
/>
```

### Structured Data (Schema.org)

#### Required for Each Page Type

**Homepage:**
- LocalBusiness schema
- Organization schema
- BreadcrumbList schema

**Service Pages:**
- Service schema
- FAQ schema
- AggregateRating schema

**Product/Pricing Pages:**
- Offer schema
- Product schema

**Article/Blog Pages:**
- Article schema
- Author schema
- Publisher schema

### URL Structure Best Practices

#### Clean URLs
```
✅ Good: /services/dry-cleaning
✅ Good: /pricing/wash-and-iron
❌ Bad: /page?id=123&category=services
❌ Bad: /services_page_final_v2
```

#### Canonical URLs
```typescript
// Always set canonical URL
export const metadata = {
  alternates: {
    canonical: 'https://www.laundrylink.net/services'
  }
}
```

### Internal Linking Strategy

#### Anchor Text Guidelines
```html
<!-- ❌ Bad - Generic -->
<a href="/services">Click here</a>

<!-- ✅ Good - Descriptive -->
<a href="/services">Professional Laundry Services in Bahrain</a>

<!-- ✅ Better - Contextual -->
<a href="/services/dry-cleaning">Dry Cleaning Services</a>
```

#### Link Distribution
- Homepage should link to all main sections
- Service pages should cross-link related services
- Blog posts should link to relevant service pages
- Footer should contain important page links

### Mobile SEO Checklist

- [ ] Responsive design for all devices
- [ ] Touch targets minimum 48x48 pixels
- [ ] No horizontal scrolling
- [ ] Fast loading (< 3 seconds)
- [ ] Readable font sizes (minimum 16px)
- [ ] Viewport meta tag configured
- [ ] Mobile-friendly navigation

### Core Web Vitals Targets

| Metric | Target | Current |
|--------|--------|---------|
| LCP (Largest Contentful Paint) | < 2.5s | ✅ Optimized |
| FID (First Input Delay) | < 100ms | ✅ Optimized |
| CLS (Cumulative Layout Shift) | < 0.1 | ✅ Optimized |
| FCP (First Contentful Paint) | < 1.8s | ✅ Optimized |
| TTI (Time to Interactive) | < 3.8s | ✅ Optimized |

### Content SEO Guidelines

#### Keyword Placement Hierarchy
1. **Page Title** (H1) - Include primary keyword
2. **First 100 words** - Use primary keyword naturally
3. **Headings** (H2, H3) - Use variations and related keywords
4. **Image Alt Text** - Describe with keywords
5. **Meta Description** - Include primary keyword
6. **URL** - Use keyword-rich slug

#### Content Structure
```html
<main>
  <h1>Primary Keyword (Only one H1 per page)</h1>
  
  <section>
    <h2>Secondary Keyword or Topic</h2>
    <p>Content with natural keyword usage...</p>
  </section>
  
  <section>
    <h2>Related Topic</h2>
    <h3>Subtopic</h3>
    <p>More detailed content...</p>
  </section>
</main>
```

### Technical SEO Checklist

#### Every New Page Must Have:
- [ ] Unique title tag
- [ ] Unique meta description
- [ ] Canonical URL
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Structured data (where applicable)
- [ ] Optimized images with alt text
- [ ] Mobile-responsive design
- [ ] Fast loading time
- [ ] Proper heading hierarchy
- [ ] Internal links

#### Configuration Files to Update:
- [ ] `sitemap.ts` - Add new page URL
- [ ] `robots.ts` - Configure crawl rules (if needed)
- [ ] Structured data - Add relevant schemas

### Performance Optimization

#### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Descriptive alt text"
  width={800}
  height={600}
  quality={85}  // 75-85 is optimal
  format="webp" // Use modern formats
  placeholder="blur" // Show placeholder while loading
/>
```

#### Font Optimization
```typescript
// Use next/font for optimal font loading
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',  // Prevent invisible text
  preload: true     // Preload font
})
```

#### JavaScript Optimization
- Use dynamic imports for code splitting
- Defer non-critical scripts
- Minimize third-party scripts
- Use React Server Components when possible

### Local SEO Optimization

#### Google My Business
- Complete profile with all information
- Add business hours
- Upload high-quality photos
- Encourage customer reviews
- Respond to all reviews
- Post regular updates

#### Local Citations
Ensure NAP (Name, Address, Phone) consistency across:
- Google My Business
- Bing Places
- Apple Maps
- Local directories
- Social media profiles
- Website footer

#### Local Keywords
Target location-specific keywords:
- "laundry service Bahrain"
- "dry cleaning Juffair"
- "laundry pickup Manama"
- "24 hour laundry service Bahrain"

### Schema Markup Templates

#### LocalBusiness (Homepage)
```typescript
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Laundry Link",
  "image": "https://www.laundrylink.net/logo.png",
  "@id": "https://www.laundrylink.net",
  "url": "https://www.laundrylink.net",
  "telephone": "+973-33440841",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Juffair 341, Road 4101, Building 20",
    "addressLocality": "Juffair",
    "addressCountry": "BH"
  },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday", "Sunday"],
    "opens": "09:00",
    "closes": "00:00"
  }],
  "sameAs": [
    "https://www.facebook.com/laundrylinkbh",
    "https://www.instagram.com/laundrylinkbh"
  ]
}
```

#### FAQ Schema
```typescript
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How does Laundry Link's pickup service work?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Simply book a pickup time through our app or website..."
    }
  }]
}
```

### Security Headers for SEO

```typescript
// next.config.ts
const nextConfig = {
  poweredByHeader: false, // Remove X-Powered-By
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ],
      },
    ]
  },
}
```

### Monitoring & Analytics

#### Tools to Use
1. **Google Search Console** - Monitor search performance
2. **Google Analytics 4** - Track user behavior
3. **PageSpeed Insights** - Check performance
4. **Lighthouse** - Audit quality
5. **Schema Markup Validator** - Test structured data

#### Key Metrics to Track
- Organic traffic
- Keyword rankings
- Click-through rate (CTR)
- Bounce rate
- Average session duration
- Conversion rate
- Core Web Vitals
- Crawl errors

### SEO Workflow for New Pages

1. **Keyword Research**
   - Identify target keywords
   - Analyze competition
   - Choose primary and secondary keywords

2. **Content Creation**
   - Write unique, valuable content
   - Use keywords naturally
   - Include multimedia (images, videos)
   - Add internal links

3. **On-Page Optimization**
   - Optimize title and meta description
   - Add structured data
   - Optimize images
   - Set canonical URL
   - Configure social meta tags

4. **Technical Setup**
   - Add to sitemap
   - Configure robots.txt (if needed)
   - Test mobile responsiveness
   - Check page speed

5. **Post-Launch**
   - Submit to Google Search Console
   - Monitor performance
   - Gather analytics
   - Iterate and improve

### Common SEO Mistakes to Avoid

❌ **Don't:**
- Duplicate content across pages
- Stuff keywords unnaturally
- Use generic alt text ("image", "photo")
- Ignore mobile optimization
- Have slow loading pages
- Use Flash or iframes
- Hide text or links
- Buy backlinks
- Neglect structured data
- Forget to update sitemap

✅ **Do:**
- Create unique, valuable content
- Use keywords naturally
- Write descriptive alt text
- Optimize for mobile first
- Ensure fast loading (< 3s)
- Use modern web technologies
- Make all content visible
- Earn quality backlinks
- Implement structured data
- Keep sitemap updated

### Emergency SEO Checklist

If traffic drops suddenly, check:
- [ ] Google Search Console for manual actions
- [ ] Crawl errors or indexing issues
- [ ] Site is accessible and loading
- [ ] Robots.txt not blocking important pages
- [ ] Canonical tags pointing correctly
- [ ] No duplicate content issues
- [ ] HTTPS certificate is valid
- [ ] Core Web Vitals scores
- [ ] Mobile usability issues
- [ ] Broken links or 404 errors

---

## Quick Commands for Developers

### Check SEO Locally
```bash
# Run Lighthouse audit
npm run lighthouse

# Check for broken links
npm run check-links

# Validate structured data
npm run validate-schema
```

### Pre-deployment Checklist
- [ ] Run Lighthouse audit (score > 90 for all categories)
- [ ] Test on mobile devices
- [ ] Verify all images have alt text
- [ ] Check meta tags are unique
- [ ] Validate structured data
- [ ] Update sitemap
- [ ] Test canonical URLs
- [ ] Verify robots.txt

---

**Last Updated:** October 8, 2025  
**Version:** 1.0

