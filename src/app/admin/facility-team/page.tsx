'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFacilityTeamAuth } from '@/admin/hooks/useAdminAuth';
import { useDashboardStore } from '@/admin/stores/dashboardStore';
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

type SortField = 'orderNumber' | 'customer' | 'status' | 'total' | 'date' | 'deliveryTime';
type SortDirection = 'asc' | 'desc';

export default function FacilityTeamDashboard() {
  const router = useRouter();
  const { user, isLoading, isAuthorized, logout } = useFacilityTeamAuth();
  const {
    stats,
    loading: statsLoading,
    fetchFacilityTeamStats,
  } = useDashboardStore();
  const { orders, loading: ordersLoading, fetchOrders, setSorting } = useOrdersStore();
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('deliveryTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    if (isAuthorized) {
      fetchFacilityTeamStats();
      // Fetch orders with default sorting by delivery date (earliest first)
      fetchOrders({
        sortField: 'deliveryTime',
        sortOrder: 'asc',
        limit: 10
      });
    }
  }, [isAuthorized, fetchFacilityTeamStats, fetchOrders]);

  // Handle column header click for sorting
  const handleSort = useCallback((field: SortField) => {
    let newSortDirection: SortDirection = 'asc';
    
    if (sortField === field) {
      newSortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    setSortField(field);
    setSortDirection(newSortDirection);
    
    // Map frontend field names to backend field names
    const backendFieldMap: Record<SortField, string> = {
      orderNumber: 'orderNumber',
      customer: 'customer',
      status: 'status',
      total: 'total',
      date: 'createdAt',
      deliveryTime: 'deliveryTime'
    };
    
    // Update backend sorting
    setSorting(backendFieldMap[field], newSortDirection);
    
    // Fetch orders with new sorting
    fetchOrders({
      sortField: backendFieldMap[field],
      sortOrder: newSortDirection,
      limit: 10
    });
  }, [sortField, sortDirection, setSorting, fetchOrders]);

  // Get sort indicator for column headers
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Navigation handlers
  const handleNavigateToProcessing = useCallback(() => {
    router.push('/admin/facility-team/processing');
  }, [router]);

  const handleNavigateToIssues = useCallback(() => {
    router.push('/admin/facility-team/issues');
  }, [router]);

  const handleOpenOrderDetails = useCallback(
    (order: OrderWithDetails) => {
      if (order.id) {
        router.push(`/admin/facility-team/process/${order.id}`);
      }
    },
    [router]
  );

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
                Facility Team Dashboard
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
            Processing Overview
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <StatsCard
              title='Ready for Processing'
              value={stats?.pendingOrders || 0}
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
              bgColor='bg-blue-500'
              isLoading={statsLoading}
            />
            <StatsCard
              title='In Processing'
              value={stats?.completedOrders || 0}
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
              isLoading={statsLoading}
            />
            <StatsCard
              title='Completed Today'
              value={stats?.completedOrders || 0}
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
          </div>
        </div>

        {/* Quick Actions */}
        <div className='mb-8'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>
            Quick Actions
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-1 gap-4'>
            <QuickActionButton
              title='Process Orders'
              onClick={handleNavigateToProcessing}
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
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
              }
            />
          </div>
        </div>

        {/* Recent Orders */}
        <div className='bg-white shadow rounded-lg'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>
              Received Orders
            </h3>
          </div>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th 
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200'
                    onClick={() => handleSort('orderNumber')}
                  >
                    <div className='flex items-center space-x-1'>
                      <span>Order</span>
                      {getSortIndicator('orderNumber')}
                    </div>
                  </th>
                  <th 
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200'
                    onClick={() => handleSort('customer')}
                  >
                    <div className='flex items-center space-x-1'>
                      <span>Customer</span>
                      {getSortIndicator('customer')}
                    </div>
                  </th>
                  <th 
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200'
                    onClick={() => handleSort('status')}
                  >
                    <div className='flex items-center space-x-1'>
                      <span>Status</span>
                      {getSortIndicator('status')}
                    </div>
                  </th>
                  <th 
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200'
                    onClick={() => handleSort('total')}
                  >
                    <div className='flex items-center space-x-1'>
                      <span>Total</span>
                      {getSortIndicator('total')}
                    </div>
                  </th>
                  <th 
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200'
                    onClick={() => handleSort('date')}
                  >
                    <div className='flex items-center space-x-1'>
                      <span>Date</span>
                      {getSortIndicator('date')}
                    </div>
                  </th>
                  <th 
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200'
                    onClick={() => handleSort('deliveryTime')}
                  >
                    <div className='flex items-center space-x-1'>
                      <span>Delivery Time</span>
                      {getSortIndicator('deliveryTime')}
                    </div>
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {ordersLoading ? (
                  <tr>
                    <td colSpan={7} className='px-6 py-4 text-center'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-6 py-4 text-center text-gray-500'
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        <div className='flex items-center space-x-2'>
                          <span>{order.orderNumber}</span>
                          {order.isExpressService && (
                            <span className='inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800'>
                              Express
                            </span>
                          )}
                        </div>
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
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {formatCurrency(order.invoiceTotal ?? 0)}
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
                          Process Order
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
