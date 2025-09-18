import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

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
      <body className={`${inter.className} gradient-bg`}>
        <Providers>
          <div className='min-h-screen'>{children}</div>
        </Providers>
      </body>
    </html>
  );
}
