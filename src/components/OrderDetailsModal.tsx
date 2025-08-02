'use client';

import { useState, useEffect, useCallback } from 'react';
import { OrderStatus } from '@prisma/client';
import { OrdersApi } from '@/customer/api/orders';
import { InvoiceApi } from '@/customer/api/invoice';
import { useOrdersStore } from '@/customer/stores/ordersStore';
import {
  StatusCard,
  OrderTimeline,
  OrderInformation,
  ProcessingDetails,
  ServicesTab,
  InvoiceTab,
  AddressesTab,
  NotesTab,
} from './order-details';

// Constants
const Z_INDEX_MODAL = 50;

// Simplified tab configuration
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

// Types
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
  tapInvoiceUrl?: string;
  tapInvoiceId?: string;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  orderId,
}: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Get store actions
  const { selectOrder } = useOrdersStore();

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await OrdersApi.getOrder(orderId);

      if (response.success && response.data) {
        const order = response.data.order;
        setOrderDetails(order);
        selectOrder(order);
      } else {
        setError(response.error || 'Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('An error occurred while fetching order details');
    } finally {
      setLoading(false);
    }
  }, [orderId, selectOrder]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId, fetchOrderDetails]);

  const handleDownloadInvoice = useCallback(async () => {
    if (!orderId) return;

    setInvoiceLoading(true);
    try {
      const blob = await InvoiceApi.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderDetails?.orderNumber || orderId}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading invoice:', err);
    } finally {
      setInvoiceLoading(false);
    }
  }, [orderId, orderDetails?.orderNumber]);

  const handlePrintInvoice = useCallback(() => {
    window.print();
  }, []);

  const handlePayInvoice = useCallback(async () => {
    if (!orderId) return;

    setPaymentLoading(true);
    try {
      const response = await fetch('/api/customer/pay-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json() as any;

      if (data.success && data.paymentUrl) {
        // Redirect to Tap payment page
        window.open(data.paymentUrl, '_blank');
      } else {
        console.error('Payment error:', data.error);
        setError('Failed to initiate payment');
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError('An error occurred while initiating payment');
    } finally {
      setPaymentLoading(false);
    }
  }, [orderId]);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleClose = useCallback(() => {
    selectOrder(null);
    onClose();
  }, [selectOrder, onClose]);

  if (!orderId) return null;

  return (
    <div
      className={`fixed inset-0 z-${Z_INDEX_MODAL} ${isOpen ? 'block' : 'hidden'}`}
    >
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm'
        aria-hidden='true'
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className='fixed inset-0 flex items-center justify-center p-2 sm:p-4'>
        <div className='w-full h-full sm:h-auto sm:max-h-[90vh] max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'>
            <div className='flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1'>
              <div className='min-w-0 flex-1'>
                <h2 className='text-lg sm:text-xl font-bold text-gray-900 truncate'>
                  Order Details
                </h2>
                <p className='text-xs sm:text-sm text-gray-600 truncate'>
                  Order #{orderDetails?.orderNumber || 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0'
              aria-label='Close modal'
            >
              <span className='text-xl sm:text-2xl text-gray-500 hover:text-gray-700'>
                ×
              </span>
            </button>
          </div>

          {/* Mobile Tab Selector */}
          <div className='sm:hidden border-b border-gray-200 bg-white'>
            <select
              value={activeTab}
              onChange={e => setActiveTab(e.target.value as TabType)}
              className='w-full p-4 text-sm font-medium border-none focus:ring-0 focus:outline-none bg-gray-50'
            >
              {TABS.map(tab => (
                <option key={tab.id} value={tab.id}>
                  {tab.icon} {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Tabs */}
          <div className='hidden sm:block border-b border-gray-200 bg-white'>
            <div className='flex overflow-x-auto scrollbar-hide'>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-all duration-200 min-w-[80px] ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className='text-base sm:text-lg mb-1'>{tab.icon}</span>
                  <span className='text-center'>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-y-auto bg-gray-50'>
            {loading && (
              <div className='flex flex-col items-center justify-center py-12 sm:py-16 px-4'>
                <div className='animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4'></div>
                <span className='text-gray-600 font-medium text-center'>
                  Loading order details...
                </span>
              </div>
            )}

            {error && !loading && (
              <div className='flex flex-col items-center justify-center py-12 sm:py-16 px-4'>
                <div className='text-5xl mb-4'>❌</div>
                <p className='text-red-600 text-center mb-6 font-medium px-4'>
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm'
                >
                  🔄 Try Again
                </button>
              </div>
            )}

            {orderDetails && !loading && !error && (
              <div className='p-4 sm:p-6'>
                {/* Mobile Tab Description */}
                <div className='sm:hidden mb-6'>
                  <div className='bg-white rounded-lg p-4 shadow-sm'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <span className='text-2xl'>
                        {TABS.find(tab => tab.id === activeTab)?.icon}
                      </span>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {TABS.find(tab => tab.id === activeTab)?.label}
                      </h3>
                    </div>
                    <p className='text-sm text-gray-600'>
                      {TABS.find(tab => tab.id === activeTab)?.description}
                    </p>
                  </div>
                </div>

                {/* Tab Content */}
                <div className='space-y-4 sm:space-y-6'>
                  {activeTab === 'overview' && (
                    <>
                      <StatusCard orderDetails={orderDetails} />
                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                        <OrderInformation orderDetails={orderDetails} />
                        <ProcessingDetails
                          processingDetails={orderDetails.processingDetails}
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'timeline' && (
                    <OrderTimeline orderDetails={orderDetails} />
                  )}
                  {activeTab === 'services' && (
                    <ServicesTab orderDetails={orderDetails} />
                  )}
                  {activeTab === 'invoice' && (
                    <InvoiceTab
                      orderDetails={orderDetails}
                      onDownload={handleDownloadInvoice}
                      onPrint={handlePrintInvoice}
                      invoiceLoading={invoiceLoading}
                      onPayInvoice={handlePayInvoice}
                      paymentLoading={paymentLoading}
                    />
                  )}
                  {activeTab === 'addresses' && (
                    <AddressesTab orderDetails={orderDetails} />
                  )}
                  {activeTab === 'notes' && (
                    <NotesTab orderDetails={orderDetails} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {orderDetails && !loading && !error && (
            <div className='border-t border-gray-200 bg-white p-4'>
              <div className='flex flex-col sm:flex-row gap-3 justify-end'>
                <button
                  onClick={handleClose}
                  className='px-4 sm:px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm sm:text-base'
                >
                  Close
                </button>
                {activeTab === 'invoice' && (
                  <button
                    onClick={handleDownloadInvoice}
                    disabled={invoiceLoading}
                    className='px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 text-sm sm:text-base'
                  >
                    {invoiceLoading ? 'Downloading...' : 'Download Invoice'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
