import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { SpeedInsights } from '@vercel/speed-insights/next';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Laundry Link',
  description: 'Schedule laundry pickup and delivery with real-time tracking',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className={`${inter.className} gradient-bg`}>
        <Providers>
          <div className='min-h-screen'>{children}</div>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
