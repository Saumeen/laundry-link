import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Laundry Link - Professional Laundry Service in Bahrain',
    short_name: 'Laundry Link',
    description: 'Professional laundry and dry cleaning service in Bahrain with free pickup and delivery. 24-hour service, eco-friendly cleaning.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a28c2',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    dir: 'ltr',
    categories: ['lifestyle', 'utilities', 'business'],
    icons: [
      {
        src: '/laundry-link-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/laundry-link-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    screenshots: [
      {
        src: '/laundry-link-main.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Laundry Link Homepage'
      }
    ],
    shortcuts: [
      {
        name: 'Schedule Pickup',
        short_name: 'Schedule',
        description: 'Book a laundry pickup',
        url: '/customer/schedule',
        icons: [
          {
            src: '/laundry-link-logo.png',
            sizes: '192x192'
          }
        ]
      },
      {
        name: 'Track Order',
        short_name: 'Track',
        description: 'Track your laundry order',
        url: '/tracking',
        icons: [
          {
            src: '/laundry-link-logo.png',
            sizes: '192x192'
          }
        ]
      }
    ]
  }
}

