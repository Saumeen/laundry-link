'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import DashboardAddressManagement from '@/components/DashboardAddressManagement';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import MobileBottomNav from '@/components/MobileBottomNav';
import FAB from '@/components/FAB';
import Toast from '@/components/Toast';

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
  invoiceTotal: number;
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

// Enhanced tab configuration with better icons and descriptions
const TAB_CONFIG = [
  { 
    id: 'overview', 
    name: 'Overview', 
    icon: '📊',
    description: 'Your dashboard summary'
  },
  { 
    id: 'orders', 
    name: 'My Orders', 
    icon: '📦',
    description: 'Track your laundry orders'
  },
  { 
    id: 'addresses', 
    name: 'Addresses', 
    icon: '🏠',
    description: 'Manage delivery addresses'
  },
  { 
    id: 'wallet', 
    name: 'Wallet', 
    icon: '💰',
    description: 'Manage your balance'
  },
  { 
    id: 'packages', 
    name: 'Packages', 
    icon: '📋',
    description: 'View available packages'
  },
] as const;

// Enhanced status configuration with better colors and icons
const STATUS_CONFIG = {
  'Order Placed': { 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: '📝',
    bgColor: 'bg-blue-100'
  },
  'Picked Up': { 
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: '🚚',
    bgColor: 'bg-yellow-100'
  },
  'In Process': { 
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: '⚙️',
    bgColor: 'bg-purple-100'
  },
  'Ready for Delivery': { 
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: '✅',
    bgColor: 'bg-green-100'
  },
  'Delivered': { 
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: '🎉',
    bgColor: 'bg-gray-100'
  },
} as const;

// Enhanced Stats Card Component with better visual design
const StatsCard = ({ 
  icon, 
  title, 
  value, 
  subtitle,
  bgColor, 
  textColor,
  onClick
}: {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  bgColor: string;
  textColor: string;
  onClick?: () => void;
}) => (
  <div 
    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-2">
          <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
            <span className="text-lg">{icon}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      </div>
    </div>
  </div>
);

// Enhanced Order Item Component with better visual design
const OrderItem = ({ 
  order, 
  onViewOrder 
}: {
  order: Order;
  onViewOrder: (orderId: number) => void;
}) => {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getStatusConfig = useCallback((status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: '❓',
      bgColor: 'bg-gray-100'
    };
  }, []);

  const statusConfig = getStatusConfig(order.status);

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onViewOrder(order.id)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 ${statusConfig.bgColor} rounded-full flex items-center justify-center`}>
            <span className="text-sm">{statusConfig.icon}</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              #{order.orderNumber}
            </h4>
            <p className="text-sm text-gray-500">{order.serviceType}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">{order?.invoiceTotal?.toFixed(3)} BD</p>
          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusConfig.color}`}>
          {order.status}
        </span>
        <button 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 group-hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onViewOrder(order.id);
          }}
        >
          <span>View Details</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
};

// Enhanced Detailed Order Item Component
const DetailedOrderItem = ({ 
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

  const getStatusConfig = useCallback((status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: '❓',
      bgColor: 'bg-gray-100'
    };
  }, []);

  const statusConfig = getStatusConfig(order.status);

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onViewOrder(order.id)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${statusConfig.bgColor} rounded-lg flex items-center justify-center`}>
            <span className="text-lg">{statusConfig.icon}</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              Order #{order.orderNumber}
            </h4>
            <p className="text-sm text-gray-500">{order.serviceType}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-xl text-gray-900">{order?.invoiceTotal?.toFixed(3)} BD</p>
          <button 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 mt-1 group-hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onViewOrder(order.id);
            }}
          >
            <span>View Details</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Service</p>
          <p className="text-sm font-medium text-gray-900">{order.serviceType}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pickup</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(order.pickupTime)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Placed</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`px-4 py-2 text-sm font-medium rounded-full border ${statusConfig.color}`}>
          {order.status}
        </span>
      </div>
    </div>
  );
};

// Enhanced Tab Button Component with better visual feedback
const TabButton = ({ 
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
    className={`relative py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
      isActive
        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
    }`}
  >
    <div className="flex items-center space-x-2">
      <span className="text-lg">{tab.icon}</span>
      <div className="text-left">
        <div className="font-semibold">{tab.name}</div>
        <div className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          {tab.description}
        </div>
      </div>
    </div>
  </button>
);

// Quick Action Button Component
const QuickActionButton = ({ 
  icon, 
  title, 
  subtitle, 
  onClick, 
  color = 'blue' 
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple';
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${colorClasses[color]}`}
    >
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{icon}</div>
        <div className="text-left">
          <div className="font-semibold">{title}</div>
          <div className="text-sm opacity-80">{subtitle}</div>
        </div>
      </div>
    </button>
  );
};

