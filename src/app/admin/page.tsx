'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/admin/hooks/useAdminAuth';
import { useOrdersStore } from '@/admin/stores/ordersStore';
import { StatsCard } from '@/admin/components/StatsCard';
import { QuickActionButton } from '@/admin/components/QuickActionButton';
import {
  getStatusBadgeColor,
  getStatusDisplayName,
  formatDate,
  formatCurrency,
} from '@/admin/utils/orderUtils';
import { formatUTCForDisplay, formatUTCForTimeDisplay } from '@/lib/utils/timezone';
import type { OrderWithDetails } from '@/admin/api/orders';
import { OrderStatus } from '@prisma/client';

export default function AdminPanel() {
  const router = useRouter();
  const { user, isLoading, isAuthorized, logout } = useAdminAuth();
  const { orders, loading, fetchOrders } = useOrdersStore();

  useEffect(() => {
    if (isAuthorized) {
      fetchOrders();
    }
  }, [isAuthorized, fetchOrders]);

  // Navigation handlers
  const handleNavigateToSuperAdmin = () => {
    router.push('/admin/super-admin');
  };

  const handleNavigateToOperationManager = () => {
    router.push('/admin/operation-manager');
  };

  const handleNavigateToDriver = () => {
    router.push('/admin/driver');
  };

  const handleNavigateToFacilityTeam = () => {
    router.push('/admin/facility-team');
  };

  const handleOpenOrderDetails = (order: OrderWithDetails) => {
    // This would open order details modal in a real implementation
    console.log('Opening order details for:', order.orderNumber);
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
                Admin Dashboard
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
            Quick Overview
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <StatsCard
              title='Total Orders'
              value={orders.length}
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
              isLoading={loading}
            />
            <StatsCard
              title='Pending Orders'
              value={orders.filter(order => order.status === OrderStatus.ORDER_PLACED).length}
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
              isLoading={loading}
            />
            <StatsCard
              title='Processing Orders'
              value={
                orders.filter(order => order.status === OrderStatus.PROCESSING_STARTED).length
              }
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
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
              }
              bgColor='bg-orange-500'
              isLoading={loading}
            />
            <StatsCard
              title='Completed Orders'
              value={
                orders.filter(order => order.status === 'DELIVERED').length
              }
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
              isLoading={loading}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className='mb-8'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>
            Quick Actions
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <QuickActionButton
              title='Super Admin'
              onClick={handleNavigateToSuperAdmin}
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
                    d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                  />
                </svg>
              }
            />
            <QuickActionButton
              title='Operation Manager'
              onClick={handleNavigateToOperationManager}
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
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                  />
                </svg>
              }
            />
            <QuickActionButton
              title='Driver Management'
              onClick={handleNavigateToDriver}
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
                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
              }
            />
            <QuickActionButton
              title='Facility Team'
              onClick={handleNavigateToFacilityTeam}
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
                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                  />
                </svg>
              }
            />
          </div>
        </div>

        {/* Recent Orders */}
        <div className='bg-white shadow rounded-lg'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>Recent Orders</h3>
          </div>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Order
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Customer
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Payment
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Total
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Delivery Time
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {loading ? (
                  <tr>
                    <td colSpan={8} className='px-6 py-4 text-center'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className='px-6 py-4 text-center text-gray-500'
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 10).map(order => (
                    <tr key={order.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {order.orderNumber}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {order.customer
                          ? `${order.customer.firstName} ${order.customer.lastName}`
                          : 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}
                        >
                          {getStatusDisplayName(order.status)}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.paymentStatus)}`}
                        >
                          {getStatusDisplayName(order.paymentStatus)}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {formatCurrency(order.invoiceTotal || 0)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {formatDate(order.createdAt)}
                      </td>
                                 <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
             <div>
               <div className='text-xs'>
                 {formatUTCForDisplay(order.deliveryStartTime.toString())}
               </div>
               <div className='text-xs text-gray-400'>
                 {formatUTCForTimeDisplay(order.deliveryStartTime.toString())}
               </div>
             </div>
           </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                        <button
                          onClick={() => handleOpenOrderDetails(order)}
                          className='text-blue-600 hover:text-blue-900'
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
