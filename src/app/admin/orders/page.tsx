'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { OrderStatus, PaymentStatus, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/types/enums';
import OrderStatusDisplay from '@/components/OrderStatusDisplay';
import AdminHeader from '@/components/admin/AdminHeader';

interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  pickupTime: string;
  deliveryTime: string;
  invoiceTotal: number;
  createdAt: string;
  updatedAt: string;
}

const AdminOrdersPage: React.FC = () => {
  const router = useRouter();
  const { adminUser, loading } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (adminUser) {
      fetchOrders();
    }
  }, [adminUser]);

<<<<<<< Updated upstream
  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, paymentFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch('/api/admin/orders-detailed');
      if (response.ok) {
        const data = await response.json() as { orders: Order[]; total: number; page: number; pageSize: number };
        setOrders(data.orders);
      } else {
        // Handle error silently or show user-friendly message
        setOrders([]);
=======
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
>>>>>>> Stashed changes
      }
    } catch (error) {
      // Handle error silently or show user-friendly message
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (paymentFilter) {
      filtered = filtered.filter(order => order.paymentStatus === paymentFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerFirstName.toLowerCase().includes(term) ||
        order.customerLastName.toLowerCase().includes(term) ||
        order.customerEmail.toLowerCase().includes(term) ||
        order.customerPhone.includes(term)
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/admin/update-order/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchOrders(); // Refresh orders
      } else {
        // Handle error silently or show user-friendly message
      }
<<<<<<< Updated upstream
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
=======

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
        ['PICKUP_IN_PROGRESS', 'PICKUP_COMPLETED', 'DROPPED_OFF', 'RECEIVED_AT_FACILITY', 
         'PROCESSING_STARTED', 'PROCESSING_COMPLETED', 'QUALITY_CHECK', 
         'READY_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'DELIVERY_IN_PROGRESS'].includes(order.status)
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
>>>>>>> Stashed changes
  };

  const getBackUrl = () => {
    if (!adminUser) return '/admin';
    
    switch (adminUser.role) {
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

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!adminUser) {
    return <div className="flex justify-center items-center h-screen">Access Denied</div>;
  }

  return (
<<<<<<< Updated upstream
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        title="Order Management"
        subtitle="View and manage all customer orders"
        showBackButton={true}
        backUrl={getBackUrl()}
        rightContent={
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {adminUser?.role?.replace('_', ' ')}
            </span>
=======
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
>>>>>>> Stashed changes
          </div>
        }
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
<<<<<<< Updated upstream
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Order number, customer name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
=======
        <div className='bg-white shadow rounded-lg mb-8'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>
              Filters & Search
            </h3>
          </div>
          <div className='px-6 py-4'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
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
                  <option value='RECEIVED_AT_FACILITY'>Received at Facility</option>
                  <option value='PROCESSING_STARTED'>Processing Started</option>
                  <option value='PROCESSING_COMPLETED'>Processing Completed</option>
                  <option value='QUALITY_CHECK'>Quality Check</option>
                  <option value='READY_FOR_DELIVERY'>Ready for Delivery</option>
                  <option value='DELIVERY_ASSIGNED'>Delivery Assigned</option>
                  <option value='DELIVERY_IN_PROGRESS'>Delivery In Progress</option>
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
>>>>>>> Stashed changes

            {/* Payment Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Payment Statuses</option>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingOrders ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pickup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerFirstName} {order.customerLastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customerEmail}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusDisplay status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusDisplay status={order.paymentStatus as any} type="payment" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      BD {order.invoiceTotal?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.pickupTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.deliveryTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && !loadingOrders && (
            <div className="text-center py-8 text-gray-500">
              No orders found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage; 