'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSuperAdminAuth } from '@/admin/hooks/useAdminAuth';
import { useDashboardStore } from '@/admin/stores/dashboardStore';
import { DashboardStats } from '@/admin/components/DashboardStats';
import { QuickActionButton } from '@/admin/components/QuickActionButton';
import PageTransition from '@/components/ui/PageTransition';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user, isLoading, isAuthorized, logout } = useSuperAdminAuth();
  const {
    stats,
    fetchSuperAdminStats,
    loading: statsLoading,
  } = useDashboardStore();

  useEffect(() => {
    if (isAuthorized) {
      fetchSuperAdminStats();
    }
  }, [isAuthorized, fetchSuperAdminStats]);

  // Navigation handlers
  const handleNavigateToOrders = () => {
    router.push('/admin/orders');
  };

  const handleNavigateToCustomers = () => {
    router.push('/admin/super-admin/customers');
  };

  const handleNavigateToStaff = () => {
    router.push('/admin/super-admin/staff');
  };

  const handleNavigateToReports = () => {
    router.push('/admin/super-admin/reports');
  };

  const handleNavigateToServicePricing = () => {
    router.push('/admin/super-admin/service-pricing');
  };

  const handleNavigateToConfigurations = () => {
    router.push('/admin/super-admin/configurations');
  };

  // Stats card click handlers
  const handleStatsCardClick = (statType: string) => {
    switch (statType) {
      case 'totalOrders':
        handleNavigateToOrders();
        break;
      case 'totalCustomers':
        handleNavigateToCustomers();
        break;
      case 'activeStaff':
        handleNavigateToStaff();
        break;
      default:
        break;
    }
  };

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
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Super Admin Dashboard
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
          {/* Stats Cards */}
          <div className='mb-8'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>
              Overview Statistics
            </h2>
            <DashboardStats
              stats={stats}
              isLoading={statsLoading}
              onStatsCardClick={handleStatsCardClick}
            />
          </div>

          {/* Quick Actions */}
          <div className='mb-8'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>
              Quick Actions
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <QuickActionButton
                title='Manage Orders'
                onClick={handleNavigateToOrders}
                bgColor='bg-blue-600 hover:bg-blue-700'
                icon={
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
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                }
              />

              <QuickActionButton
                title='Manage Customers'
                onClick={handleNavigateToCustomers}
                bgColor='bg-green-600 hover:bg-green-700'
                icon={
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
                      d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                    />
                  </svg>
                }
              />

              <QuickActionButton
                title='Manage Staff'
                onClick={handleNavigateToStaff}
                bgColor='bg-purple-600 hover:bg-purple-700'
                icon={
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
                      d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                }
              />

              <QuickActionButton
                title='View Reports'
                onClick={handleNavigateToReports}
                bgColor='bg-yellow-600 hover:bg-yellow-700'
                icon={
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
                      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                    />
                  </svg>
                }
              />


            </div>
          </div>

          {/* Additional Management Sections */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6'>
            <div className='bg-white rounded-lg shadow p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Service & Pricing
              </h3>
              <p className='text-gray-600 mb-4'>
                Manage services, pricing categories, and service-pricing
                mappings.
              </p>
              <QuickActionButton
                title='Manage Services'
                onClick={handleNavigateToServicePricing}
                bgColor='bg-indigo-600 hover:bg-indigo-700'
              />
            </div>

            <div className='bg-white rounded-lg shadow p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                System Configuration
              </h3>
              <p className='text-gray-600 mb-4'>
                Manage application-wide configurations and settings including
                time slots, business rules, and system parameters.
              </p>
              <QuickActionButton
                title='Manage Configurations'
                onClick={handleNavigateToConfigurations}
                bgColor='bg-orange-600 hover:bg-orange-700'
                icon={
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
                      d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
