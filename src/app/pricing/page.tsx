'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '@/components/layouts/main-layout';
import logger from '@/lib/logger';

// Define types for the API response
interface PricingItem {
  id: number;
  name: string;
  displayName: string;
  price: number;
  sortOrder: number;
  isActive: boolean;
}

interface PricingCategory {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  items: PricingItem[];
}

interface PricingHeader {
  id: number;
  title: string;
  subtitle?: string;
  subtitleAr?: string;
  priceListTitle?: string;
  priceListTitleAr?: string;
  contactInfo?: string;
  isActive: boolean;
}

interface PricingData {
  header: PricingHeader;
  categories: PricingCategory[];
}

export default function PricingPage() {
  const [pricingData, setPricingData] = useState<PricingData>({
    header: {
      id: 1,
      title: 'Laundry Link',
      subtitle: 'NORMAL SERVICE (24HRS)',
      subtitleAr: 'الخدمة العادية (٢٤ ساعة)',
      priceListTitle: 'PRICE LIST',
      priceListTitleAr: 'قائمة الأسعار',
      contactInfo: 'TEL: +973 33440841',
      isActive: true,
    },
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getPricingData() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching pricing data...');
        const response = await fetch('/api/pricing');

        if (!response.ok) {
          console.error('API Response not OK:', response.status, response.statusText);
          throw new Error(`Failed to fetch pricing data: ${response.status} - ${response.statusText}`);
        }

        const result = (await response.json()) as {
          success: boolean;
          data: PricingData;
        };
        
        if (result.success) {
          setPricingData(result.data);
        } else {
          throw new Error('API returned unsuccessful response');
        }
      } catch (error) {
        logger.error('Error fetching pricing data:', error);
        console.error('Pricing API error:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch pricing data');
        // Keep fallback data
      } finally {
        setLoading(false);
      }
    }

    getPricingData();
  }, []);

  const { header, categories } = pricingData;

  if (loading) {
    return (
      <MainLayout>
        <div className='bg-gradient-to-br from-blue-50 to-indigo-100 py-12'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-[#1a28c2] mx-auto'></div>
              <p className='mt-4 text-lg text-[#1f6cc7]'>Loading pricing information...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className='bg-gradient-to-br from-blue-50 to-indigo-100 py-12'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center'>
              <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
                <p className='font-bold'>Error loading pricing data</p>
                <p className='text-sm'>{error}</p>
              </div>
              <p className='text-gray-600'>Showing fallback pricing information.</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='bg-gradient-to-br from-blue-50 to-indigo-100 py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h1 className='text-3xl font-extrabold text-[#1a28c2] sm:text-4xl brand-name'>
              {header.title}
            </h1>
            {header.subtitle && (
              <p className='mt-3 max-w-2xl mx-auto text-xl text-[#1f6cc7] sm:mt-4'>
                {header.subtitle}
              </p>
            )}
            {header.subtitleAr && (
              <p className='mt-1 max-w-2xl mx-auto text-lg text-[#1f6cc7] sm:mt-2 mb-8'>
                {header.subtitleAr}
              </p>
            )}
            {header.priceListTitle && (
              <h2 className='text-3xl font-extrabold text-[#1a28c2] sm:text-4xl mb-8 brand-name'>
                {header.priceListTitle}
              </h2>
            )}
            {header.priceListTitleAr && (
              <p className='text-2xl text-[#1a28c2] mb-12'>
                {header.priceListTitleAr}
              </p>
            )}
          </div>

          {/* Full price list image for mobile */}
          <div className='md:hidden mb-8'>
            <Image
              src='/images/pricing/price_list.jpg'
              alt='Laundry Link complete price list showing laundry and dry cleaning services in Bahrain with rates for washing, ironing, dry cleaning, and bedding services'
              width={800}
              height={1200}
              className='rounded-lg shadow-lg mx-auto'
            />
          </div>

          {/* Detailed price tables for desktop */}
          <div className='hidden md:block'>
            {categories.length > 0 && (
              <>
                {/* First row - IRON/PRESS and WASH AND IRON */}
                <div className='grid grid-cols-2 gap-8 mb-12'>
                  {categories.slice(0, 2).map(category => (
                    <div
                      key={category.id}
                      className='bg-white rounded-lg shadow-lg overflow-hidden'
                    >
                      <div className='bg-[#190dad] text-white text-center py-3 text-xl font-semibold'>
                        {category.name}
                      </div>
                      <div className='p-6'>
                        <table className='min-w-full'>
                          <tbody>
                            {category.items.map((item, index) => (
                              <tr
                                key={item.id}
                                className={
                                  index === category.items.length - 1
                                    ? ''
                                    : 'border-b'
                                }
                              >
                                <td className='py-3 text-left text-[#1a28c2] font-medium'>
                                  {item.displayName}
                                </td>
                                <td className='py-3 text-right text-[#1a28c2] font-medium'>
                                  BD {item.price.toFixed(3)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Second row - BEDDINGS and DRY CLEAN */}
                <div className='grid grid-cols-2 gap-8 mb-12'>
                  {categories.slice(2, 4).map(category => (
                    <div
                      key={category.id}
                      className='bg-white rounded-lg shadow-lg overflow-hidden'
                    >
                      <div className='bg-[#190dad] text-white text-center py-3 text-xl font-semibold'>
                        {category.name}
                      </div>
                      <div className='p-6'>
                        <table className='min-w-full'>
                          <tbody>
                            {category.items.map((item, index) => (
                              <tr
                                key={item.id}
                                className={
                                  index === category.items.length - 1
                                    ? ''
                                    : 'border-b'
                                }
                              >
                                <td className='py-3 text-left text-[#1a28c2] font-medium'>
                                  {item.displayName}
                                </td>
                                <td className='py-3 text-right text-[#1a28c2] font-medium'>
                                  BD {item.price.toFixed(3)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Third row - WASH AND FOLD (centered) */}
                {categories.length > 4 && (
                  <div className='bg-white rounded-lg shadow-lg overflow-hidden max-w-md mx-auto'>
                    <div className='bg-[#190dad] text-white text-center py-3 text-xl font-semibold'>
                      {categories[4].name}
                    </div>
                    <div className='p-6'>
                      <table className='min-w-full'>
                        <tbody>
                          {categories[4].items.map((item, index) => (
                            <tr
                              key={item.id}
                              className={
                                index === categories[4].items.length - 1
                                  ? ''
                                  : 'border-b'
                              }
                            >
                              <td className='py-3 text-left text-[#1a28c2] font-medium'>
                                {item.displayName}
                              </td>
                              <td className='py-3 text-right text-[#1a28c2] font-medium'>
                                BD {item.price.toFixed(3)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className='mt-12 text-center'>
            {header.contactInfo && (
              <p className='text-2xl text-[#190dad] font-bold'>
                {header.contactInfo}
              </p>
            )}
            <div className='mt-6'>
              <Link
                href='/schedule'
                className='inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#1a28c2] hover:bg-[#190dad] transition-colors'
              >
                Schedule a Pickup
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}