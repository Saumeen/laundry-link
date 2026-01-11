import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Providers from './providers';
import { SpeedInsights } from '@vercel/speed-insights/next';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.laundrylink.net'),
  title: {
    default: 'Laundry Link Bahrain | Professional Laundry & Dry Cleaning Service',
    template: '%s | Laundry Link Bahrain'
  },
  description: 'Professional laundry & dry cleaning in Bahrain. Free pickup & delivery, 24-hour service, eco-friendly cleaning. Call +973 33440841',
  keywords: ['laundry service Bahrain', 'dry cleaning Bahrain', 'laundry pickup delivery', 'express laundry', 'professional laundry', 'eco-friendly laundry', '24 hour laundry service', 'laundry Manama', 'dry cleaning service'],
  authors: [{ name: 'Laundry Link' }],
  creator: 'Laundry Link',
  publisher: 'Laundry Link',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.laundrylink.net',
    title: 'Laundry Link Bahrain | Professional Laundry & Dry Cleaning',
    description: 'Professional laundry & dry cleaning in Bahrain. Free pickup & delivery, 24-hour service. Call +973 33440841',
    siteName: 'Laundry Link',
    images: [
      {
        url: '/laundry-link-main.png',
        width: 1200,
        height: 630,
        alt: 'Laundry Link - Professional Laundry Service in Bahrain',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Laundry Link Bahrain | Professional Laundry & Dry Cleaning',
    description: 'Professional laundry & dry cleaning in Bahrain. Free pickup & delivery, 24-hour service.',
    images: ['/laundry-link-main.png'],
    creator: '@laundrylinkbh',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' }
    ],
    shortcut: '/favicon-32x32.png',
    apple: '/apple-icon',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://www.laundrylink.net',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-icon" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-NTLD2LRFZF"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-NTLD2LRFZF');
</script>
      <body className={`${inter.className} gradient-bg`}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17645502549"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17645502549');
          `}
        </Script>
        
        <Providers>
          <div className='min-h-screen'>{children}</div>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
