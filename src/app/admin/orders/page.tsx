'use client';

import { useEffect, useMemo, useCallback } from 'react';
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
import { 
  formatUTCForDisplay, 
  formatUTCForTimeDisplay, 
  convertUTCToBahrainDateTimeLocal, 
  convertBahrainToUTC 
} from '@/lib/utils/timezone';

import type { OrderStatus, PaymentStatus } from '@/shared/types';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isLoading, isAuthorized, logout } = useAdminAuth();
  const { orders, loading, filters, pagination, fetchOrders, setFilters, resetFilters, setSorting } =
    useOrdersStore();

  useEffect(() => {
    if (isAuthorized) {
      fetchOrders();
    }
  }, [isAuthorized, fetchOrders]);

  // Get the appropriate dashboard URL based on user role
  const getDashboardUrl = useCallback(() => {
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
  }, [user?.role?.name]);

  // Handle back button click
  const handleBackClick = useCallback(() => {
    router.push(getDashboardUrl());
  }, [router, getDashboardUrl]);

  // Memoized stats calculations
  const stats = useMemo(
    () => ({
      total: pagination?.total || orders.length,
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
    [orders, pagination]
  );

  // Navigation handlers
  const handleNavigateToOrderDetails = useCallback((orderId: number) => {
    router.push(`/admin/orders/${orderId}`);
  }, [router]);

  const handleStatusFilterChange = useCallback((status: OrderStatus | 'ALL') => {
    setFilters({ status, page: 1 });
  }, [setFilters]);

  const handlePaymentStatusFilterChange = useCallback((
    paymentStatus: PaymentStatus | 'ALL'
  ) => {
    setFilters({ paymentStatus, page: 1 });
  }, [setFilters]);

  const handleServiceTypeFilterChange = useCallback((serviceType: 'EXPRESS' | 'REGULAR' | 'ALL') => {
    setFilters({ serviceType, page: 1 });
  }, [setFilters]);

  const handleDeliveryDateRangeChange = useCallback((field: 'from' | 'to', value: string) => {
    setFilters({ 
      deliveryDateRange: { 
        ...filters.deliveryDateRange, 
        [field]: value 
      },
      page: 1
    });
  }, [setFilters, filters]);

  const handlePickupDateRangeChange = useCallback((field: 'from' | 'to', value: string) => {
    setFilters({ 
      pickupDateRange: { 
        ...filters.pickupDateRange, 
        [field]: value 
      },
      page: 1
    });
  }, [setFilters, filters]);

  const handleSearchChange = useCallback((search: string) => {
    setFilters({ search, page: 1 });
  }, [setFilters]);

  const handleSubmitFilters = useCallback(() => {
    // Trigger a new search with current filters
    fetchOrders(filters);
  }, [fetchOrders, filters]);

  const handleClearFilters = useCallback(() => {
    resetFilters();
    // Fetch orders with cleared filters
    fetchOrders();
  }, [resetFilters, fetchOrders]);

  const handleSort = useCallback((field: string) => {
    const newOrder: 'asc' | 'desc' = filters.sortField === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    
    // Update the store with new sorting parameters
    setSorting(field, newOrder);
    
    // Trigger a new API call with the updated sorting parameters
    const updatedFilters = {
      ...filters,
      sortField: field,
      sortOrder: newOrder,
      page: 1, // Reset to first page when sorting
    };
    
    // Call fetchOrders with the updated filters
    fetchOrders(updatedFilters);
  }, [filters, setSorting, fetchOrders]);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    const updatedFilters = {
      ...filters,
      page,
    };
    fetchOrders(updatedFilters);
  }, [filters, fetchOrders]);

  const handleLimitChange = useCallback((limit: number) => {
    const updatedFilters = {
      ...filters,
      limit,
      page: 1, // Reset to first page when changing limit
    };
    fetchOrders(updatedFilters);
  }, [filters, fetchOrders]);

  const getSortIndicator = useCallback((field: string) => {
    const isCurrentlySorted = filters.sortField === field;
    const isAscending = filters.sortOrder === 'asc';
    
    return (
      <div className={`p-1 rounded transition-all duration-200 ${
        isCurrentlySorted 
          ? 'bg-blue-50 text-blue-600' 
          : 'hover:bg-gray-50 text-gray-400 hover:text-gray-600 group-hover:text-gray-500'
      }`}>
        <svg
          className={`w-4 h-4 transition-all duration-200 ${
            isCurrentlySorted ? 'scale-110' : ''
          } ${isCurrentlySorted && isAscending ? 'rotate-180' : ''}`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
          />
        </svg>
      </div>
    );
  }, [filters.sortField, filters.sortOrder]);

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
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
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

              {/* Delivery Date Range */}
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Delivery Date Range
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label
                      htmlFor='delivery-date-from'
                      className='block text-xs text-gray-500 mb-1'
                    >
                      From
                    </label>
                    <input
                      id='delivery-date-from'
                      type='date'
                      value={filters.deliveryDateRange?.from || ''}
                      onChange={e => handleDeliveryDateRangeChange('from', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      aria-label='Delivery date from'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='delivery-date-to'
                      className='block text-xs text-gray-500 mb-1'
                    >
                      To
                    </label>
                    <input
                      id='delivery-date-to'
                      type='date'
                      value={filters.deliveryDateRange?.to || ''}
                      onChange={e => handleDeliveryDateRangeChange('to', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      aria-label='Delivery date to'
                    />
                  </div>
                </div>
              </div>

              {/* Pickup Date Range */}
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Pickup Date Range
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label
                      htmlFor='pickup-date-from'
                      className='block text-xs text-gray-500 mb-1'
                    >
                      From
                    </label>
                    <input
                      id='pickup-date-from'
                      type='date'
                      value={filters.pickupDateRange?.from || ''}
                      onChange={e => handlePickupDateRangeChange('from', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      aria-label='Pickup date from'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='pickup-date-to'
                      className='block text-xs text-gray-500 mb-1'
                    >
                      To
                    </label>
                    <input
                      id='pickup-date-to'
                      type='date'
                      value={filters.pickupDateRange?.to || ''}
                      onChange={e => handlePickupDateRangeChange('to', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      aria-label='Pickup date to'
                    />
                  </div>
                </div>
              </div>

              {/* Submit and Clear Filters */}
              <div className='flex items-end gap-3'>
                <button
                  onClick={handleSubmitFilters}
                  className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                  aria-label='Search with current filters'
                >
                  Search
                </button>
                <button
                  onClick={handleClearFilters}
                  className='flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
                  aria-label='Clear all filters'
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className='bg-white shadow rounded-lg'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-medium text-gray-900'>
                Orders ({pagination?.total || orders.length})
              </h3>
              {pagination && (
                <div className='flex items-center space-x-4'>
                  <div className='flex items-center space-x-2'>
                    <label htmlFor='limit-select' className='text-sm text-gray-700'>
                      Show:
                    </label>
                    <select
                      id='limit-select'
                      value={filters.limit || 10}
                      onChange={(e) => handleLimitChange(Number(e.target.value))}
                      className='px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >  
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  {pagination.totalPages > 1 && (
                    <div className='text-sm text-gray-500'>
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                  )}
                </div>
              )}
            </div>
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
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group relative'
                    onClick={() => handleSort('orderNumber')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort('orderNumber');
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label={`Sort by order number ${filters.sortField === 'orderNumber' ? `(${filters.sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className='flex items-center space-x-1 group-hover:text-gray-700'>
                      <span>Order</span>
                      {getSortIndicator('orderNumber')}
                    </div>
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group'
                    onClick={() => handleSort('customer')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort('customer');
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label={`Sort by customer name ${filters.sortField === 'customer' ? `(${filters.sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className='flex items-center space-x-1 group-hover:text-gray-700'>
                      <span>Customer</span>
                      {getSortIndicator('customer')}
                    </div>
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group'
                    onClick={() => handleSort('customerEmail')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort('customerEmail');
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label={`Sort by customer email ${filters.sortField === 'customerEmail' ? `(${filters.sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className='flex items-center space-x-1 group-hover:text-gray-700'>
                      <span>Email</span>
                      {getSortIndicator('customerEmail')}
                    </div>
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group'
                    onClick={() => handleSort('customerPhone')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort('customerPhone');
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label={`Sort by customer phone ${filters.sortField === 'customerPhone' ? `(${filters.sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className='flex items-center space-x-1 group-hover:text-gray-700'>
                      <span>Phone</span>
                      {getSortIndicator('customerPhone')}
                    </div>
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group'
                    onClick={() => handleSort('status')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort('status');
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label={`Sort by status ${filters.sortField === 'status' ? `(${filters.sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className='flex items-center space-x-1 group-hover:text-gray-700'>
                      <span>Status</span>
                      {getSortIndicator('status')}
                    </div>
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group'
                    onClick={() => handleSort('serviceType')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort('serviceType');
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label={`Sort by service type ${filters.sortField === 'serviceType' ? `(${filters.sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className='flex items-center space-x-1 group-hover:text-gray-700'>
                      <span>Service Type</span>
                      {getSortIndicator('serviceType')}
                    </div>
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group'
                    onClick={() => handleSort('paymentStatus')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort('paymentStatus');
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label={`Sort by payment status ${filters.sortField === 'paymentStatus' ? `(${filters.sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className='flex items-center space-x-1 group-hover:text-gray-700'>
                      <span>Payment</span>
                      {getSortIndicator('paymentStatus')}
                    </div>
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group'
                    onClick={() => handleSort('total')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort('total');
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label={`Sort by total amount ${filters.sortField === 'total' ? `(${filters.sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className='flex items-center space-x-1 group-hover:text-gray-700'>
                      <span>Total</span>
                      {getSortIndicator('total')}
                    </div>
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group'
                    onClick={() => handleSort('createdAt')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort('createdAt');
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label={`Sort by date ${filters.sortField === 'createdAt' ? `(${filters.sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className='flex items-center space-x-1 group-hover:text-gray-700'>
                      <span>Date</span>
                      {getSortIndicator('createdAt')}
                    </div>
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group'
                    onClick={() => handleSort('pickupTime')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort('pickupTime');
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label={`Sort by pickup time ${filters.sortField === 'pickupTime' ? `(${filters.sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className='flex items-center space-x-1 group-hover:text-gray-700'>
                      <span>Pickup Time</span>
                      {getSortIndicator('pickupTime')}
                    </div>
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group'
                    onClick={() => handleSort('deliveryTime')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort('deliveryTime');
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    aria-label={`Sort by delivery time ${filters.sortField === 'deliveryTime' ? `(${filters.sortOrder === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                  >
                    <div className='flex items-center space-x-1 group-hover:text-gray-700'>
                      <span>Delivery Time</span>
                      {getSortIndicator('deliveryTime')}
                    </div>
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
                    <td colSpan={12} className='px-6 py-4 text-center'>
                      <div
                        className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'
                        aria-label='Loading orders'
                      ></div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className='px-6 py-4 text-center text-gray-500'
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {order.orderNumber}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {order.customer
                          ? `${order.customer.firstName} ${order.customer.lastName}`
                          : 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {order.customerEmail || order.customer?.email || 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {order.customerPhone || order.customer?.phone || 'N/A'}
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
                            {formatUTCForDisplay(order.pickupStartTime.toString())}
                          </div>
                          <div className='text-xs text-gray-400'>
                            {formatUTCForTimeDisplay(order.pickupStartTime.toString())}
                          </div>
                        </div>
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

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className='px-6 py-4 border-t border-gray-200'>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-gray-700'>
                  Showing{' '}
                  {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{' '}
                  of {pagination.total} results
                </div>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
