'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Import the address management component
import AddressManagement from '@/components/AddressManagement';

interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  walletBalance: number;
  createdAt?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  pickupTime: string;
  serviceType: string;
  createdAt: string;
}

interface Address {
  id: number;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  area?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  isDefault: boolean;
  locationType?: string;
  contactNumber?: string;
}

function DashboardContent() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user is logged in
    const customerData = localStorage.getItem('customer');
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (!customerData || isLoggedIn !== 'true') {
      router.push('/registerlogin');
      return;
    }

    const parsedCustomer = JSON.parse(customerData);
    
    // Check for tab parameter
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }

    // Fetch fresh customer data from database
    fetchCustomerData(parsedCustomer.email);
  }, [router, searchParams]);

  const fetchCustomerData = async (email: string) => {
    try {
      // Fetch fresh customer data from database
      const customerResponse = await fetch(`/api/customer/profile?email=${encodeURIComponent(email)}`);
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        setCustomer(customerData.customer);
        
        // Update localStorage with fresh data
        localStorage.setItem('customer', JSON.stringify(customerData.customer));
      } else {
        // Fallback to localStorage data if API fails
        const localCustomer = JSON.parse(localStorage.getItem('customer') || '{}');
        setCustomer(localCustomer);
      }

      // Fetch orders and addresses
      await Promise.all([
        fetchOrders(email),
        fetchAddresses(email)
      ]);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      // Fallback to localStorage data
      const localCustomer = JSON.parse(localStorage.getItem('customer') || '{}');
      setCustomer(localCustomer);
      
      // Still try to fetch orders and addresses
      await Promise.all([
        fetchOrders(email),
        fetchAddresses(email)
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (email: string) => {
    try {
      const response = await fetch(`/api/customer/orders?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchAddresses = async (email: string) => {
    try {
      const response = await fetch(`/api/customer/addresses?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMemberSince = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Order Placed': 'bg-blue-100 text-blue-800',
      'Picked Up': 'bg-yellow-100 text-yellow-800',
      'In Process': 'bg-purple-100 text-purple-800',
      'Ready for Delivery': 'bg-green-100 text-green-800',
      'Delivered': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDefaultAddress = () => {
    const defaultAddr = addresses.find(addr => addr.isDefault);
    if (!defaultAddr) return 'No default address set';
    
    let formatted = defaultAddr.addressLine1 || defaultAddr.address || '';
    if (defaultAddr.addressLine2) formatted += `, ${defaultAddr.addressLine2}`;
    if (defaultAddr.city) formatted += `, ${defaultAddr.city}`;
    return formatted || 'Address not available';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {customer.firstName}!
          </h1>
          <p className="text-gray-600">Manage your orders, addresses, and account settings</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'orders', name: 'My Orders', icon: '📦' },
              { id: 'addresses', name: 'Addresses', icon: '🏠' },
              { id: 'wallet', name: 'Wallet', icon: '💰' },
              { id: 'packages', name: 'Packages', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Your Information Section */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Name</label>
                      <p className="text-lg text-gray-900">{customer.firstName} {customer.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="text-lg text-gray-900">{customer.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Contact Number</label>
                      <p className="text-lg text-gray-900">{customer.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Member Since</label>
                      <p className="text-lg text-gray-900">{formatMemberSince(customer.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Default Address</label>
                      <p className="text-lg text-gray-900">{getDefaultAddress()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">💰</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Wallet Balance</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {customer.walletBalance.toFixed(3)} BD
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">📦</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Orders</p>
                      <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 font-semibold">⏳</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Orders</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {orders.filter(order => !['Delivered', 'Cancelled'].includes(order.status)).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">✅</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Completed Orders</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {orders.filter(order => order.status === 'Delivered').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                </div>
                <div className="p-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No orders yet</p>
                      <button
                        onClick={() => router.push('/schedule')}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                      >
                        Place Your First Order
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium text-gray-900">#{order.orderNumber}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {order.serviceType} • {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{order.totalAmount.toFixed(3)} BD</p>
                          </div>
                        </div>
                      ))}
                      {orders.length > 3 && (
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="w-full text-center py-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View All Orders
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">My Orders</h3>
              </div>
              <div className="p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No orders yet</p>
                    <button
                      onClick={() => router.push('/schedule')}
                      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                    >
                      Place Your First Order
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">Order #{order.orderNumber}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900">{order.totalAmount.toFixed(3)} BD</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Service:</span> {order.serviceType}
                          </div>
                          <div>
                            <span className="font-medium">Pickup:</span> {formatDate(order.pickupTime)}
                          </div>
                          <div>
                            <span className="font-medium">Placed:</span> {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-lg shadow p-6">
              <AddressManagement />
            </div>
          )}

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Wallet</h3>
              </div>
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    {customer.walletBalance.toFixed(3)} BD
                  </h4>
                  <p className="text-gray-600">Current Balance</p>
                  <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                    Add Funds
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Packages Tab */}
          {activeTab === 'packages' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Packages</h3>
              </div>
              <div className="p-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">No packages available</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

