'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/main-layout';
import { useServices } from '@/hooks/useServices';
import { useAuth } from '@/hooks/useAuth';

export default function Services() {
  const [activeTab, setActiveTab] = useState('all');
  const { services, loading, error } = useServices();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Handle schedule pickup click
  const handleSchedulePickup = () => {
    if (isAuthenticated) {
      router.push('/customer/schedule');
    } else {
      router.push('/registerlogin');
    }
  };

  // Filter services based on category
  const filteredServices =
    activeTab === 'all'
      ? services
      : services.filter(service => {
          if (activeTab === 'regular') {
            return service.category === 'regular';
          } else if (activeTab === 'premium') {
            return service.category === 'premium';
          }
          return true;
        });

  if (loading) {
    return (
      <MainLayout>
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-[#1a28c2] mx-auto'></div>
            <p className='mt-6 text-xl text-[#1f6cc7] font-medium'>Loading services...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100'>
          <div className='text-center max-w-md mx-auto'>
            <div className='bg-white rounded-2xl p-8 shadow-xl'>
              <p className='text-red-600 text-lg font-medium mb-4'>Error loading services: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className='bg-[#1a28c2] text-white px-6 py-3 rounded-xl hover:bg-[#190dad] transition-colors font-semibold'
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen'>
        {/* Hero Section */}
        <div className='bg-[#1a28c2] py-16'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <h1 className='text-3xl md:text-4xl font-bold text-white text-center'>
              Our Services
            </h1>
            <p className='mt-4 text-xl text-blue-100 text-center max-w-3xl mx-auto'>
              Professional laundry and dry cleaning services with convenient
              pickup and delivery
            </p>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          {/* Service Tabs */}
          <div className='flex justify-center mb-12'>
            <div className='inline-flex rounded-lg shadow-sm bg-white/80 backdrop-blur-sm p-1' role='group'>
              <button
                type='button'
                className={`px-6 py-3 text-sm font-medium rounded-l-lg transition-all ${
                  activeTab === 'all'
                    ? 'bg-[#1a28c2] text-white shadow-lg'
                    : 'bg-transparent text-gray-700 hover:bg-white/50'
                }`}
                onClick={() => setActiveTab('all')}
              >
                All Services
              </button>
              <button
                type='button'
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'regular'
                    ? 'bg-[#1a28c2] text-white shadow-lg'
                    : 'bg-transparent text-gray-700 hover:bg-white/50'
                }`}
                onClick={() => setActiveTab('regular')}
              >
                Regular Services
              </button>
              <button
                type='button'
                className={`px-6 py-3 text-sm font-medium rounded-r-lg transition-all ${
                  activeTab === 'premium'
                    ? 'bg-[#1a28c2] text-white shadow-lg'
                    : 'bg-transparent text-gray-700 hover:bg-white/50'
                }`}
                onClick={() => setActiveTab('premium')}
              >
                Premium Services
              </button>
            </div>
          </div>

          {/* Services Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {filteredServices.map(service => (
              <div
                key={service.id}
                className='bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300'
              >
                <div className='p-6'>
                  <div className='flex items-center mb-3'>
                    <h3 className='text-xl font-semibold text-gray-900'>
                      {service.displayName}
                    </h3>
                  </div>
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      <span className='font-bold text-lg text-gray-900'>
                        BD {service.price?.toFixed(3)}
                      </span>
                      <span className='ml-1 text-gray-700 font-medium'>
                        {service.unit}
                      </span>
                    </div>
                    <span className='bg-[#e3f2fd] text-[#1a28c2] text-xs font-semibold px-3 py-1 rounded-full'>
                      {service.turnaround}
                    </span>
                  </div>
                  <p className='text-gray-600 mb-4'>{service.description}</p>
                  {service.features && service.features.length > 0 && (
                    <div className='border-t border-gray-200 pt-4 mt-4'>
                      <h4 className='text-sm font-semibold text-gray-900 mb-2'>
                        Service Features:
                      </h4>
                      <ul className='space-y-1'>
                        {service.features.map((feature, index) => (
                          <li key={index} className='flex items-start'>
                            <svg
                              className='h-5 w-5 text-[#63dbe2] mr-2 mt-0.5 flex-shrink-0'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M5 13l4 4L19 7'
                              />
                            </svg>
                            <span className='text-sm text-gray-600'>
                              {feature.trim()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className='mt-6'>
                    <button
                      onClick={handleSchedulePickup}
                      disabled={authLoading}
                      className='block w-full bg-[#1a28c2] text-white text-center py-2 px-4 rounded-lg hover:bg-[#190dad] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                    >
                      {authLoading
                        ? 'Loading...'
                        : isAuthenticated
                          ? 'Schedule Pickup'
                          : 'Login to Schedule'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className='bg-white/60 backdrop-blur-sm py-16'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold text-[#190dad]'>
                How Our Service Works
              </h2>
              <p className='mt-4 text-xl text-[#1f6cc7] max-w-3xl mx-auto'>
                We&apos;ve simplified the laundry process to make it as convenient
                as possible for you
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
              <div className='bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow'>
                <div className='bg-[#e3f2fd] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                  <span className='text-[#1a28c2] text-2xl font-bold'>1</span>
                </div>
                <h3 className='text-lg font-semibold mb-2'>Schedule</h3>
                <p className='text-gray-600'>
                  Choose a convenient pickup time through our easy scheduling
                  system
                </p>
              </div>

              <div className='bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow'>
                <div className='bg-[#e3f2fd] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                  <span className='text-[#1a28c2] text-2xl font-bold'>2</span>
                </div>
                <h3 className='text-lg font-semibold mb-2'>Pickup</h3>
                <p className='text-gray-600'>
                  Our driver arrives at your location to collect your laundry
                </p>
              </div>

              <div className='bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow'>
                <div className='bg-[#e3f2fd] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                  <span className='text-[#1a28c2] text-2xl font-bold'>3</span>
                </div>
                <h3 className='text-lg font-semibold mb-2'>Processing</h3>
                <p className='text-gray-600'>
                  Your clothes are cleaned according to your selected service
                </p>
              </div>

              <div className='bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow'>
                <div className='bg-[#e3f2fd] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
                  <span className='text-[#1a28c2] text-2xl font-bold'>4</span>
                </div>
                <h3 className='text-lg font-semibold mb-2'>Delivery</h3>
                <p className='text-gray-600'>
                  Clean clothes are delivered back to your doorstep
                </p>
              </div>
            </div>

            <div className='mt-12 text-center'>
              <button
                onClick={handleSchedulePickup}
                disabled={authLoading}
                className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-[#1a28c2] hover:bg-[#190dad] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {authLoading
                  ? 'Loading...'
                  : isAuthenticated
                    ? 'Schedule Your Pickup Now'
                    : 'Login to Schedule Pickup'}
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-[#190dad]'>
              Frequently Asked Questions
            </h2>
            <p className='mt-4 text-xl text-[#1f6cc7]'>
              Find answers to common questions about our services
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow'>
              <h3 className='text-lg font-semibold mb-2'>
                How do I pay for the service?
              </h3>
              <p className='text-gray-600'>
                Customer will receive an invoice of their laundry after sorting in
                laundry and a payment link will be shared to pay for the laundry.
              </p>
            </div>

            <div className='bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow'>
              <h3 className='text-lg font-semibold mb-2'>
                What if I'm not home during pickup or delivery?
              </h3>
              <p className='text-gray-600'>
                You can leave special instructions for our drivers. Many customers
                leave their laundry in a designated spot and request contactless
                delivery.
              </p>
            </div>

            <div className='bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow'>
              <h3 className='text-lg font-semibold mb-2'>
                How is pricing calculated?
              </h3>
              <p className='text-gray-600'>
                For wash and fold it's as per KG with a minimum of 3 KG per wash,
                and for other services it's by item.
              </p>
            </div>

            <div className='bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow'>
              <h3 className='text-lg font-semibold mb-2'>
                What areas do you service?
              </h3>
              <p className='text-gray-600'>
                We serve all Bahrain excluding Durra Albahrain, Zallaq, Areen,
                Jaw, and Askar.
              </p>
            </div>

            <div className='bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow'>
              <h3 className='text-lg font-semibold mb-2'>
                How do I track my order?
              </h3>
              <p className='text-gray-600'>
                You can track your order in real-time through our website. You'll
                receive notifications at each stage of the process, including
                driver location during pickup and delivery.
              </p>
            </div>

            <div className='bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow'>
              <h3 className='text-lg font-semibold mb-2'>
                What detergents do you use?
              </h3>
              <p className='text-gray-600'>
                We use high-quality, eco-friendly detergents. If you have specific
                preferences or allergies, you can note this in your order and
                we'll accommodate your needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}