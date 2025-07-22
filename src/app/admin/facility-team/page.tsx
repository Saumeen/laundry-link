"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import PageTransition from "@/components/ui/PageTransition";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { OrderStatus, ProcessingStatus } from "@prisma/client";

interface OrderItem {
  id: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
  notes?: string;
}

interface ProcessingItemDetail {
  id: number;
  quantity: number;
  processedQuantity: number;
  status: string;
  processingNotes?: string;
  qualityScore?: number;
  orderItem: OrderItem;
}

interface Order {
  id: number;
  orderNumber: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  status: string;
  pickupTime: string;
  deliveryTime: string;
  orderServiceMappings: Array<{
    id: number;
    quantity: number;
    service: {
      id: number;
      name: string;
      displayName: string;
      pricingType: string;
      pricingUnit: string;
      price: number;
    };
    orderItems: OrderItem[]; // Individual laundry items
    invoiceItems: Array<{
      id: number;
      quantity: number;
      pricePerItem: number;
      notes?: string;
    }>;
  }>;
  orderProcessing?: {
    id: number;
    processingStatus: string;
    totalPieces?: number;
    totalWeight?: number;
    processingNotes?: string;
    qualityScore?: number;
    processingStartedAt?: string;
    processingCompletedAt?: string;
    staff: {
      id: number;
      firstName: string;
      lastName: string;
    };
    processingItems: Array<{
      id: number;
      quantity: number;
      processedQuantity: number;
      status: string;
      notes?: string;
      orderServiceMapping: {
        service: {
          displayName: string;
        };
        orderItems: OrderItem[];
      };
      processingItemDetails: ProcessingItemDetail[]; // Item-level processing details
    }>;
    issueReports: Array<{
      id: number;
      issueType: string;
      description: string;
      severity: string;
      status: string;
      photoUrl?: string;
      reportedAt: string;
    }>;
  };
  driverAssignments: Array<{
    id: number;
    assignmentType: string;
    status: string;
    actualTime?: string;
    driver: {
      id: number;
      firstName: string;
      lastName: string;
    };
  }>;
}

interface Stats {
  ordersReadyForProcessing: number;
  ordersInProcessing: number;
  completedOrders: number;
  avgProcessingTime: number;
  avgQualityScore: number;
  issueReports: number;
  issueReportsBySeverity: Record<string, number>;
  recentActivity: Array<{
    id: number;
    processingStatus: string;
    createdAt: string;
    order: {
      id: number;
      orderNumber: string;
      customerFirstName: string;
      customerLastName: string;
      status: string;
    };
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  stats?: Stats;
  orders?: Order[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  error: string;
}

export default function FacilityTeamDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [processingData, setProcessingData] = useState({
    totalPieces: '',
    totalWeight: '',
    processingNotes: '',
    qualityScore: ''
  });
  const [issueData, setIssueData] = useState({
    issueType: 'damage',
    description: '',
    severity: 'medium',
    photoUrl: ''
  });
  const [currentTab, setCurrentTab] = useState('picked_up');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Item-level processing state
  // Removed unused state variables as ProcessingModal handles its own state

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session || session.userType !== "admin" || session.role !== "FACILITY_TEAM") {
      router.push("/admin/login");
      return;
    }

