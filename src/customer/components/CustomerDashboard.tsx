'use client';

import OrderDetailsModal from '@/components/OrderDetailsModal';
import { useOrdersStore, useProfileStore } from '@/customer';
import type { OrderWithDetails } from '@/shared/types/customer';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLogout } from '@/hooks/useAuth';

export function CustomerDashboard() {
  const { orders, loading, fetchOrders, selectOrder, showOrderDetails, toggleOrderDetails } = useOrdersStore();
  const { profile, fetchProfile } = useProfileStore();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const logout = useLogout();

  useEffect(() => {
    fetchOrders();
    fetchProfile();
  }, [fetchOrders, fetchProfile]);

  const handleOrderClick = (order: OrderWithDetails) => {
    selectOrder(order);
    setSelectedOrderId(order.id);
    toggleOrderDetails();
  };

  const handleCloseOrderDetails = () => {
    setSelectedOrderId(null);
    selectOrder(null);
    toggleOrderDetails();
  };

  const handleLogout = () => {
    logout();
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'ORDER_PLACED': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'PICKUP_ASSIGNED': 'bg-purple-100 text-purple-800',
      'PICKUP_IN_PROGRESS': 'bg-orange-100 text-orange-800',
      'PICKUP_COMPLETED': 'bg-teal-100 text-teal-800',
      'DROPPED_OFF': 'bg-indigo-100 text-indigo-800',
      'RECEIVED_AT_FACILITY': 'bg-cyan-100 text-cyan-800',
      'PROCESSING_STARTED': 'bg-yellow-100 text-yellow-800',
      'PROCESSING_COMPLETED': 'bg-emerald-100 text-emerald-800',
      'QUALITY_CHECK': 'bg-violet-100 text-violet-800',
      'READY_FOR_DELIVERY': 'bg-green-100 text-green-800',
      'DELIVERY_ASSIGNED': 'bg-blue-100 text-blue-800',
      'DELIVERY_IN_PROGRESS': 'bg-orange-100 text-orange-800',
      'DELIVERED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'REFUNDED': 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} BD`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">👤</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Customer Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Welcome back, {profile?.firstName} {profile?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(profile?.walletBalance || 0)}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          {/* Mobile wallet balance */}
          <div className="sm:hidden pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Wallet Balance</p>
              <p className="text-sm font-bold text-green-600">
                {formatCurrency(profile?.walletBalance || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            <Link
              href="/customer/dashboard"
              className="flex items-center px-3 py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600 whitespace-nowrap"
            >
              <span className="mr-2">📊</span>
              Dashboard
            </Link>
            <Link
              href="/customer/orders"
              className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 transition-colors whitespace-nowrap"
            >
              <span className="mr-2">📦</span>
              Orders
            </Link>
                          <Link
                href="/customer/schedule"
                className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 transition-colors whitespace-nowrap"
              >
              <span className="mr-2">📅</span>
              Schedule
            </Link>
            <Link
              href="/services"
              className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 transition-colors whitespace-nowrap"
            >
              <span className="mr-2">🧺</span>
              Services
            </Link>
            <Link
              href="/pricing"
              className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 transition-colors whitespace-nowrap"
            >
              <span className="mr-2">💰</span>
              Pricing
            </Link>
            <Link
              href="/customer/addresses"
              className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 transition-colors whitespace-nowrap"
            >
              <span className="mr-2">📍</span>
              Addresses
            </Link>
            <Link
              href="/customer/profile"
              className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 transition-colors whitespace-nowrap"
            >
              <span className="mr-2">👤</span>
              Profile
            </Link>
            <Link
              href="/faq"
              className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 transition-colors whitespace-nowrap"
            >
              <span className="mr-2">❓</span>
              FAQ
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                href="/customer/schedule" 
                className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-lg">📅</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Schedule Order</h3>
                  <p className="text-sm text-gray-600">Book a pickup & delivery</p>
                </div>
              </Link>

              <Link 
                href="/tracking" 
                className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer border border-green-200"
              >
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-lg">📍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Track Order</h3>
                  <p className="text-sm text-gray-600">Check order status</p>
                </div>
              </Link>

              <Link 
                href="/pricing" 
                className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer border border-purple-200"
              >
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-lg">💰</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">View Pricing</h3>
                  <p className="text-sm text-gray-600">See our rates</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(order => order.status === 'DELIVERED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(order => 
                    !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <Link 
                href="/customer/orders" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                View All Orders
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {orders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-6">Start by placing your first order</p>
                <Link 
                  href="/customer/schedule"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Place Order
                </Link>
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <button
                  key={order.id}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleOrderClick(order)}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatCurrency(order.invoiceTotal || 0)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {orders.length > 5 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Link 
                href="/customer/orders"
                className="w-full text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                View all {orders.length} orders
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={showOrderDetails}
        onClose={handleCloseOrderDetails}
        orderId={selectedOrderId}
      />
    </div>
  );
} 