'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/customer/stores/walletStore';
import { OrdersApi } from '@/customer/api/orders';
import CustomInvoice from '@/components/CustomInvoice';
import logger from '@/lib/logger';
import {
  StatusCard,
  OrderTimeline,
  OrderInformation,
  ProcessingDetails,
  ServicesTab,
  AddressesTab,
  NotesTab,
} from '@/components/order-details';

// Constants
const TABS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: '📋',
    description: 'Order summary and status',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: '⏱️',
    description: 'Order progress tracking',
  },
  {
    id: 'services',
    label: 'Services',
    icon: '🧺',
    description: 'Requested services',
  },
  {
    id: 'invoice',
    label: 'Invoice',
    icon: '🧾',
    description: 'Payment details',
  },
  {
    id: 'addresses',
    label: 'Addresses',
    icon: '📍',
    description: 'Pickup & delivery locations',
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: '📝',
    description: 'Special instructions',
  },
] as const;

type TabType = (typeof TABS)[number]['id'];

interface OrderDetails {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  invoiceTotal?: number;
  pickupStartTime: string;
  pickupEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  pickupTimeSlot?: string;
  deliveryTimeSlot?: string;
  createdAt: string;
  updatedAt: string;
  customerNotes?: string;
  customerPhone?: string;
  customerAddress?: string;
  specialInstructions?: string;
  address?: any;
  pickupAddress?: any;
  deliveryAddress?: any;
  invoiceItems?: any[];
  items?: any[];
  processingDetails?: any;
  invoiceGenerated: boolean;
  paymentStatus?: string;
  paymentMethod?: string;
  customer?: any;
  orderServiceMappings?: any[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { customer } = useAuth();
  const { balance, fetchWalletInfo } = useWalletStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const orderId = params.orderId as string;

  useEffect(() => {
    if (customer?.id) {
      fetchWalletInfo(customer.id);
    }
  }, [customer?.id, fetchWalletInfo]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Handle tab parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') as TabType;
    const topupParam = urlParams.get('topup');
    
    if (tabParam && TABS.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
    
    // Note: Payment modal is now handled by CustomInvoice component
  }, [orderDetails]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await OrdersApi.getOrder(parseInt(orderId));
      if (response.success && response.data) {
        setOrderDetails(response.data.order);
      } else {
        setError(response.error || 'Failed to fetch order details');
      }
    } catch (error) {
      logger.error('Error fetching order details:', error);
      setError('An error occurred while fetching order details');
    } finally {
      setLoading(false);
    }
  };



  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  const requiresPayment = orderDetails && 
    orderDetails.invoiceGenerated &&
    orderDetails.paymentStatus === 'PENDING' && 
    (orderDetails.invoiceTotal || 0) > 0;

  const isPaymentInProgress = orderDetails && 
    orderDetails.paymentStatus === 'IN_PROGRESS';

  const canPayWithWallet = orderDetails && balance >= (orderDetails.invoiceTotal || 0);



  const getPaymentStatusMessage = (order: OrderDetails) => {
    if (!order.invoiceGenerated) {
      return 'Invoice not generated yet';
    }
    if (order.paymentStatus === 'IN_PROGRESS') {
      return 'Payment is currently in progress. Please wait for it to complete.';
    }
    if (order.paymentStatus === 'PENDING' && (order.invoiceTotal || 0) > 0) {
      if (canPayWithWallet) {
        return 'You can pay this order using your wallet balance';
      }
      return 'Payment required for this order';
    }
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Order</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/customer/orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/customer/orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/customer/orders')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600">#{orderDetails.orderNumber}</p>
              </div>
            </div>
            
            {/* Payment Action */}
            {requiresPayment && (
              <div className="text-right">
                <div>
                  <p className="text-sm text-gray-600">Amount Due</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(orderDetails.invoiceTotal || 0).toFixed(3)} BD
                  </p>
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  Go to Invoice tab to make payment
                </p>
              </div>
            )}
            {isPaymentInProgress && (
              <div className="text-right">
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <p className="text-lg font-semibold text-blue-600">
                    Payment In Progress
                  </p>
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  Please wait for payment to complete
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Navigation</h3>
              <nav className="space-y-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </div>
                  </button>
                ))}
              </nav>

              {/* Payment Status */}
              {requiresPayment && (
                <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="text-sm font-semibold text-orange-900 mb-2">Payment Status</h4>
                  <p className="text-sm text-orange-700">{getPaymentStatusMessage(orderDetails)}</p>
                  {!canPayWithWallet && (
                    <p className="text-xs text-orange-600 mt-2">
                      Insufficient wallet balance
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <StatusCard orderDetails={orderDetails} />
                    <OrderInformation orderDetails={orderDetails} />
                    {orderDetails.processingDetails && (
                      <ProcessingDetails processingDetails={orderDetails.processingDetails} />
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <OrderTimeline orderDetails={orderDetails} />
                )}

                {activeTab === 'services' && (
                  <ServicesTab orderDetails={orderDetails} />
                )}

                {activeTab === 'invoice' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Invoice & Payment</h3>
                    </div>
                    
                    <CustomInvoice
                      order={{
                        ...orderDetails,
                        paymentStatus: orderDetails.paymentStatus || 'PENDING',
                        invoiceTotal: orderDetails.invoiceTotal || 0,
                      }}
                    />
                  </div>
                )}

                {activeTab === 'addresses' && (
                  <AddressesTab orderDetails={orderDetails} />
                )}

                {activeTab === 'notes' && (
                  <NotesTab orderDetails={orderDetails} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
} 