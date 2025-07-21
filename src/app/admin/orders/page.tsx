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
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
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
          </div>
        }
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
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