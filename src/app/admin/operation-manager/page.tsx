"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { UserRole } from "@/types/global";
import PageTransition from "@/components/ui/PageTransition";
import { OrderStatus } from "@prisma/client";

interface DashboardStats {
  pendingOrders: number;
  completedToday: number;
  avgProcessingTime: number;
  activeDrivers: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerFirstName: string;
  customerLastName: string;
  status: string;
  invoiceTotal: number;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  invoiceItems: Array<{
    totalPrice: number;
    itemType?: string;
  }>;
  // Additional fields for detailed view
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  pickupTime: string;
  deliveryTime: string;
  serviceType: string;
  specialInstructions?: string;
  paymentStatus: string;
  paymentMethod?: string;
  items: string[];
  minimumOrderApplied: boolean;
}

interface DashboardData {
  stats: DashboardStats;
  recentOrders: Order[];
}

export default function OperationManagerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    // Wait for session to load
    if (status === "loading") {
      return;
    }

    // Check if session exists
    if (!session) {
      router.push("/admin/login");
      return;
    }

<<<<<<< Updated upstream
    // Check if user is admin
    if (!session.userType || session.userType !== "admin") {
      router.push("/admin/login");
      return;
    }

    // Allow both OPERATION_MANAGER and SUPER_ADMIN
    if (!session.role || (session.role !== "OPERATION_MANAGER" && session.role !== "SUPER_ADMIN")) {
      router.push("/admin/login");
      return;
    }

    setLoading(false);
  }, [session, status, router]);
=======
  const handleNavigateToCustomers = () => {
    router.push('/admin/super-admin/customers');
  };
