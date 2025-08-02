'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFacilityTeamAuth } from '@/admin/hooks/useAdminAuth';

import {
  getStatusBadgeColor,
  getStatusDisplayName,
  formatDate,
  formatCurrency,
} from '@/admin/utils/orderUtils';
import { formatUTCForDisplay, formatUTCForTimeDisplay } from '@/lib/utils/timezone';
import { ProcessingStatus } from '@prisma/client';

interface Order {
  id: number;
  orderNumber: string;
  customer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  status: string;
  pickupStartTime: string;
  pickupEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  specialInstructions?: string;
  invoiceTotal?: number;
  isExpressService: boolean;
  createdAt: string;
  orderProcessing?: {
    id: number;
    processingStatus: string;
    totalPieces?: number;
    totalWeight?: number;
    processingNotes?: string;
    qualityScore?: number;
  };
  orderServiceMappings: Array<{
    id: number;
    quantity: number;
    service: {
      id: number;
      name: string;
      displayName: string;
    };
    orderItems: Array<{
      id: number;
      itemName: string;
      itemType: string;
      quantity: number;
      pricePerItem: number;
      totalPrice: number;
    }>;
  }>;
}

interface ProcessingPageState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  processingOrderId: number | null;
  filters: {
    status: string;
    search: string;
    dateRange: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ProcessingPage() {
  const router = useRouter();
  const { user, isLoading, isAuthorized, logout } = useFacilityTeamAuth();
  const [state, setState] = useState<ProcessingPageState>({
    orders: [],
    loading: false,
    error: null,
    processingOrderId: null,
    filters: {
      status: 'all',
      search: '',
      dateRange: 'today',
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  });

  const fetchOrders = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams({
        page: state.pagination.page.toString(),
        limit: state.pagination.limit.toString(),
        status: state.filters.status,
        search: state.filters.search,
        dateRange: state.filters.dateRange,
      });

      const response = await fetch(`/api/admin/facility-team/orders?${params}`);
      if (response.ok) {
        const data = (await response.json()) as {
          orders: Order[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        };
        setState(prev => ({
          ...prev,
          orders: data.orders,
          pagination: data.pagination,
          loading: false,
        }));
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch orders',
        loading: false,
      }));
    }
  }, [state.filters, state.pagination.page, state.pagination.limit]);

  useEffect(() => {
    if (isAuthorized) {
      fetchOrders();
    }
  }, [isAuthorized, fetchOrders]);

  const handleFilterChange = (
    filterType: keyof typeof state.filters,
    value: string
  ) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterType]: value },
      pagination: { ...prev.pagination, page: 1 },
    }));
  };

  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page },
    }));
  };

  const handleProcessOrder = (order: Order) => {
    router.push(`/admin/facility-team/process/${order.id}`);
  };

  const handleMarkAsReceived = async (order: Order) => {
    try {
      const response = await fetch('/api/admin/facility-team/receive-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          notes: 'Order received at facility',
        }),
      });

      if (response.ok) {
        // Refresh the orders list
        fetchOrders();
        // Show success message
        console.log('Order marked as received successfully');
      } else {
        const errorData = (await response.json()) as { error?: string };
        console.error('Failed to mark order as received:', errorData.error);
      }
    } catch (error) {
      console.error('Error marking order as received:', error);
    }
  };

  const getProcessingStatusColor = (status: string) => {
    switch (status) {
      case ProcessingStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ProcessingStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case ProcessingStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ProcessingStatus.QUALITY_CHECK:
        return 'bg-purple-100 text-purple-800';
      case ProcessingStatus.READY_FOR_DELIVERY:
        return 'bg-indigo-100 text-indigo-800';
      case ProcessingStatus.ISSUE_REPORTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProcessingStatusDisplayName = (status: string) => {
    switch (status) {
      case ProcessingStatus.PENDING:
        return 'Pending';
      case ProcessingStatus.IN_PROGRESS:
        return 'In Progress';
      case ProcessingStatus.COMPLETED:
        return 'Completed';
      case ProcessingStatus.QUALITY_CHECK:
        return 'Quality Check';
      case ProcessingStatus.READY_FOR_DELIVERY:
        return 'Ready for Delivery';
      case ProcessingStatus.ISSUE_REPORTED:
        return 'Issue Reported';
      default:
        return status;
    }
  };

  const getOrderPriority = (order: Order) => {
    // Check if this is an express order
    const isExpressOrder = order.orderServiceMappings?.some(
      mapping => mapping.service.name === 'express-service'
    );

    // Priority based on order status and processing status
    if (order.status === 'DELIVERED') {
      return 'completed'; // Completed orders
    }
    if (['DELIVERY_ASSIGNED', 'DELIVERY_IN_PROGRESS'].includes(order.status)) {
      return 'low'; // In delivery - low priority for facility team
    }
    if (order.status === 'PICKUP_COMPLETED' && !order.orderProcessing) {
      return isExpressOrder ? 'urgent' : 'high'; // Express orders get urgent priority
    }
    if (order.status === 'RECEIVED_AT_FACILITY' && !order.orderProcessing) {
      return isExpressOrder ? 'urgent' : 'medium'; // Express orders get urgent priority
    }
    if (
      order.orderProcessing?.processingStatus === ProcessingStatus.IN_PROGRESS
    ) {
      return isExpressOrder ? 'high' : 'medium'; // Express orders get higher priority
    }
    if (
      order.orderProcessing?.processingStatus === ProcessingStatus.QUALITY_CHECK
    ) {
      return isExpressOrder ? 'medium' : 'low'; // Express orders get higher priority
    }
    return isExpressOrder ? 'high' : 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
                Order Processing
              </h1>
              <p className='mt-1 text-sm text-gray-500'>
                Manage and track orders from facility receipt through completion
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-500'>
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={() => router.push('/admin/facility-team')}
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
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Processing Stats */}
        <div className='grid grid-cols-1 md:grid-cols-6 gap-6 mb-6'>
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center'>
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
                </div>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>
                  Ready for Processing
                </p>
                <p className='text-2xl font-semibold text-gray-900'>
                  {
                    state.orders.filter(
                      order =>
                        order.status === 'RECEIVED_AT_FACILITY' &&
                        !order.orderProcessing
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center'>
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
                </div>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>
                  In Processing
                </p>
                <p className='text-2xl font-semibold text-gray-900'>
                  {
                    state.orders.filter(
                      order =>
                        order.orderProcessing?.processingStatus ===
                        ProcessingStatus.IN_PROGRESS
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-green-500 rounded-md flex items-center justify-center'>
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
                </div>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>
                  Ready for Delivery
                </p>
                <p className='text-2xl font-semibold text-gray-900'>
                  {
                    state.orders.filter(
                      order =>
                        order.orderProcessing?.processingStatus ===
                        ProcessingStatus.READY_FOR_DELIVERY
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center'>
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
                      d='M13 10V3L4 14h7v7l9-11h-7z'
                    />
                  </svg>
                </div>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>In Delivery</p>
                <p className='text-2xl font-semibold text-gray-900'>
                  {
                    state.orders.filter(order =>
                      ['DELIVERY_ASSIGNED', 'DELIVERY_IN_PROGRESS'].includes(
                        order.status
                      )
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center'>
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
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>Completed</p>
                <p className='text-2xl font-semibold text-gray-900'>
                  {
                    state.orders.filter(order => order.status === 'DELIVERED')
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-red-500 rounded-md flex items-center justify-center'>
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
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                    />
                  </svg>
                </div>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>
                  Issues Reported
                </p>
                <p className='text-2xl font-semibold text-gray-900'>
                  {
                    state.orders.filter(
                      order =>
                        order.orderProcessing?.processingStatus ===
                        ProcessingStatus.ISSUE_REPORTED
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white shadow rounded-lg mb-6'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>Filters</h3>
          </div>
          <div className='px-6 py-4'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {/* Status Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Processing Status
                </label>
                <select
                  value={state.filters.status}
                  onChange={e => handleFilterChange('status', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='all'>All Orders</option>
                  <option value='picked_up'>Picked Up</option>
                  <option value='received'>Received at Facility</option>
                  <option value='ready_for_processing'>
                    Ready for Processing
                  </option>
                  <option value='in_processing'>In Processing</option>
                  <option value='quality_check'>Quality Check</option>
                  <option value='ready_for_delivery'>Ready for Delivery</option>
                  <option value='in_delivery'>In Delivery</option>
                  <option value='completed'>Completed</option>
                  <option value='issue_reported'>Issue Reported</option>
                </select>
              </div>

              {/* Search Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Search Orders
                </label>
                <input
                  type='text'
                  placeholder='Order number, customer name...'
                  value={state.filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              {/* Date Range Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Date Range
                </label>
                <select
                  value={state.filters.dateRange}
                  onChange={e =>
                    handleFilterChange('dateRange', e.target.value)
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='today'>Today</option>
                  <option value='yesterday'>Yesterday</option>
                  <option value='week'>This Week</option>
                  <option value='month'>This Month</option>
                  <option value='all'>All Time</option>
                </select>
              </div>

              {/* Refresh Button */}
              <div className='flex items-end'>
                <button
                  onClick={fetchOrders}
                  disabled={state.loading}
                  className='w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {state.loading ? 'Loading...' : 'Refresh'}
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
                Orders ({state.pagination.total})
              </h3>
              <div className='text-sm text-gray-500'>
                Page {state.pagination.page} of {state.pagination.totalPages}
              </div>
            </div>
          </div>

          {state.error && (
            <div className='px-6 py-4 bg-red-50 border-b border-red-200'>
              <div className='text-red-800'>{state.error}</div>
            </div>
          )}

          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Priority
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Order
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Customer
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Order Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Processing Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Services
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Total
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Pickup Time
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
                {state.loading ? (
                  <tr>
                    <td colSpan={10} className='px-6 py-4 text-center'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                    </td>
                  </tr>
                ) : state.orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className='px-6 py-4 text-center text-gray-500'
                    >
                      No orders found matching your criteria
                    </td>
                  </tr>
                ) : (
                  state.orders.map(order => {
                    const priority = getOrderPriority(order);
                    return (
                      <tr key={order.id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(priority)}`}
                          >
                            {priority.toUpperCase()}
                          </span>
                        </td>
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
                          <div>
                            <div className='font-medium'>
                              {order.customer
                                ? `${order.customer.firstName} ${order.customer.lastName}`
                                : 'N/A'}
                            </div>
                            <div className='text-gray-500 text-xs'>
                              {order.customer?.email || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}
                          >
                            {getStatusDisplayName(order.status)}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          {order.status === 'DELIVERED' ? (
                            <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800'>
                              Completed
                            </span>
                          ) : order.status === 'DELIVERY_ASSIGNED' ? (
                            <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800'>
                              Delivery Assigned
                            </span>
                          ) : order.status === 'DELIVERY_IN_PROGRESS' ? (
                            <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800'>
                              In Delivery
                            </span>
                          ) : order.orderProcessing ? (
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProcessingStatusColor(order.orderProcessing.processingStatus)}`}
                            >
                              {getProcessingStatusDisplayName(
                                order.orderProcessing.processingStatus
                              )}
                            </span>
                          ) : (
                            <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800'>
                              Not Started
                            </span>
                          )}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          <div className='space-y-1'>
                            {order.orderServiceMappings.map(mapping => (
                              <div key={mapping.id} className='text-xs'>
                                {mapping.service.displayName} (x
                                {mapping.quantity})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {formatCurrency(order.invoiceTotal ?? 0)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          <div>
                            <div className='text-xs'>
                              {formatDate(order.pickupStartTime)}
                            </div>
                            <div className='text-xs text-gray-400'>
                              {new Date(
                                order.pickupStartTime
                              ).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
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
                          <div className='flex flex-col space-y-1'>
                            {order.status === 'DELIVERED' ? (
                              <button
                                onClick={() =>
                                  router.push(`/admin/facility-team/process/${order.id}`)
                                }
                                className='text-gray-600 hover:text-gray-900 font-medium text-xs'
                              >
                                View Details
                              </button>
                            ) : [
                                'DELIVERY_ASSIGNED',
                                'DELIVERY_IN_PROGRESS',
                              ].includes(order.status) ? (
                              <button
                                onClick={() =>
                                  router.push(`/admin/facility-team/process/${order.id}`)
                                }
                                className='text-indigo-600 hover:text-indigo-900 font-medium text-xs'
                              >
                                View Details
                              </button>
                            ) : (
                              <>
                                {order.status === 'PICKUP_COMPLETED' &&
                                  !order.orderProcessing && (
                                    <button
                                      onClick={() =>
                                        handleMarkAsReceived(order)
                                      }
                                      className='text-green-600 hover:text-green-900 font-medium text-xs'
                                    >
                                      Mark as Received
                                    </button>
                                  )}
                                <button
                                  onClick={() => handleProcessOrder(order)}
                                  className='text-blue-600 hover:text-blue-900 font-medium text-xs'
                                >
                                  {order.orderProcessing
                                    ? 'Continue Processing'
                                    : 'Start Processing'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {state.pagination.totalPages > 1 && (
            <div className='px-6 py-4 border-t border-gray-200'>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-gray-700'>
                  Showing{' '}
                  {(state.pagination.page - 1) * state.pagination.limit + 1} to{' '}
                  {Math.min(
                    state.pagination.page * state.pagination.limit,
                    state.pagination.total
                  )}{' '}
                  of {state.pagination.total} results
                </div>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => handlePageChange(state.pagination.page - 1)}
                    disabled={state.pagination.page === 1}
                    className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(state.pagination.page + 1)}
                    disabled={
                      state.pagination.page === state.pagination.totalPages
                    }
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
