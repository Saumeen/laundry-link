'use client';

import { useState, useEffect, Suspense, useMemo, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layouts/main-layout';

// Import the address management component
import AddressManagement from '@/components/AddressManagement';
import OrderDetailsModal from '@/components/OrderDetailsModal';

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

interface CustomerResponse {
  customer: Customer;
}

interface OrdersResponse {
  orders: Order[];
}

interface AddressesResponse {
  addresses: Address[];
}

// Memoized tab configuration
const TAB_CONFIG = [
  { id: 'overview', name: 'Overview', icon: '📊' },
  { id: 'orders', name: 'My Orders', icon: '📦' },
  { id: 'addresses', name: 'Addresses', icon: '🏠' },
  { id: 'wallet', name: 'Wallet', icon: '💰' },
  { id: 'packages', name: 'Packages', icon: '📋' },
] as const;

// Memoized status color mapping
const STATUS_COLORS = {
  'Order Placed': 'bg-blue-100 text-blue-800',
  'Picked Up': 'bg-yellow-100 text-yellow-800',
  'In Process': 'bg-purple-100 text-purple-800',
  'Ready for Delivery': 'bg-green-100 text-green-800',
  'Delivered': 'bg-gray-100 text-gray-800',
} as const;

// Memoized Stats Card Component
const StatsCard = memo(({ 
  icon, 
  title, 
  value, 
  bgColor, 
  textColor 
}: {
  icon: string;
  title: string;
  value: string | number;
  bgColor: string;
  textColor: string;
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center`}>
          <span className={`${textColor} font-semibold`}>{icon}</span>
        </div>
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
));

StatsCard.displayName = 'StatsCard';

// Memoized Order Item Component
const OrderItem = memo(({ 
  order, 
  onViewOrder 
}: {
  order: Order;
  onViewOrder: (orderId: number) => void;
}) => {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
  }, []);

  return (
    <div 
      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer" 
      onClick={() => onViewOrder(order.id)}
    >
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
        <button 
          className="text-blue-600 hover:text-blue-800 text-sm mt-1"
          onClick={(e) => {
            e.stopPropagation();
            onViewOrder(order.id);
          }}
        >
          View Details →
        </button>
      </div>
    </div>
  );
});

OrderItem.displayName = 'OrderItem';

// Memoized Detailed Order Item Component
const DetailedOrderItem = memo(({ 
  order, 
  onViewOrder 
}: {
  order: Order;
  onViewOrder: (orderId: number) => void;
}) => {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
  }, []);

  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" 
      onClick={() => onViewOrder(order.id)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <h4 className="font-medium text-gray-900">Order #{order.orderNumber}</h4>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
        <div className="text-right">
          <p className="font-medium text-gray-900">{order.totalAmount.toFixed(3)} BD</p>
          <button 
            className="text-blue-600 hover:text-blue-800 text-sm mt-1"
            onClick={(e) => {
              e.stopPropagation();
              onViewOrder(order.id);
            }}
          >
            View Details →
          </button>
        </div>
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
  );
});

DetailedOrderItem.displayName = 'DetailedOrderItem';

// Memoized Tab Button Component
const TabButton = memo(({ 
  tab, 
  isActive, 
  onClick 
}: {
  tab: typeof TAB_CONFIG[number];
  isActive: boolean;
  onClick: (tabId: string) => void;
}) => (
  <button
    onClick={() => onClick(tab.id)}
    className={`py-2 px-1 border-b-2 font-medium text-sm ${
      isActive
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    <span className="mr-2">{tab.icon}</span>
    {tab.name}
  </button>
));

TabButton.displayName = 'TabButton';

function DashboardContent() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const { isAuthenticated, customer: authCustomer, isLoading: authLoading } = useAuth();

  // Memoized utility functions
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatMemberSince = useCallback((dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
  }, []);

  const getDefaultAddress = useCallback(() => {
    const defaultAddr = addresses.find(addr => addr.isDefault);
    if (!defaultAddr) return 'No default address set';
    
    let formatted = defaultAddr.addressLine1 || '';
    if (defaultAddr.addressLine2) formatted += `, ${defaultAddr.addressLine2}`;
    if (defaultAddr.city) formatted += `, ${defaultAddr.city}`;
    return formatted || 'Address not available';
  }, [addresses]);

  const handleViewOrder = useCallback((orderId: number) => {
    setSelectedOrderId(orderId);
    setIsOrderModalOpen(true);
  }, []);

  const handleCloseOrderModal = useCallback(() => {
    setIsOrderModalOpen(false);
    setSelectedOrderId(null);
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const handleScheduleOrder = useCallback(() => {
    router.push('/schedule');
  }, [router]);

  const handleViewAllOrders = useCallback(() => {
    setActiveTab('orders');
  }, []);

  // Memoized data calculations
  const statsData = useMemo(() => {
    // Note: These stats are based on the 3 most recently updated orders we fetched
    // For accurate stats, the API should return total counts
    const activeOrders = orders.filter(order => !['Delivered', 'Cancelled'].includes(order.status)).length;
    const completedOrders = orders.filter(order => order.status === 'Delivered').length;
    
    return [
      {
        icon: '💰',
        title: 'Wallet Balance',
        value: `${customer?.walletBalance.toFixed(3) || '0.000'} BD`,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600'
      },
      {
        icon: '📦',
        title: 'Recent Orders',
        value: orders.length,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
      },
      {
        icon: '⏳',
        title: 'Active Orders',
        value: activeOrders,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600'
      },
      {
        icon: '✅',
        title: 'Completed Orders',
        value: completedOrders,
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600'
      }
    ];
  }, [customer?.walletBalance, orders]);

  const recentOrders = useMemo(() => {
    return orders;
  }, [orders]);

  const hasMoreOrders = useMemo(() => {
    // Since we're only fetching 3 orders, we'll always show "View All Orders"
    // This could be improved by adding a total count from the API
    return orders.length === 3;
  }, [orders.length]);

  useEffect(() => {
    console.log('Dashboard auth state:', { 
      authLoading, 
      sessionStatus, 
      isAuthenticated, 
      hasAuthCustomer: !!authCustomer,
      sessionUser: !!session?.user 
    });

    // Wait for authentication to be determined
    if (authLoading || sessionStatus === 'loading') {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push('/registerlogin');
      return;
    }

    // Handle authenticated customers from useAuth hook
    if (authCustomer) {
      console.log('Setting customer from authCustomer:', authCustomer);
      setCustomer(authCustomer);
      
      // Check for tab parameter
      const tab = searchParams.get('tab');
      if (tab) {
        setActiveTab(tab);
      }

      // Fetch fresh customer data from database
      fetchCustomerData();
      return;
    }

    // If we get here, user is not authenticated
    console.log('No authCustomer found, redirecting to login');
    router.push('/registerlogin');
  }, [isAuthenticated, authCustomer, authLoading, session, sessionStatus, router, searchParams]);

  // Separate useEffect to handle URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    console.log('URL tab parameter:', tab); // Debug log
    if (tab && ['overview', 'orders', 'addresses', 'wallet', 'packages'].includes(tab)) {
      console.log('Setting active tab to:', tab); // Debug log
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchCustomerData = useCallback(async () => {
    try {
      // Fetch fresh customer data from database
      const customerResponse = await fetch('/api/customer/profile');
      if (customerResponse.ok) {
        const customerData = await customerResponse.json() as CustomerResponse;
        if (customerData && typeof customerData === 'object' && 'customer' in customerData && customerData.customer) {
          setCustomer(customerData.customer as Customer);
        }
      }

      // Fetch orders and addresses
      await Promise.all([
        fetchOrders(),
        fetchAddresses()
      ]);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/customer/orders?limit=3&sort=updatedAt&order=desc');
      if (response.ok) {
        const data = await response.json() as OrdersResponse;
        if (data && typeof data === 'object' && 'orders' in data && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, []);

  const fetchAddresses = useCallback(async () => {
    try {
      const response = await fetch('/api/customer/addresses');
      if (response.ok) {
        const data = await response.json() as AddressesResponse;
        if (data && typeof data === 'object' && 'addresses' in data && Array.isArray(data.addresses)) {
          setAddresses(data.addresses);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {TAB_CONFIG.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={handleTabChange}
              />
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
                {statsData.map((stat, index) => (
                  <StatsCard
                    key={index}
                    icon={stat.icon}
                    title={stat.title}
                    value={stat.value}
                    bgColor={stat.bgColor}
                    textColor={stat.textColor}
                  />
                ))}
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
                        onClick={handleScheduleOrder}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                      >
                        Place Your First Order
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <OrderItem
                          key={order.id}
                          order={order}
                          onViewOrder={handleViewOrder}
                        />
                      ))}
                      {hasMoreOrders && (
                        <button
                          onClick={handleViewAllOrders}
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
                      onClick={handleScheduleOrder}
                      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                    >
                      Place Your First Order
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <DetailedOrderItem
                        key={order.id}
                        order={order}
                        onViewOrder={handleViewOrder}
                      />
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

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        orderId={selectedOrderId}
      />
    </div>
  );
}

// Memoize the main dashboard component
const MemoizedDashboardContent = memo(DashboardContent);
MemoizedDashboardContent.displayName = 'DashboardContent';

export default function CustomerDashboard() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <MemoizedDashboardContent />
      </Suspense>
    </MainLayout>
  );
}