>>>>>>> Stashed changes

  const fetchDashboardData = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await fetch('/api/admin/operation-manager-stats');
      if (response.ok) {
        const data = await response.json() as DashboardData;
        setDashboardData(data);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchDashboardData();
    }
  }, [loading, fetchDashboardData]);

  const fetchOrderDetails = useCallback(async (orderId: number) => {
    try {
      setDetailsLoading(true);
      const response = await fetch(`/api/admin/order-details/${orderId}`);
      if (response.ok) {
        const data = await response.json() as Order;
        setOrderDetails(data);
      } else {
        console.error('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const handleViewOrder = useCallback(async (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
    await fetchOrderDetails(order.id);
  }, [fetchOrderDetails]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedOrder(null);
    setOrderDetails(null);
  }, []);

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/admin/login" });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case OrderStatus.ORDER_PLACED:
        return "bg-blue-100 text-blue-800";
      case OrderStatus.CONFIRMED:
        return "bg-blue-100 text-blue-800";
      case OrderStatus.PICKUP_ASSIGNED:
        return "bg-yellow-100 text-yellow-800";
      case OrderStatus.PICKUP_IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800";
      case OrderStatus.PICKUP_COMPLETED:
        return "bg-green-100 text-green-800";
      case OrderStatus.RECEIVED_AT_FACILITY:
        return "bg-purple-100 text-purple-800";
      case OrderStatus.PROCESSING_STARTED:
        return "bg-orange-100 text-orange-800";
      case OrderStatus.PROCESSING_COMPLETED:
        return "bg-green-100 text-green-800";
      case OrderStatus.QUALITY_CHECK:
        return "bg-purple-100 text-purple-800";
      case OrderStatus.READY_FOR_DELIVERY:
        return "bg-purple-100 text-purple-800";
      case OrderStatus.DELIVERY_ASSIGNED:
        return "bg-indigo-100 text-indigo-800";
      case OrderStatus.DELIVERY_IN_PROGRESS:
        return "bg-indigo-100 text-indigo-800";
      case OrderStatus.DELIVERED:
        return "bg-green-100 text-green-800";
      case OrderStatus.DELIVERY_FAILED:
        return "bg-red-100 text-red-800";
      case OrderStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      case OrderStatus.REFUNDED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString();
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return `BD ${amount?.toFixed(2) || 0.00}`;
  }, []);

  // Show loading spinner while session is loading or we're checking authentication
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Final check - if any condition fails, don't render the dashboard
  if (!session || !session.userType || session.userType !== "admin" || !session.role || (session.role !== "OPERATION_MANAGER" && session.role !== "SUPER_ADMIN")) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Operation Manager Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dataLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                        ) : (
                          dashboardData?.stats.pendingOrders || 0
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed Today</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dataLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                        ) : (
                          dashboardData?.stats.completedToday || 0
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Processing Time</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dataLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                        ) : (
                          `${dashboardData?.stats.avgProcessingTime || 0}h`
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Drivers</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dataLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                        ) : (
                          dashboardData?.stats.activeDrivers || 0
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={() => router.replace("/admin/orders")}
              >
                Manage Orders
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                onClick={() => router.replace("/admin/super-admin/customers")}
              >
                Manage Customers
              </button>
            </div>
          </div>


        </div>
      </main>

      {/* Order Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Details - {selectedOrder?.orderNumber}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {detailsLoading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : orderDetails ? (
                <div className="space-y-6">
                  {/* Order Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(orderDetails.status)}`}>
                      {orderDetails.status}
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-sm text-gray-900">{orderDetails.customerFirstName} {orderDetails.customerLastName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <p className="text-sm text-gray-900">{orderDetails.customerEmail}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Phone:</span>
                        <p className="text-sm text-gray-900">{orderDetails.customerPhone}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Address:</span>
                        <p className="text-sm text-gray-900">{orderDetails.customerAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Order Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Pickup Time:</span>
                        <p className="text-sm text-gray-900">{formatDateTime(orderDetails.pickupTime)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Delivery Time:</span>
                        <p className="text-sm text-gray-900">{formatDateTime(orderDetails.deliveryTime)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Service Type:</span>
                        <p className="text-sm text-gray-900">{orderDetails.serviceType}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Payment Status:</span>
                        <p className="text-sm text-gray-900">{orderDetails.paymentStatus}</p>
                      </div>
                      {orderDetails.paymentMethod && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Payment Method:</span>
                          <p className="text-sm text-gray-900">{orderDetails.paymentMethod}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-500">Order Date:</span>
                        <p className="text-sm text-gray-900">{formatDateTime(orderDetails.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Services Requested</h4>
                    <div className="space-y-2">
                      {orderDetails.items.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                          <span className="text-sm text-gray-900">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {orderDetails.specialInstructions && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Special Instructions</h4>
                      <p className="text-sm text-gray-900">{orderDetails.specialInstructions}</p>
                    </div>
                  )}

                  {/* Invoice Items */}
                  {orderDetails.invoiceItems && orderDetails.invoiceItems.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Invoice Items</h4>
                      <div className="space-y-2">
                        {orderDetails.invoiceItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-900">{item.itemType || `Item ${index + 1}`}</span>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total Amount */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(orderDetails.invoiceTotal)}</span>
                    </div>
                    {orderDetails.minimumOrderApplied && (
                      <p className="text-sm text-gray-600 mt-1">* Minimum order applied</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Failed to load order details</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
<<<<<<< Updated upstream
    </PageTransition>
=======

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Quick Stats */}
        <div className='mb-8'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>
            Operation Overview
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <StatsCard
              title='Pending Orders'
              value={stats?.pendingOrders || 0}
              icon={
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
              }
              bgColor='bg-yellow-500'
              isLoading={statsLoading}
            />
            <StatsCard
              title='Completed Today'
              value={stats?.completedOrders || 0}
              icon={
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
              }
              bgColor='bg-green-500'
              isLoading={statsLoading}
            />
            <StatsCard
              title='Active Drivers'
              value={stats?.activeDrivers || 0}
              icon={
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
                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
              }
              bgColor='bg-blue-500'
              isLoading={statsLoading}
            />
            <StatsCard
              title='Avg Processing Time'
              value={`${stats?.avgProcessingTime || 0} min`}
              icon={
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
              }
              bgColor='bg-purple-500'
              isLoading={statsLoading}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className='mb-8'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>
            Quick Actions
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <QuickActionButton
              title='Manage Orders'
              onClick={handleNavigateToOrders}
              bgColor='bg-blue-600 hover:bg-blue-700'
              icon={
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
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              }
            />
            <QuickActionButton
              title='Customer Management'
              onClick={handleNavigateToCustomers}
              bgColor='bg-green-600 hover:bg-green-700'
              icon={
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
                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                  />
                </svg>
              }
            />
          </div>
        </div>

        {/* Recent Orders */}
        <div className='bg-white shadow rounded-lg'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h3 className='text-lg font-medium text-gray-900'>Recent Orders</h3>
          </div>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Order
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Customer
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Total
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {ordersLoading ? (
                  <tr>
                    <td colSpan={6} className='px-6 py-4 text-center'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-6 py-4 text-center text-gray-500'
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 10).map(order => (
                    <tr key={order.id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {order.orderNumber}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {order.customer
                          ? `${order.customer.firstName} ${order.customer.lastName}`
                          : 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}
                        >
                          {getStatusDisplayName(order.status)}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {formatCurrency(order.invoiceTotal || 0)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {formatDate(order.createdAt)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                        <button
                          onClick={() => handleOpenOrderDetails(order)}
                          className='text-blue-600 hover:text-blue-900'
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
        </div>
      </div>
    </div>
>>>>>>> Stashed changes
  );
} 