export default function DashboardContent({ searchParams }: { searchParams: URLSearchParams }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' }>({ message: '' });
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { isAuthenticated, customer: authCustomer, isLoading: authLoading } = useAuth();

  // Memoized utility functions
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  }, []);

  const formatMemberSince = useCallback((dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
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

  const handleAddFunds = useCallback(() => {
    // TODO: Implement add funds functionality
  }, []);

  const handleManageAddresses = useCallback(() => {
    setActiveTab('addresses');
  }, []);

  // FAB handler for addresses
  const handleAddAddress = useCallback(() => {
    setActiveTab('addresses');
    // Optionally trigger add address modal in DashboardAddressManagement
  }, []);

  // Memoized data calculations
  const statsData = useMemo(() => {
    const activeOrders = orders.filter(order => !['Delivered', 'Cancelled'].includes(order.status)).length;
    const completedOrders = orders.filter(order => order.status === 'Delivered').length;
    
    return [
      {
        icon: '💰',
        title: 'Wallet Balance',
        value: `${customer?.walletBalance?.toFixed(3) || '0.000'} BD`,
        subtitle: 'Available funds',
        bgColor: 'bg-gradient-to-br from-blue-100 to-blue-200',
        textColor: 'text-blue-700',
        onClick: () => setActiveTab('wallet')
      },
      {
        icon: '📦',
        title: 'Total Orders',
        value: orders.length,
        subtitle: 'All time',
        bgColor: 'bg-gradient-to-br from-green-100 to-green-200',
        textColor: 'text-green-700'
      },
      {
        icon: '⏳',
        title: 'Active Orders',
        value: activeOrders,
        subtitle: 'In progress',
        bgColor: 'bg-gradient-to-br from-yellow-100 to-yellow-200',
        textColor: 'text-yellow-700'
      },
      {
        icon: '✅',
        title: 'Completed',
        value: completedOrders,
        subtitle: 'Successfully delivered',
        bgColor: 'bg-gradient-to-br from-purple-100 to-purple-200',
        textColor: 'text-purple-700'
      }
    ];
  }, [customer?.walletBalance, orders]);

  const recentOrders = useMemo(() => {
    return orders;
  }, [orders]);

  const hasMoreOrders = useMemo(() => {
    return orders.length === 3;
  }, [orders.length]);

  useEffect(() => {
    // Wait for authentication to be determined
    if (authLoading || sessionStatus === 'loading') {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/registerlogin');
      return;
    }

    // If authenticated but no authCustomer yet, wait a bit more
    if (isAuthenticated && !authCustomer) {
      return;
    }

    // Handle authenticated customers from useAuth hook
    if (authCustomer) {
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
  }, [isAuthenticated, authCustomer, authLoading, session, sessionStatus, router, searchParams]);

  // Separate useEffect to handle URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'orders', 'addresses', 'wallet', 'packages'].includes(tab)) {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 mb-4 md:mb-6">
            <div className="flex items-center space-x-3 md:space-x-4 mb-3 md:mb-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-xl md:text-2xl text-white font-bold">
                  {customer.firstName?.charAt(0) || 'U'}{customer.lastName?.charAt(0) || 'S'}
                </span>
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                  Welcome back, {customer.firstName || 'User'}! 👋
                </h1>
                <p className="text-gray-600 text-sm md:text-base">Here's what's happening with your laundry today</p>
              </div>
            </div>
            {/* Quick Actions - horizontal scroll on mobile */}
            <div className="flex space-x-3 overflow-x-auto md:grid md:grid-cols-3 md:gap-4 scrollbar-hide">
              <QuickActionButton
                icon="📦"
                title="New Order"
                subtitle="Schedule laundry pickup"
                onClick={handleScheduleOrder}
                color="blue"
              />
              <QuickActionButton
                icon="🏠"
                title="Manage Addresses"
                subtitle="Update delivery locations"
                onClick={handleManageAddresses}
                color="green"
              />
              <QuickActionButton
                icon="💰"
                title="Add Funds"
                subtitle="Top up your wallet"
                onClick={handleAddFunds}
                color="purple"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation - hide on mobile, use MobileBottomNav instead */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <nav className="flex flex-wrap gap-3">
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
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => (
                  <StatsCard
                    key={index}
                    icon={stat.icon}
                    title={stat.title}
                    value={stat.value}
                    subtitle={stat.subtitle}
                    bgColor={stat.bgColor}
                    textColor={stat.textColor}
                    onClick={stat.onClick}
                  />
                ))}
              </div>

              {/* Customer Information Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-3">👤</span>
                  Your Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">Full Name</label>
                      <p className="text-lg font-semibold text-gray-900">{customer.firstName || 'N/A'} {customer.lastName || ''}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">Email Address</label>
                      <p className="text-lg font-semibold text-gray-900">{customer.email}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">Contact Number</label>
                      <p className="text-lg font-semibold text-gray-900">{customer.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">Member Since</label>
                      <p className="text-lg font-semibold text-gray-900">{formatMemberSince(customer.createdAt)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-sm font-medium text-gray-500 mb-2">Default Address</label>
                      <p className="text-lg font-semibold text-gray-900">{getDefaultAddress()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-8 py-6 border-b border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="mr-3">📦</span>
                    Recent Orders
                  </h3>
                </div>
                <div className="p-8">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📦</span>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h4>
                      <p className="text-gray-600 mb-6">Ready to get started? Place your first order!</p>
                      <button
                        onClick={handleScheduleOrder}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Place Your First Order
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
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
                          className="w-full text-center py-4 text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-200"
                        >
                          View All Orders →
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="mr-3">📦</span>
                  My Orders
                </h3>
              </div>
              <div className="p-8">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📦</span>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h4>
                    <p className="text-gray-600 mb-6">Ready to get started? Place your first order!</p>
                    <button
                      onClick={handleScheduleOrder}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Place Your First Order
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <DashboardAddressManagement />
            </div>
          )}

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="mr-3">💰</span>
                  Wallet
                </h3>
              </div>
              <div className="p-8">
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">💰</span>
                  </div>
                  <h4 className="text-3xl font-bold text-gray-900 mb-2">
                    {customer.walletBalance.toFixed(3)} BD
                  </h4>
                  <p className="text-gray-600 mb-8 text-lg">Current Balance</p>
                  <button 
                    onClick={handleAddFunds}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Add Funds
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Packages Tab */}
          {activeTab === 'packages' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="mr-3">📋</span>
                  Packages
                </h3>
              </div>
              <div className="p-8">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">No packages available</h4>
                  <p className="text-gray-600">Check back later for special offers and packages!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      {/* FAB for Add Address (only on addresses tab, mobile only) */}
      {activeTab === 'addresses' && (
        <FAB onClick={handleAddAddress} icon={<span>+</span>} label="Add Address" />
      )}
      {/* Toast for feedback */}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '' })} />
      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        orderId={selectedOrderId}
      />
    </div>
  );
} 