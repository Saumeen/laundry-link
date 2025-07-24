'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/types/enums';
import OrderStatusDisplay from '@/components/OrderStatusDisplay';

interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  pickupTime: string;
  deliveryTime: string;
  invoiceTotal: number;
  createdAt: string;
  orderServiceMappings: Array<{
    service: {
      displayName: string;
    };
    quantity: number;
    price: number;
  }>;
}

interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  pickupTime: string;
  deliveryTime: string;
  invoiceTotal: number;
  createdAt: string;
  orderServiceMappings: Array<{
    service: {
      displayName: string;
    };
    quantity: number;
    price: number;
  }>;
}

const DashboardContent: React.FC = () => {
  const auth = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>(
    'all'
  );

  useEffect(() => {
    if (auth.customer && auth.isAuthenticated) {
      fetchOrders();
    }
  }, [auth.customer, auth.isAuthenticated, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (paymentFilter !== 'all') {
        params.append('paymentStatus', paymentFilter);
      }

      const response = await fetch(`/api/customer/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data as Order[]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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
        {orders.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-500 text-lg'>No orders found</p>
            <p className='text-gray-400 mt-2'>
              Your orders will appear here once you place them
            </p>
          </div>
        ) : (
          <ul className='divide-y divide-gray-200'>
            {orders.map(order => (
              <li key={order.id} className='px-6 py-4 hover:bg-gray-50'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='text-lg font-medium text-gray-900'>
                          Order #{order.orderNumber}
                        </h3>
                        <p className='text-sm text-gray-500'>
                          Created:{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-semibold text-gray-900'>
                          BD {order.invoiceTotal?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>

                    <div className='mt-2 flex items-center space-x-4'>
                      <OrderStatusDisplay status={order.status} type='order' />
                      <OrderStatusDisplay
                        status={order.paymentStatus as PaymentStatus}
                        type='payment'
                      />
                    </div>

                    <div className='mt-2 text-sm text-gray-600'>
                      <p>
                        Pickup: {new Date(order.pickupTime).toLocaleString()}
                      </p>
                      <p>
                        Delivery:{' '}
                        {new Date(order.deliveryTime).toLocaleString()}
                      </p>
                    </div>

                    <div className='mt-2'>
                      <p className='text-sm text-gray-600'>
                        Services:{' '}
                        {order.orderServiceMappings
                          .map(m => `${m.service.displayName} (${m.quantity})`)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardContent;
