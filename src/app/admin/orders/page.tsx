'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/admin/hooks/useAdminAuth';
import { useOrdersStore } from '@/admin/stores/ordersStore';
import { StatsCard } from '@/admin/components/StatsCard';
import {
  getStatusBadgeColor,
  getStatusDisplayName,
  formatDate,
  formatCurrency,
} from '@/admin/utils/orderUtils';
import { formatUTCForDisplay, formatUTCForTimeDisplay } from '@/lib/utils/timezone';

import type { OrderStatus, PaymentStatus } from '@/shared/types';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isLoading, isAuthorized, logout } = useAdminAuth();
  const { orders, loading, filters, fetchOrders, setFilters, resetFilters } =
    useOrdersStore();

  useEffect(() => {
    if (isAuthorized) {
      fetchOrders();
    }
  }, [isAuthorized, fetchOrders]);

  // Get the appropriate dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user?.role?.name) return '/admin';

    switch (user.role.name) {
      case 'SUPER_ADMIN':
        return '/admin/super-admin';
      case 'OPERATION_MANAGER':
        return '/admin/operation-manager';
      case 'DRIVER':
        return '/admin/driver';
      case 'FACILITY_TEAM':
        return '/admin/facility-team';
      default:
        return '/admin';
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    router.push(getDashboardUrl());
  };

  // Memoized filtered orders to improve performance
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        if (order.status !== filters.status) return false;
      }

      // Payment status filter
      if (filters.paymentStatus && filters.paymentStatus !== 'ALL') {
        if (order.paymentStatus !== filters.paymentStatus) return false;
      }

      // Service type filter
      if (filters.serviceType && filters.serviceType !== 'ALL') {
        const isExpress = order.isExpressService || false;
        if (filters.serviceType === 'EXPRESS' && !isExpress) return false;
        if (filters.serviceType === 'REGULAR' && isExpress) return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch =
          order.orderNumber.toLowerCase().includes(searchTerm) ||
          order.customer?.firstName?.toLowerCase().includes(searchTerm) ||
          order.customer?.lastName?.toLowerCase().includes(searchTerm) ||
          order.customer?.email?.toLowerCase().includes(searchTerm) ||
          order.customer?.phone?.includes(searchTerm);

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [orders, filters]);

  // Memoized stats calculations
  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter(order =>
        ['ORDER_PLACED', 'CONFIRMED', 'PICKUP_ASSIGNED'].includes(order.status)
      ).length,
      processing: orders.filter(order =>
        [
          'PICKUP_IN_PROGRESS',
          'PICKUP_COMPLETED',
          'DROPPED_OFF',
          'RECEIVED_AT_FACILITY',
          'PROCESSING_STARTED',
          'PROCESSING_COMPLETED',
          'QUALITY_CHECK',
          'READY_FOR_DELIVERY',
          'DELIVERY_ASSIGNED',
          'DELIVERY_IN_PROGRESS',
        ].includes(order.status)
      ).length,
      completed: orders.filter(order =>
        ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)
      ).length,
    }),
    [orders]
  );

  // Navigation handlers
  const handleNavigateToOrderDetails = (orderId: number) => {
    router.push(`/admin/orders/${orderId}`);
  };

  const handleStatusFilterChange = (status: OrderStatus | 'ALL') => {
    setFilters({ status });
  };

  const handlePaymentStatusFilterChange = (
    paymentStatus: PaymentStatus | 'ALL'
  ) => {
    setFilters({ paymentStatus });
  };

  const handleServiceTypeFilterChange = (serviceType: 'EXPRESS' | 'REGULAR' | 'ALL') => {
    setFilters({ serviceType });
  };

  const handleSearchChange = (search: string) => {
    setFilters({ search });
  };

  const handleClearFilters = () => {
    resetFilters();
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div
          className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'
          aria-label='Loading'
        ></div>
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
                Order Management
              </h1>
              <p className='mt-1 text-sm text-gray-500'>
                Manage and track all orders
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-500'>
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleBackClick}
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
        {/* Quick Stats */}
        <div className='mb-8'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>
            Order Overview
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <StatsCard
              title='Total Orders'
              value={stats.total}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
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
              value={stats.pending}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
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
              value={stats.processing}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
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
              value={stats.completed}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
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

        {/* Filters */}
        <div className='bg-white shadow rounded-lg mb-8'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>
              Filters & Search
            </h3>
          </div>
          <div className='px-6 py-4'>
            <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
              {/* Status Filter */}
              <div>
                <label
                  htmlFor='status-filter'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Status
                </label>
                <select
                  id='status-filter'
                  value={filters.status || 'ALL'}
                  onChange={e =>
                    handleStatusFilterChange(
                      e.target.value as OrderStatus | 'ALL'
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  aria-label='Filter by order status'
                >
                  <option value='ALL'>All Statuses</option>
                  <option value='ORDER_PLACED'>Order Placed</option>
                  <option value='CONFIRMED'>Confirmed</option>
                  <option value='PICKUP_ASSIGNED'>Pickup Assigned</option>
                  <option value='PICKUP_IN_PROGRESS'>Pickup In Progress</option>
                  <option value='PICKUP_COMPLETED'>Pickup Completed</option>
                  <option value='PICKUP_FAILED'>Pickup Failed</option>
                  <option value='DROPPED_OFF'>Dropped Off</option>
                  <option value='RECEIVED_AT_FACILITY'>
                    Received at Facility
                  </option>
                  <option value='PROCESSING_STARTED'>Processing Started</option>
                  <option value='PROCESSING_COMPLETED'>
                    Processing Completed
                  </option>
                  <option value='QUALITY_CHECK'>Quality Check</option>
                  <option value='READY_FOR_DELIVERY'>Ready for Delivery</option>
                  <option value='DELIVERY_ASSIGNED'>Delivery Assigned</option>
                  <option value='DELIVERY_IN_PROGRESS'>
                    Delivery In Progress
                  </option>
                  <option value='DELIVERED'>Delivered</option>
                  <option value='DELIVERY_FAILED'>Delivery Failed</option>
                  <option value='CANCELLED'>Cancelled</option>
                  <option value='REFUNDED'>Refunded</option>
                </select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <label
                  htmlFor='payment-status-filter'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Payment Status
                </label>
                <select
                  id='payment-status-filter'
                  value={filters.paymentStatus || 'ALL'}
                  onChange={e =>
                    handlePaymentStatusFilterChange(
                      e.target.value as PaymentStatus | 'ALL'
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  aria-label='Filter by payment status'
                >
                  <option value='ALL'>All Payment Statuses</option>
                  <option value='PENDING'>Pending</option>
                  <option value='PAID'>Paid</option>
                  <option value='FAILED'>Failed</option>
                  <option value='REFUNDED'>Refunded</option>
                  <option value='PARTIAL_REFUND'>Partial Refund</option>
                </select>
              </div>

              {/* Service Type Filter */}
              <div>
                <label
                  htmlFor='service-type-filter'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Service Type
                </label>
                <select
                  id='service-type-filter'
                  value={filters.serviceType || 'ALL'}
                  onChange={e =>
                    handleServiceTypeFilterChange(
                      e.target.value as 'EXPRESS' | 'REGULAR' | 'ALL'
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  aria-label='Filter by service type'
                >
                  <option value='ALL'>All Service Types</option>
                  <option value='EXPRESS'>Express Service</option>
                  <option value='REGULAR'>Regular Service</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label
                  htmlFor='search-input'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Search
                </label>
                <input
                  id='search-input'
                  type='text'
                  placeholder='Search orders, customers...'
                  value={filters.search || ''}
                  onChange={e => handleSearchChange(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  aria-label='Search orders and customers'
                />
              </div>

              {/* Clear Filters */}
              <div className='flex items-end'>
                <button
                  onClick={handleClearFilters}
                  className='w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
                  aria-label='Clear all filters'
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className='bg-white shadow rounded-lg'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>
              Orders ({filteredOrders.length})
            </h3>
          </div>
          <div className='overflow-x-auto'>
            <table
              className='min-w-full divide-y divide-gray-200'
              role='table'
              aria-label='Orders table'
            >
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Order
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Customer
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Status
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Service Type
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Payment
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Total
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Date
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Delivery Time
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {loading ? (
                  <tr>
                    <td colSpan={9} className='px-6 py-4 text-center'>
                      <div
                        className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'
                        aria-label='Loading orders'
                      ></div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className='px-6 py-4 text-center text-gray-500'
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
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
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.isExpressService 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.isExpressService ? 'Express' : 'Regular'}
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
                        {order.invoiceTotal !== null &&
                        order.invoiceTotal !== undefined
                          ? formatCurrency(order.invoiceTotal)
                          : 'N/A'}
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
                          onClick={() => {
                            if (order.id !== null && order.id !== undefined) {
                              handleNavigateToOrderDetails(order.id);
                            }
                          }}
                          className='text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded'
                          aria-label={`View details for order ${order.orderNumber}`}
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
