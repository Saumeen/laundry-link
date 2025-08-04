'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { useOrdersStore } from '@/customer/stores/ordersStore';
import { useWalletStore } from '@/customer/stores/walletStore';
import { useAuth } from '@/hooks/useAuth';
import type { OrderWithDetails } from '@/shared/types/customer';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ORDER_PLACED: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PICKUP_ASSIGNED: 'Pickup Assigned',
  PICKUP_IN_PROGRESS: 'Pickup In Progress',
  PICKUP_COMPLETED: 'Pickup Completed',
  PICKUP_FAILED: 'Pickup Failed',
  DROPPED_OFF: 'Dropped Off',
  RECEIVED_AT_FACILITY: 'Received at Facility',
  PROCESSING_STARTED: 'Processing Started',
  PROCESSING_COMPLETED: 'Processing Completed',
  QUALITY_CHECK: 'Quality Check',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  DELIVERY_ASSIGNED: 'Delivery Assigned',
  DELIVERY_IN_PROGRESS: 'Delivery In Progress',
  DELIVERED: 'Delivered',
  DELIVERY_FAILED: 'Delivery Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  PARTIAL_REFUND: 'Partial Refund',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

const DashboardContent: React.FC = () => {
  const router = useRouter();
  const {
    orders,
    loading,
    fetchOrders,
  } = useOrdersStore();

  const { balance, fetchWalletInfo } = useWalletStore();
  const { customer } = useAuth();

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>(
    'all'
  );

  useEffect(() => {
    const filters: any = {};
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    if (paymentFilter !== 'all') {
      filters.paymentStatus = paymentFilter;
    }
    fetchOrders(filters);
  }, [statusFilter, paymentFilter, fetchOrders]);

  useEffect(() => {
    if (customer?.id) {
      fetchWalletInfo(customer.id);
    }
  }, [customer?.id, fetchWalletInfo]);

  const handleOrderClick = (order: OrderWithDetails) => {
    router.push(`/customer/orders/${order.id}`);
  };

  const handlePayNow = (order: OrderWithDetails, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent order details from opening
    if (canPayWithWallet(order)) {
      router.push(`/customer/orders/${order.id}?tab=invoice`);
    } else {
      router.push(`/customer/orders/${order.id}?tab=invoice&topup=true`);
    }
  };

  const getStatusOptions = () => {
    return [
      { value: 'all', label: 'All Statuses' },
      ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  };

  const getPaymentOptions = () => {
    return [
      { value: 'all', label: 'All Payments' },
      ...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} BD`;
  };

  const requiresPayment = (order: OrderWithDetails) => {
    // Payment is required when invoice is generated and there's an amount to pay
    return (
      order.invoiceGenerated &&
      order.paymentStatus === PaymentStatus.PENDING && 
      (order.invoiceTotal || 0) > 0
    );
  };

  const canPayWithWallet = (order: OrderWithDetails) => {
    return balance >= (order.invoiceTotal || 0);
  };

  const getPaymentButtonText = (order: OrderWithDetails) => {
    if (!order.invoiceGenerated) {
      return 'Invoice Pending';
    }
    if (canPayWithWallet(order)) {
      return 'Pay with Wallet';
    }
    return 'Top Up & Pay';
  };

  const getPaymentStatusMessage = (order: OrderWithDetails) => {
    if (!order.invoiceGenerated) {
      return 'Invoice not generated yet';
    }
    if (order.paymentStatus === PaymentStatus.PENDING && (order.invoiceTotal || 0) > 0) {
      if (canPayWithWallet(order)) {
        return 'You can pay this order using your wallet balance';
      }
      return 'Payment required for this order';
    }
    return '';
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>My Orders</h1>
        <p className='mt-2 text-gray-600'>
          Track your laundry orders and their status
        </p>
        
        {/* Wallet Balance Display */}
        <div className='mt-4 bg-blue-50 p-4 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-blue-900'>Wallet Balance</h3>
              <p className='text-blue-700'>Available for payments</p>
            </div>
            <div className='text-right'>
              <div className='text-2xl font-bold text-blue-900'>{formatCurrency(balance)}</div>
              <p className='text-sm text-blue-600'>Current Balance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='mb-6 flex flex-wrap gap-4'>
        <div>
          <label
            htmlFor='statusFilter'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Order Status
          </label>
          <select
            id='statusFilter'
            value={statusFilter}
            onChange={e =>
              setStatusFilter(e.target.value as OrderStatus | 'all')
            }
            className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          >
            {getStatusOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor='paymentFilter'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Payment Status
          </label>
          <select
            id='paymentFilter'
            value={paymentFilter}
            onChange={e =>
              setPaymentFilter(e.target.value as PaymentStatus | 'all')
            }
            className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
          >
            {getPaymentOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className='bg-white shadow overflow-hidden sm:rounded-md'>
        <ul className='divide-y divide-gray-200'>
          {orders.length === 0 ? (
            <li className='px-6 py-12 text-center'>
              <div className='text-gray-500'>
                <svg
                  className='mx-auto h-12 w-12 text-gray-400'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  aria-hidden='true'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                <h3 className='mt-2 text-sm font-medium text-gray-900'>
                  No orders
                </h3>
                <p className='mt-1 text-sm text-gray-500'>
                  Get started by creating a new order.
                </p>
              </div>
            </li>
          ) : (
            orders.map(order => (
              <li
                key={order.id}
                className='px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors'
                onClick={() => handleOrderClick(order)}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <div className='flex-shrink-0'>
                      <div className='h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center'>
                        <span className='text-white font-semibold text-lg'>
                          📦
                        </span>
                      </div>
                    </div>
                    <div className='ml-4'>
                      <div className='text-sm font-medium text-gray-900'>
                        Order #{order.orderNumber}
                      </div>
                      <div className='text-sm text-gray-500'>
                        Created on{' '}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className='flex items-center space-x-2 mt-1'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentColor(
                            order.paymentStatus
                          )}`}
                        >
                          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm font-medium text-gray-900'>
                      {formatCurrency(order.invoiceTotal || 0)}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {order.items?.length || 0} services
                    </div>
                    {requiresPayment(order) && (
                      <div className='mt-2 space-y-1'>
                        {canPayWithWallet(order) ? (
                          <button
                            onClick={e => handlePayNow(order, e)}
                            className='px-4 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors'
                          >
                            {getPaymentButtonText(order)}
                          </button>
                        ) : (
                          <div className='text-xs text-red-600'>
                            Insufficient balance
                          </div>
                        )}
                        <p className='text-xs text-gray-500'>
                          {getPaymentStatusMessage(order)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

const getStatusColor = (status: OrderStatus) => {
  const statusColors: Record<OrderStatus, string> = {
    ORDER_PLACED: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    PICKUP_ASSIGNED: 'bg-purple-100 text-purple-800',
    PICKUP_IN_PROGRESS: 'bg-orange-100 text-orange-800',
    PICKUP_COMPLETED: 'bg-teal-100 text-teal-800',
    PICKUP_FAILED: 'bg-red-100 text-red-800',
    DROPPED_OFF: 'bg-indigo-100 text-indigo-800',
    RECEIVED_AT_FACILITY: 'bg-cyan-100 text-cyan-800',
    PROCESSING_STARTED: 'bg-yellow-100 text-yellow-800',
    PROCESSING_COMPLETED: 'bg-emerald-100 text-emerald-800',
    QUALITY_CHECK: 'bg-violet-100 text-violet-800',
    READY_FOR_DELIVERY: 'bg-green-100 text-green-800',
    DELIVERY_ASSIGNED: 'bg-blue-100 text-blue-800',
    DELIVERY_IN_PROGRESS: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-gray-100 text-gray-800',
    DELIVERY_FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-red-100 text-red-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

const getPaymentColor = (status: PaymentStatus) => {
  const paymentColors: Record<PaymentStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    PARTIAL_REFUND: 'bg-red-100 text-red-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };
  return paymentColors[status] || 'bg-gray-100 text-gray-800';
};

export default DashboardContent;
