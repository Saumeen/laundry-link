'use client';

import { Suspense, use } from 'react';
import MainLayout from '@/components/layouts/main-layout';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface OrderSuccessPageProps {
  params: Promise<{
    orderNumber: string;
  }>;
}

function OrderSuccessContent({ orderNumber }: { orderNumber: string }) {
  const { isAuthenticated, customer } = useAuth();

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-16'>
      <div className='max-w-4xl mx-auto px-6 lg:px-8'>
        {/* Main Success Card */}
        <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
          {/* Header Section */}
          <div className='bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center text-white'>
            <div className='mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm'>
              <svg
                className='w-10 h-10'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2.5}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <h1 className='text-4xl font-bold mb-3'>Order Confirmed</h1>
            <p className='text-xl text-green-100'>
              Thank you for choosing Laundry Link
            </p>
          </div>

          {/* Content Section */}
          <div className='px-8 py-12'>
            {/* Order Number */}
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8'>
              <div className='flex items-center justify-center space-x-3'>
                <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-5 h-5 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </div>
                <div>
                  <p className='text-sm font-medium text-blue-700'>
                    Order Reference
                  </p>
                  <p className='text-2xl font-bold text-blue-900'>
                    #{orderNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Process Timeline */}
            <div className='mb-10'>
              <h2 className='text-2xl font-bold text-gray-900 mb-8 text-center'>
                What happens next?
              </h2>
              <div className='grid md:grid-cols-2 gap-6'>
                <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
                  <div className='flex items-start space-x-4'>
                    <div className='flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-blue-700 font-bold text-lg'>1</span>
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                        {isAuthenticated ? 'Order Processing' : 'Account Setup'}
                      </h3>
                      <p className='text-gray-600 leading-relaxed'>
                        {isAuthenticated
                          ? 'Your order has been received and is being processed. You can track its progress in your dashboard.'
                          : "We've created your account automatically. Check your email for login credentials and account details."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
                  <div className='flex items-start space-x-4'>
                    <div className='flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-blue-700 font-bold text-lg'>2</span>
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                        Order Confirmation
                      </h3>
                      <p className='text-gray-600 leading-relaxed'>
                        You'll receive a detailed confirmation email with pickup
                        information and order specifications.
                      </p>
                    </div>
                  </div>
                </div>

                <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
                  <div className='flex items-start space-x-4'>
                    <div className='flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-blue-700 font-bold text-lg'>3</span>
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                        Collection & Processing
                      </h3>
                      <p className='text-gray-600 leading-relaxed'>
                        Our professional team will collect your items at the
                        scheduled time and process them with care.
                      </p>
                    </div>
                  </div>
                </div>

                <div className='bg-gray-50 rounded-xl p-6 border border-gray-100'>
                  <div className='flex items-start space-x-4'>
                    <div className='flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-blue-700 font-bold text-lg'>4</span>
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                        Delivery
                      </h3>
                      <p className='text-gray-600 leading-relaxed'>
                        Your professionally cleaned items will be delivered back
                        to you at your chosen time and location.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className='bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8'>
              <div className='flex items-start space-x-4'>
                <div className='flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center'>
                  <svg
                    className='w-5 h-5 text-amber-600'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-amber-800 mb-3'>
                    Important Information
                  </h3>
                  <ul className='space-y-2 text-amber-700'>
                    <li className='flex items-start space-x-2'>
                      <span className='text-amber-500 mt-1'>•</span>
                      <span>
                        Duvet, carpet, and dry clean items require 72 hours
                        processing time
                      </span>
                    </li>
                    <li className='flex items-start space-x-2'>
                      <span className='text-amber-500 mt-1'>•</span>
                      <span>
                        Invoice and service details will be available after item
                        sorting
                      </span>
                    </li>
                    <li className='flex items-start space-x-2'>
                      <span className='text-amber-500 mt-1'>•</span>
                      <span>
                        You&apos;ll receive email updates throughout the process
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Single Action Button */}
            <div className='flex justify-center mb-8'>
              <Link
                href={
                  isAuthenticated ? '/customer/dashboard' : '/registerlogin'
                }
                className='bg-gradient-to-r from-blue-600 to-blue-700 text-white px-12 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              >
                {isAuthenticated
                  ? 'View Your Dashboard'
                  : 'Access Your Account'}
              </Link>
            </div>

            {/* Contact Section */}
            <div className='border-t border-gray-200 pt-8'>
              <h3 className='text-lg font-semibold text-gray-900 mb-6 text-center'>
                Need assistance?
              </h3>
              <div className='grid md:grid-cols-2 gap-4'>
                <a
                  href='https://wa.me/97333440841'
                  className='flex items-center justify-center space-x-3 bg-green-500 text-white px-6 py-4 rounded-xl hover:bg-green-600 transition-colors duration-200 shadow-md hover:shadow-lg'
                >
                  <svg
                    className='w-6 h-6'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488' />
                  </svg>
                  <span className='font-medium'>WhatsApp Support</span>
                </a>

                <a
                  href='mailto:support@laundrylink.net'
                  className='flex items-center justify-center space-x-3 bg-blue-50 text-blue-700 px-6 py-4 rounded-xl hover:bg-blue-100 transition-colors duration-200 border border-blue-200'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                    />
                  </svg>
                  <span className='font-medium'>Email Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-16'>
      <div className='max-w-4xl mx-auto px-6 lg:px-8'>
        <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
          <div className='animate-pulse'>
            <div className='bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12'>
              <div className='mx-auto w-20 h-20 bg-white/20 rounded-full mb-6'></div>
              <div className='h-8 bg-white/20 rounded mb-3'></div>
              <div className='h-6 bg-white/20 rounded'></div>
            </div>
            <div className='px-8 py-12'>
              <div className='h-32 bg-gray-200 rounded-xl mb-8'></div>
              <div className='space-y-4'>
                <div className='h-4 bg-gray-200 rounded'></div>
                <div className='h-4 bg-gray-200 rounded w-3/4'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { orderNumber } = use(params);

  return (
    <MainLayout>
      <Suspense fallback={<LoadingFallback />}>
        <OrderSuccessContent orderNumber={orderNumber} />
      </Suspense>
    </MainLayout>
  );
}
