'use client';

import { useRouter } from 'next/navigation';
import { useSuperAdminAuth } from '@/admin/hooks/useAdminAuth';
import CronJobMonitor from '@/components/admin/CronJobMonitor';
import PageTransition from '@/components/ui/PageTransition';

export default function CronMonitorPage() {
  const router = useRouter();
  const { user, isLoading, isAuthorized, logout } = useSuperAdminAuth();

  if (isLoading) {
    return (
      <PageTransition>
        <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
        </div>
      </PageTransition>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect to login
  }

  return (
    <PageTransition>
      <div className='min-h-screen bg-gray-50'>
        {/* Header */}
        <div className='bg-white shadow'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center py-6'>
              <div className='flex items-center space-x-4'>
                <button
                  onClick={() => router.back()}
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
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                  <span>Back</span>
                </button>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>
                    Cron Job Monitor
                  </h1>
                  <p className='mt-1 text-sm text-gray-500'>
                    Monitor and control automated payment status checking jobs
                  </p>
                </div>
              </div>
              <div className='flex items-center space-x-4'>
                <span className='text-sm text-gray-500'>
                  Welcome, {user?.firstName} {user?.lastName}
                </span>
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
          <CronJobMonitor />
        </div>
      </div>
    </PageTransition>
  );
} 