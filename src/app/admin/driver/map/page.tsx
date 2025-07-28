'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDriverAuth } from '@/admin/hooks/useAdminAuth';
import { useDriverStore } from '@/admin/stores/driverStore';
import { DriverMap } from '@/admin/components/driver/DriverMap';

export default function DriverMapPage() {
  const router = useRouter();
  const { user, isLoading, isAuthorized, logout } = useDriverAuth();
  const { assignments, loading, fetchAssignments } = useDriverStore();

  useEffect(() => {
    if (isAuthorized) {
      fetchAssignments();
    }
  }, [isAuthorized, fetchAssignments]);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect to login
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Assignment Map
              </h1>
              <p className='mt-1 text-sm text-gray-500'>
                Today's assignments view - {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => router.push('/admin/driver')}
                className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10 19l-7-7m0 0l7-7m-7 7h18'
                  />
                </svg>
                <span>Back to Dashboard</span>
              </button>
              <button
                onClick={logout}
                className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200'
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Map Section */}
        <div className='bg-white shadow rounded-lg'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <div className='flex justify-between items-center'>
              <h2 className='text-lg font-medium text-gray-900'>
                Today's Assignments Map (Bahrain Time)
              </h2>
              <div className='text-sm text-gray-500'>
                {loading ? 'Loading...' : `${assignments.length} assignments`}
              </div>
            </div>
          </div>
          <div className='p-6'>
            <DriverMap />
          </div>
        </div>
      </div>
    </div>
  );
}