    setLoading(false);
    fetchStats();
    fetchOrders();
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/facility-team/stats');
      if (response.ok) {
        const data = await response.json() as ApiResponse<Stats>;
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        status: currentTab,
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/facility-team/orders?${params}`);
      if (response.ok) {
        const data = await response.json() as ApiResponse<Order[]>;
        if (data.orders) {
          setOrders(data.orders);
        }
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchOrders();
    }
  }, [currentTab, currentPage, searchTerm, loading]);

  const handleMarkReceived = async (orderId: number) => {
    try {
      const response = await fetch('/api/admin/facility-team/receive-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (response.ok) {
        showToast('Order marked as received successfully!', 'success');
        fetchOrders();
        fetchStats();
      } else {
        const error = await response.json() as ErrorResponse;
        showToast(error.error || 'Failed to mark order as received', 'error');
      }
    } catch (error) {
      console.error('Error marking order as received:', error);
      showToast('Failed to mark order as received', 'error');
    }
  };

  const handleStartProcessing = async (data: any) => {
    try {
      const response = await fetch('/api/admin/facility-team/processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setProcessingData({ totalPieces: '', totalWeight: '', processingNotes: '', qualityScore: '' });
        fetchOrders();
        fetchStats();
      } else {
        const error = await response.json() as ErrorResponse;
        showToast(error.error || 'Failed to start processing', 'error');
      }
    } catch (error) {
      console.error('Error starting processing:', error);
      showToast('Failed to start processing', 'error');
    }
  };

  const handleUpdateProcessing = async (data: any) => {
    try {
      const response = await fetch(`/api/admin/facility-team/processing?orderId=${data.orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        showToast('Processing updated successfully!', 'success');
        setProcessingData({ totalPieces: '', totalWeight: '', processingNotes: '', qualityScore: '' });
        fetchOrders();
        fetchStats();
              } else {
          const error = await response.json() as ErrorResponse;
          showToast(error.error || 'Failed to update processing', 'error');
        }
      } catch (error) {
        console.error('Error updating processing:', error);
        showToast('Failed to update processing', 'error');
      }
  };



  const handleCreateIssueReport = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch('/api/admin/facility-team/issue-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          issueType: issueData.issueType,
          description: issueData.description,
          severity: issueData.severity,
          photoUrl: issueData.photoUrl || undefined
        })
      });

      if (response.ok) {
        showToast('Issue report created successfully!', 'success');
        setShowIssueModal(false);
        setIssueData({ issueType: 'damage', description: '', severity: 'medium', photoUrl: '' });
        fetchOrders();
        fetchStats();
              } else {
          const error = await response.json() as ErrorResponse;
          showToast(error.error || 'Failed to create issue report', 'error');
        }
      } catch (error) {
        console.error('Error creating issue report:', error);
        showToast('Failed to create issue report', 'error');
      }
  };



  const handleLogout = () => {
    signOut({ callbackUrl: "/admin/login" });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'RECEIVED_AT_FACILITY':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case ProcessingStatus.QUALITY_CHECK:
        return 'bg-purple-100 text-purple-800';
      case ProcessingStatus.READY_FOR_DELIVERY:
        return 'bg-green-100 text-green-800';
      case 'ISSUE_REPORTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || session.userType !== "admin" || session.role !== "FACILITY_TEAM") {
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
                <h1 className="text-2xl font-bold text-gray-900">Facility Team Dashboard</h1>
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
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Ready for Processing</dt>
                          <dd className="text-lg font-medium text-gray-900">{stats.ordersReadyForProcessing}</dd>
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
                          <dt className="text-sm font-medium text-gray-500 truncate">In Processing</dt>
                          <dd className="text-lg font-medium text-gray-900">{stats.ordersInProcessing}</dd>
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
                          <dd className="text-lg font-medium text-gray-900">{stats.completedOrders}</dd>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Quality Score</dt>
                          <dd className="text-lg font-medium text-gray-900">{stats.avgQualityScore}%</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentTab('picked_up')}
                    className={`px-4 py-2 rounded-md ${
                      currentTab === 'picked_up' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Picked Up by Driver
                  </button>
                  <button
                    onClick={() => setCurrentTab('received')}
                    className={`px-4 py-2 rounded-md ${
                      currentTab === 'received' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Received at Facility
                  </button>
                  <button
                    onClick={() => setCurrentTab('ready_for_processing')}
                    className={`px-4 py-2 rounded-md ${
                      currentTab === 'ready_for_processing' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Ready for Processing ({stats?.ordersReadyForProcessing || 0})
                  </button>
                  <button
                    onClick={() => setCurrentTab('in_processing')}
                    className={`px-4 py-2 rounded-md ${
                      currentTab === 'in_processing' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Processing ({stats?.ordersInProcessing || 0})
                  </button>
                  <button
                    onClick={() => setCurrentTab('ready_for_delivery')}
                    className={`px-4 py-2 rounded-md ${
                      currentTab === 'ready_for_delivery' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Ready for Delivery
                  </button>
                  <button
                    onClick={() => setCurrentTab('completed')}
                    className={`px-4 py-2 rounded-md ${
                      currentTab === 'completed' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Completed ({stats?.completedOrders || 0})
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Orders</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Services
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pickup Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customerFirstName} {order.customerLastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.orderServiceMappings.map(mapping => 
                            `${mapping.service.displayName} (${mapping.quantity})`
                          ).join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.orderProcessing?.processingStatus || order.status)}`}>
                            {order.status === 'RECEIVED_AT_FACILITY' ? 'RECEIVED AT FACILITY' :
                             order.orderProcessing?.processingStatus === OrderStatus.READY_FOR_DELIVERY ? 'READY FOR DELIVERY' :
                             order.orderProcessing?.processingStatus === OrderStatus.QUALITY_CHECK ? 'QUALITY CHECK' :
                             order.orderProcessing?.processingStatus === 'IN_PROGRESS' ? 'IN PROCESSING' :
                             order.orderProcessing?.processingStatus?.replace('_', ' ').toUpperCase() || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.pickupTime).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {order.status !== 'RECEIVED_AT_FACILITY' && !order.orderProcessing ? (
                            <button
                              onClick={() => handleMarkReceived(order.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Mark as Received
                            </button>
                          ) : order.status === 'RECEIVED_AT_FACILITY' && !order.orderProcessing ? (
                            <Link
                              href={`/admin/facility-team/process/${order.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Start Processing
                            </Link>
                          ) : (
                            <>
                              <Link
                                href={`/admin/facility-team/process/${order.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Continue Processing
                              </Link>
                              {order.orderProcessing && (
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowIssueModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900 ml-2"
                                >
                                  Report Issue
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {stats?.recentActivity && stats.recentActivity.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Order {activity.order.orderNumber} - {activity.order.customerFirstName} {activity.order.customerLastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Status: {activity.processingStatus.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>



        {/* Issue Report Modal */}
        {showIssueModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Report Issue</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Issue Type</label>
                    <select
                      value={issueData.issueType}
                      onChange={(e) => setIssueData({...issueData, issueType: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="damage">Damage</option>
                      <option value="stain">Stain</option>
                      <option value="missing_item">Missing Item</option>
                      <option value="wrong_item">Wrong Item</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    <select
                      value={issueData.severity}
                      onChange={(e) => setIssueData({...issueData, severity: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={issueData.description}
                      onChange={(e) => setIssueData({...issueData, description: e.target.value})}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the issue in detail..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Photo URL (optional)</label>
                    <input
                      type="url"
                      value={issueData.photoUrl}
                      onChange={(e) => setIssueData({...issueData, photoUrl: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowIssueModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateIssueReport}
                    disabled={!issueData.description.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Report Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
} 