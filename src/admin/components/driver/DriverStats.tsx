import { memo, useEffect } from 'react';
import { useDriverStore } from '@/admin/stores/driverStore';
import type { DriverStats } from '@/admin/api/driver';

export const DriverStats = memo(() => {
  const { stats, statsLoading, fetchStats } = useDriverStore();

  useEffect(() => {
    fetchStats('today');
  }, [fetchStats]);

  if (statsLoading) {
    return (
      <div className='bg-white shadow rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-medium text-gray-900'>
            Performance Statistics
          </h3>
        </div>
        <div className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {[1, 2, 3].map(i => (
              <div key={i} className='text-center'>
                <div className='animate-pulse bg-gray-200 h-8 w-16 mx-auto mb-2 rounded'></div>
                <div className='animate-pulse bg-gray-200 h-4 w-24 mx-auto rounded'></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className='bg-white shadow rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h3 className='text-lg font-medium text-gray-900'>
            Performance Statistics
          </h3>
        </div>
        <div className='p-6 text-center'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-gray-400'
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
          </div>
          <p className='text-gray-500'>No statistics available</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white shadow rounded-lg'>
      <div className='px-6 py-4 border-b border-gray-200'>
        <div className='flex justify-between items-center'>
          <h3 className='text-lg font-medium text-gray-900'>
            Performance Statistics
          </h3>
          <span className='text-sm text-gray-500 capitalize'>
            {stats.period} Overview
          </span>
        </div>
      </div>
      <div className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {stats.totalAssignments}
            </div>
            <div className='text-sm text-gray-500'>Total Assignments</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {stats.completionRate.toFixed(1)}%
            </div>
            <div className='text-sm text-gray-500'>Completion Rate</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {stats.earnings.toFixed(2)} BD
            </div>
            <div className='text-sm text-gray-500'>Total Earnings</div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className='mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='bg-blue-50 rounded-lg p-4'>
            <div className='flex items-center'>
              <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3'>
                <svg
                  className='w-4 h-4 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10'
                  />
                </svg>
              </div>
              <div>
                <div className='text-lg font-semibold text-blue-900'>
                  {stats.pickupAssignments}
                </div>
                <div className='text-sm text-blue-600'>Pickup Assignments</div>
              </div>
            </div>
          </div>

          <div className='bg-green-50 rounded-lg p-4'>
            <div className='flex items-center'>
              <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3'>
                <svg
                  className='w-4 h-4 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 13l-3-3m0 0l-3 3m3-3v12'
                  />
                </svg>
              </div>
              <div>
                <div className='text-lg font-semibold text-green-900'>
                  {stats.deliveryAssignments}
                </div>
                <div className='text-sm text-green-600'>
                  Delivery Assignments
                </div>
              </div>
            </div>
          </div>

          <div className='bg-yellow-50 rounded-lg p-4'>
            <div className='flex items-center'>
              <div className='w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3'>
                <svg
                  className='w-4 h-4 text-white'
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
              </div>
              <div>
                <div className='text-lg font-semibold text-yellow-900'>
                  {stats.pendingAssignments}
                </div>
                <div className='text-sm text-yellow-600'>
                  Pending Assignments
                </div>
              </div>
            </div>
          </div>

          <div className='bg-red-50 rounded-lg p-4'>
            <div className='flex items-center'>
              <div className='w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3'>
                <svg
                  className='w-4 h-4 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </div>
              <div>
                <div className='text-lg font-semibold text-red-900'>
                  {stats.cancelledAssignments}
                </div>
                <div className='text-sm text-red-600'>
                  Cancelled Assignments
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {stats.recentAssignments && stats.recentAssignments.length > 0 && (
          <div className='mt-8'>
            <h4 className='text-md font-medium text-gray-900 mb-4'>
              Recent Activity
            </h4>
            <div className='space-y-3'>
              {stats.recentAssignments.slice(0, 5).map(activity => (
                <div
                  key={activity.id}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                >
                  <div className='flex items-center space-x-3'>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.status === 'COMPLETED'
                          ? 'bg-green-500'
                          : activity.status === 'IN_PROGRESS'
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                      }`}
                    ></div>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        {activity.assignmentType} - {activity.order.orderNumber}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {activity.order.customerFirstName}{' '}
                        {activity.order.customerLastName}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      activity.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : activity.status === 'IN_PROGRESS'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {activity.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

DriverStats.displayName = 'DriverStats';
