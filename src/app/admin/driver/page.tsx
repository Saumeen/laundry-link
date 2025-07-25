'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDriverAuth } from '@/admin/hooks/useAdminAuth';
import { useDriverStore } from '@/admin/stores/driverStore';
import { StatsCard } from '@/admin/components/StatsCard';
import { QuickActionButton } from '@/admin/components/QuickActionButton';
import { DriverAssignments } from '@/admin/components/driver/DriverAssignments';
import { DriverStats } from '@/admin/components/driver/DriverStats';

export default function DriverDashboard() {
  const router = useRouter();
  const { user, isLoading, isAuthorized, logout } = useDriverAuth();
  const { stats, statsLoading, fetchStats } = useDriverStore();

  useEffect(() => {
    if (isAuthorized) {
      fetchStats('today');
    }
  }, [isAuthorized, fetchStats]);

  // Navigation handlers
  const handleNavigateToAssignments = () => {
    router.push('/admin/driver/assignments');
  };

  const handleNavigateToReports = () => {
    router.push('/admin/driver/reports');
  };

  const handleNavigateToProfile = () => {
    router.push('/admin/driver/profile');
  };

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
                Driver Dashboard
              </h1>
              <p className='mt-1 text-sm text-gray-500'>
                Welcome back, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-500'>
                Role: {user?.role.name.replace('_', ' ')}
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
        {/* Quick Stats */}
        <div className='mb-8'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>
            Today&apos;s Overview (Bahrain Time)
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <StatsCard
              title='Total Assignments'
              value={stats?.totalAssignments || 0}
              icon={
                <svg
                  className='w-5 h-5 text-white'
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
              }
              bgColor='bg-blue-500'
              isLoading={statsLoading}
            />
            <StatsCard
              title='Completed'
              value={stats?.completedAssignments || 0}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              }
              bgColor='bg-green-500'
              isLoading={statsLoading}
            />
            <StatsCard
              title='Pending'
              value={stats?.pendingAssignments || 0}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              }
              bgColor='bg-yellow-500'
              isLoading={statsLoading}
            />
            <StatsCard
              title='Completion Rate'
              value={`${stats?.completionRate.toFixed(1) || 0}%`}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                  />
                </svg>
              }
              bgColor='bg-purple-500'
              isLoading={statsLoading}
            />
          </div>
        </div>

        {/* Today's Assignments */}
        <div className='bg-white shadow rounded-lg mb-8'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-medium text-gray-900'>
                Today's Assignments (Bahrain Time)
              </h3>
              <button
                onClick={() => router.push('/admin/driver/map')}
                className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200'
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
                    d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3'
                  />
                </svg>
                <span>View Map</span>
              </button>
            </div>
          </div>
          <div className='p-6'>
            <DriverAssignments />
          </div>
        </div>

      </div>
    </div>
  );
}
