'use client';

import { useState, useEffect, useCallback } from 'react';
import { OrderStatus } from '@prisma/client';

// Constants
const Z_INDEX_MODAL = 50;
const MAX_MODAL_WIDTH = '4xl';
const MAX_MODAL_HEIGHT = '98vh';
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};
const LOCATION_TYPES = {
  HOTEL: 'hotel',
  HOME: 'home',
  FLAT: 'flat',
  OFFICE: 'office',
} as const;

// Status configuration constants
const STATUS_CONFIG = {
  'Order Placed': {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: '📝',
    bgColor: 'bg-blue-100',
    description: 'Your order has been received and confirmed',
  },
  'Picked Up': {
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: '🚚',
    bgColor: 'bg-yellow-100',
    description:
      'Your items have been collected and are on their way to our facility',
  },
  'In Process': {
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: '⚙️',
    bgColor: 'bg-purple-100',
    description: 'Your items are being cleaned and processed',
  },
  [OrderStatus.READY_FOR_DELIVERY]: {
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: '✅',
    bgColor: 'bg-green-100',
    description: 'Your items are ready for delivery',
  },
  [OrderStatus.DELIVERED]: {
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: '🎉',
    bgColor: 'bg-gray-100',
    description: 'Your order has been successfully delivered',
  },
} as const;

// Tab configuration
const TABS = [
  { id: 'overview', label: 'Overview', icon: '📋', shortLabel: 'Overview' },
  { id: 'services', label: 'Services', icon: '👕', shortLabel: 'Services' },
  { id: 'invoice', label: 'Invoice', icon: '🧾', shortLabel: 'Invoice' },
  { id: 'addresses', label: 'Addresses', icon: '📍', shortLabel: 'Addresses' },
  { id: 'notes', label: 'Notes', icon: '📝', shortLabel: 'Notes' },
] as const;

// Types
type TabType = (typeof TABS)[number]['id'];

interface OrderItem {
  id: number;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
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
  contactNumber?: string;
  googleAddress?: string;
  locationType?: string;
}

interface ProcessingDetails {
  washType?: string;
  dryType?: string;
  specialInstructions?: string;
  fabricType?: string;
  stainTreatment?: string;
}

interface OrderDetails {
  id: number;
  orderNumber: string;
  status: string;
  invoiceTotal: number;
  pickupTime: string;
  deliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  customerNotes?: string;
  customerPhone?: string;
  customerAddress?: string;
  specialInstructions?: string;
  address?: Address;
  pickupAddress?: Address;
  deliveryAddress?: Address;
  invoiceItems?: OrderItem[];
  items?: OrderItem[];
  processingDetails?: ProcessingDetails;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

// Helper functions
const isInvoiceReady = (status: string): boolean => {
  const readyStatuses = [
    OrderStatus.PROCESSING_COMPLETED,
    OrderStatus.QUALITY_CHECK,
    OrderStatus.READY_FOR_DELIVERY,
    OrderStatus.DELIVERY_ASSIGNED,
    OrderStatus.DELIVERY_IN_PROGRESS,
    OrderStatus.DELIVERED,
  ] as const;
  return readyStatuses.includes(status as (typeof readyStatuses)[number]);
};

const getStatusConfig = (status: string) => {
  return (
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: '❓',
      bgColor: 'bg-gray-100',
      description: 'Status unknown',
    }
  );
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
};

const getLocationDetails = (address: Address): string => {
  const locationType = address.locationType || LOCATION_TYPES.FLAT;

  switch (locationType) {
    case LOCATION_TYPES.HOTEL:
      return address.building && address.floor
        ? `Hotel. ${address.building} - Room ${address.floor}`
        : '';

    case LOCATION_TYPES.HOME:
      return address.building ? `Home. Number ${address.building}` : '';

    case LOCATION_TYPES.FLAT:
      return address.building && address.floor
        ? `Flat. ${address.building} and Flat ${address.floor}`
        : '';

    case LOCATION_TYPES.OFFICE:
      return address.building && address.apartment
        ? `Office. ${address.building} and ${address.apartment}`
        : '';

    default:
      return '';
  }
};

const getFallbackAddress = (address: Address): string => {
  const parts = [
    address.addressLine1 || '',
    address.addressLine2 || '',
    address.city || '',
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Address not available';
};

const formatAddress = (address: Address): string => {
  if (!address) return 'Not specified';

  const locationDetails = getLocationDetails(address);
  const googleAddress = address.googleAddress || '';

  if (googleAddress && locationDetails) {
    return `${locationDetails} (${googleAddress})`;
  }

  if (googleAddress) {
    return googleAddress;
  }

  if (locationDetails) {
    return locationDetails;
  }

  return getFallbackAddress(address);
};

export default function OrderDetailsModal({
  isOpen,
  onClose,
  orderId,
}: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/customer/orders/${orderId}`);
      if (response.ok) {
        const data = (await response.json()) as { order: OrderDetails };
        setOrderDetails(data.order);
      } else {
        setError('Failed to fetch order details');
      }
    } catch {
      setError('An error occurred while fetching order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId, fetchOrderDetails]);

  // Reset mobile menu when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowMobileMenu(false);
    }
  }, [isOpen]);

  const handleDownloadInvoice = useCallback(async () => {
    if (!orderId) return;

    setInvoiceLoading(true);
    try {
      const response = await fetch(`/api/customer/invoice/${orderId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${orderDetails?.orderNumber || orderId}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = (await response.json()) as { error?: string };
        const errorMessage = errorData.error || 'Failed to download invoice';

        if (errorMessage.includes('not available yet')) {
          // Could be enhanced with toast notification system
          // For now, using a more user-friendly approach
        } else {
          // Could be enhanced with toast notification system
        }
      }
    } catch {
      // Error handling for download invoice
      // Could be enhanced with proper error reporting service
    } finally {
      setInvoiceLoading(false);
    }
  }, [orderId, orderDetails?.orderNumber]);

  const handlePrintInvoice = useCallback(() => {
    window.print();
  }, []);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  const handleRetry = useCallback(() => {
    setError(null);
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  if (!orderId) return null;

  return (
    <div
      className={`fixed inset-0 z-${Z_INDEX_MODAL} ${isOpen ? 'block' : 'hidden'}`}
    >
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm'
        aria-hidden='true'
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className='fixed inset-0 flex items-center justify-center p-2 sm:p-4'>
        <div
          className={`mx-auto w-full max-w-${MAX_MODAL_WIDTH} max-h-[${MAX_MODAL_HEIGHT}] bg-white rounded-2xl shadow-2xl flex flex-col`}
        >
          {/* Header */}
          <div className='flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl'>
            <div className='flex items-center space-x-3 sm:space-x-4 min-w-0'>
              <div className='w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0'>
                <span className='text-white font-bold text-sm sm:text-lg'>
                  #{orderDetails?.orderNumber || 'N/A'}
                </span>
              </div>
              <div className='min-w-0'>
                <h2 className='text-lg sm:text-2xl font-bold text-gray-900 truncate'>
                  Order Details
                </h2>
                <p className='text-sm sm:text-base text-gray-600 truncate'>
                  Order #{orderDetails?.orderNumber || 'N/A'}
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className='sm:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <svg
                  className='w-6 h-6 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              </button>
              <button
                onClick={onClose}
                className='p-2 sm:p-3 hover:bg-gray-100 rounded-xl transition-colors'
              >
                <span className='text-xl sm:text-2xl text-gray-500'>×</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className='sm:hidden border-b border-gray-200 bg-white'>
              <div className='flex flex-col'>
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className='text-lg'>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Desktop Tabs */}
          <div className='hidden sm:block border-b border-gray-200 bg-white'>
            <div
              className='flex overflow-x-auto'
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style jsx>{`
                .overflow-x-auto::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content - Scrollable Area */}
          <div className='flex-1 overflow-y-auto min-h-0'>
            {loading && (
              <div className='flex flex-col items-center justify-center py-20 px-4'>
                <div className='animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-600 border-t-transparent'></div>
                <span className='ml-0 sm:ml-4 mt-4 sm:mt-0 text-gray-600 text-base sm:text-lg text-center'>
                  Loading order details...
                </span>
              </div>
            )}

            {error && !loading && (
              <div className='flex flex-col items-center justify-center py-20 px-4'>
                <div className='w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <span className='text-xl sm:text-2xl'>❌</span>
                </div>
                <p className='text-red-600 text-base sm:text-lg text-center mb-4'>
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Try Again
                </button>
              </div>
            )}

            {orderDetails && !loading && !error && (
              <div className='p-4 sm:p-6'>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className='space-y-4 sm:space-y-6'>
                    {/* Status Card */}
                    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 border border-blue-100'>
                      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'>
                        <div className='flex items-center space-x-3 sm:space-x-4'>
                          <div
                            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center ${getStatusConfig(orderDetails?.status || '').bgColor}`}
                          >
                            <span className='text-xl sm:text-2xl'>
                              {getStatusConfig(orderDetails?.status || '').icon}
                            </span>
                          </div>
                          <div className='min-w-0'>
                            <h3 className='text-lg sm:text-xl font-bold text-gray-900'>
                              Order Status
                            </h3>
                            <span
                              className={`inline-block px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-full border ${getStatusConfig(orderDetails?.status || '').color}`}
                            >
                              {orderDetails?.status || 'Unknown'}
                            </span>
                            <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                              {
                                getStatusConfig(orderDetails?.status || '')
                                  .description
                              }
                            </p>
                          </div>
                        </div>
                        <div className='text-center sm:text-right'>
                          <p className='text-2xl sm:text-3xl font-bold text-gray-900'>
                            {orderDetails?.invoiceTotal?.toFixed(3) || '0.000'}{' '}
                            BD
                          </p>
                          <p className='text-sm text-gray-600'>Total Amount</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Info Grid */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                      <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm'>
                        <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                          <span className='mr-2'>📅</span>
                          Order Information
                        </h3>
                        <div className='space-y-3'>
                          <div className='flex flex-col sm:flex-row sm:justify-between'>
                            <span className='text-sm text-gray-600'>
                              Order Date:
                            </span>
                            <span className='text-sm sm:text-base font-medium'>
                              {orderDetails?.createdAt
                                ? formatDate(orderDetails.createdAt)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className='flex flex-col sm:flex-row sm:justify-between'>
                            <span className='text-sm text-gray-600'>
                              Last Updated:
                            </span>
                            <span className='text-sm sm:text-base font-medium'>
                              {orderDetails?.updatedAt
                                ? formatDate(orderDetails.updatedAt)
                                : 'N/A'}
                            </span>
                          </div>
                          <div className='flex flex-col sm:flex-row sm:justify-between'>
                            <span className='text-sm text-gray-600'>
                              Customer Phone:
                            </span>
                            <span className='text-sm sm:text-base font-medium'>
                              {orderDetails?.customerPhone || 'N/A'}
                            </span>
                          </div>
                          <div className='flex flex-col sm:flex-row sm:justify-between'>
                            <span className='text-sm text-gray-600'>
                              Pickup Time:
                            </span>
                            <span className='text-sm sm:text-base font-medium'>
                              {orderDetails?.pickupTime
                                ? formatDate(orderDetails.pickupTime)
                                : 'N/A'}
                            </span>
                          </div>
                          {orderDetails?.deliveryTime && (
                            <div className='flex flex-col sm:flex-row sm:justify-between'>
                              <span className='text-sm text-gray-600'>
                                Delivery Time:
                              </span>
                              <span className='text-sm sm:text-base font-medium'>
                                {formatDate(orderDetails.deliveryTime)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Processing Details */}
                      {orderDetails?.processingDetails && (
                        <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm'>
                          <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                            <span className='mr-2'>⚙️</span>
                            Processing Details
                          </h3>
                          <div className='space-y-3'>
                            {orderDetails?.processingDetails?.washType && (
                              <div className='flex flex-col sm:flex-row sm:justify-between'>
                                <span className='text-sm text-gray-600'>
                                  Wash Type:
                                </span>
                                <span className='text-sm sm:text-base font-medium'>
                                  {orderDetails.processingDetails.washType}
                                </span>
                              </div>
                            )}
                            {orderDetails?.processingDetails?.dryType && (
                              <div className='flex flex-col sm:flex-row sm:justify-between'>
                                <span className='text-sm text-gray-600'>
                                  Dry Type:
                                </span>
                                <span className='text-sm sm:text-base font-medium'>
                                  {orderDetails.processingDetails.dryType}
                                </span>
                              </div>
                            )}
                            {orderDetails?.processingDetails?.fabricType && (
                              <div className='flex flex-col sm:flex-row sm:justify-between'>
                                <span className='text-sm text-gray-600'>
                                  Fabric Type:
                                </span>
                                <span className='text-sm sm:text-base font-medium'>
                                  {orderDetails.processingDetails.fabricType}
                                </span>
                              </div>
                            )}
                            {orderDetails?.processingDetails
                              ?.stainTreatment && (
                              <div className='flex flex-col sm:flex-row sm:justify-between'>
                                <span className='text-sm text-gray-600'>
                                  Stain Treatment:
                                </span>
                                <span className='text-sm sm:text-base font-medium'>
                                  {
                                    orderDetails.processingDetails
                                      .stainTreatment
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Services Tab */}
                {activeTab === 'services' && (
                  <div className='space-y-4 sm:space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm'>
                      <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-6 flex items-center'>
                        <span className='mr-2'>👕</span>
                        Selected Services & Items
                      </h3>

                      {/* Show original services */}
                      <div className='mb-6 sm:mb-8'>
                        <h4 className='text-sm sm:text-base font-semibold text-gray-800 mb-4 flex items-center'>
                          <span className='mr-2'>📋</span>
                          Services Requested
                        </h4>
                        <div className='space-y-3 sm:space-y-4'>
                          {orderDetails?.items?.map((item, index) => (
                            <div
                              key={item?.id || index}
                              className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 sm:space-y-0'
                            >
                              <div className='flex-1'>
                                <p className='font-semibold text-gray-900 text-sm sm:text-base'>
                                  {item?.serviceName || 'N/A'}
                                </p>
                                {item?.notes && (
                                  <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                              <div className='text-right sm:text-left'>
                                <p className='text-xs sm:text-sm text-gray-600'>
                                  Qty: {item?.quantity || 0}
                                </p>
                                <p className='text-xs sm:text-sm text-gray-600'>
                                  @{item?.unitPrice?.toFixed(3) || '0.000'} BD
                                </p>
                                <p className='font-semibold text-gray-900 text-sm sm:text-base'>
                                  {item?.totalPrice?.toFixed(3) || '0.000'} BD
                                </p>
                              </div>
                            </div>
                          ))}
                          {(!orderDetails?.items ||
                            orderDetails.items.length === 0) && (
                            <div className='text-center py-8 text-gray-500'>
                              <p className='text-base sm:text-lg'>
                                No services selected for this order
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Show sorted items if available */}
                      {orderDetails?.invoiceItems &&
                        orderDetails.invoiceItems.length > 0 && (
                          <div className='border-t border-gray-200 pt-6'>
                            <h4 className='text-sm sm:text-base font-semibold text-gray-800 mb-4 flex items-center'>
                              <span className='mr-2'>📦</span>
                              Items Found & Sorted
                              <span className='ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full'>
                                Admin Verified
                              </span>
                            </h4>
                            <div className='space-y-3 sm:space-y-4'>
                              {orderDetails.invoiceItems.map((item, index) => (
                                <div
                                  key={item?.id || index}
                                  className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2 sm:space-y-0'
                                >
                                  <div className='flex-1'>
                                    <p className='font-semibold text-gray-900 text-sm sm:text-base'>
                                      {item?.serviceName || 'N/A'}
                                    </p>
                                    {item?.notes && (
                                      <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                                        {item.notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className='text-right sm:text-left'>
                                    <p className='text-xs sm:text-sm text-gray-600'>
                                      Qty: {item?.quantity || 0}
                                    </p>
                                    <p className='text-xs sm:text-sm text-gray-600'>
                                      @{item?.unitPrice?.toFixed(3) || '0.000'}{' '}
                                      BD
                                    </p>
                                    <p className='font-semibold text-gray-900 text-sm sm:text-base'>
                                      {item?.totalPrice?.toFixed(3) || '0.000'}{' '}
                                      BD
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className='mt-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                              <div className='flex items-start'>
                                <span className='text-yellow-600 mr-2 mt-1'>
                                  ⚠️
                                </span>
                                <div>
                                  <p className='text-xs sm:text-sm font-medium text-yellow-800'>
                                    Item Verification
                                  </p>
                                  <p className='text-xs sm:text-sm text-yellow-700 mt-1'>
                                    Please verify that all your items are listed
                                    above. If you notice any missing or
                                    incorrect items, contact us immediately at{' '}
                                    <span className='font-semibold'>
                                      +973 1234 5678
                                    </span>{' '}
                                    or
                                    <span className='font-semibold'>
                                      {' '}
                                      info@laundrylink.bh
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Show message when no sorted items yet */}
                      {(!orderDetails?.invoiceItems ||
                        orderDetails.invoiceItems.length === 0) && (
                        <div className='border-t border-gray-200 pt-6'>
                          <div className='text-center py-8 text-gray-500'>
                            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                              <span className='text-xl sm:text-2xl'>⏳</span>
                            </div>
                            <p className='text-base sm:text-lg font-medium'>
                              Items being sorted
                            </p>
                            <p className='text-xs sm:text-sm mt-2'>
                              Our team is currently sorting and counting your
                              items. You&apos;ll see the detailed list here once
                              processing begins.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className='mt-6 pt-4 border-t border-gray-200'>
                        <div className='flex justify-between items-center'>
                          <span className='text-lg sm:text-xl font-bold text-gray-900'>
                            Total
                          </span>
                          <span className='text-xl sm:text-2xl font-bold text-gray-900'>
                            {orderDetails?.invoiceTotal?.toFixed(3) || '0.000'}{' '}
                            BD
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invoice Tab */}
                {activeTab === 'invoice' && (
                  <div className='space-y-4 sm:space-y-6'>
                    <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm'>
                      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0'>
                        <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                          <span className='mr-2'>🧾</span>
                          Invoice Details
                        </h3>
                        {isInvoiceReady(orderDetails?.status || '') && (
                          <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2'>
                            <button
                              onClick={handlePrintInvoice}
                              className='px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center text-sm'
                            >
                              <svg
                                className='w-4 h-4 mr-2'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
                                />
                              </svg>
                              Print
                            </button>
                            <button
                              onClick={handleDownloadInvoice}
                              disabled={invoiceLoading}
                              className='px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center text-sm disabled:opacity-50'
                            >
                              {invoiceLoading ? (
                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                              ) : (
                                <svg
                                  className='w-4 h-4 mr-2'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                  />
                                </svg>
                              )}
                              {invoiceLoading
                                ? 'Generating...'
                                : 'Download PDF'}
                            </button>
                          </div>
                        )}
                      </div>

                      {(() => {
                        if (isInvoiceReady(orderDetails?.status || '')) {
                          return (
                            <>
                              {/* Invoice Header */}
                              <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6'>
                                <div className='grid grid-cols-3 gap-4 text-center'>
                                  <div>
                                    <div className='text-xs sm:text-sm text-gray-600'>
                                      Invoice Total
                                    </div>
                                    <div className='font-bold text-sm sm:text-lg text-green-600'>
                                      {orderDetails?.invoiceTotal?.toFixed(3) ||
                                        '0.000'}{' '}
                                      BD
                                    </div>
                                  </div>
                                  <div>
                                    <div className='text-xs sm:text-sm text-gray-600'>
                                      Services
                                    </div>
                                    <div className='font-semibold text-gray-900'>
                                      {orderDetails?.items?.length || 0}
                                    </div>
                                  </div>
                                  <div>
                                    <div className='text-xs sm:text-sm text-gray-600'>
                                      Items
                                    </div>
                                    <div className='font-semibold text-gray-900'>
                                      {orderDetails?.invoiceItems?.length || 0}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Invoice Items */}
                              <div className='space-y-3 sm:space-y-4'>
                                {(() => {
                                  if (
                                    orderDetails?.invoiceItems &&
                                    orderDetails.invoiceItems.length > 0
                                  ) {
                                    return orderDetails.invoiceItems.map(
                                      (item, index) => (
                                        <div
                                          key={item?.id || index}
                                          className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-green-50 rounded-xl border border-green-100 space-y-2 sm:space-y-0'
                                        >
                                          <div className='flex-1'>
                                            <p className='font-semibold text-gray-900 text-sm sm:text-base'>
                                              {item?.serviceName || 'N/A'}
                                            </p>
                                            {item?.notes && (
                                              <p className='text-xs sm:text-sm text-gray-600 mt-1'>
                                                {item.notes}
                                              </p>
                                            )}
                                          </div>
                                          <div className='text-right sm:text-left'>
                                            <p className='text-xs sm:text-sm text-gray-600'>
                                              Qty: {item?.quantity || 0}
                                            </p>
                                            <p className='text-xs sm:text-sm text-gray-600'>
                                              @
                                              {item?.unitPrice?.toFixed(3) ||
                                                '0.000'}{' '}
                                              BD
                                            </p>
                                            <p className='font-semibold text-gray-900 text-sm sm:text-base'>
                                              {item?.totalPrice?.toFixed(3) ||
                                                '0.000'}{' '}
                                              BD
                                            </p>
                                          </div>
                                        </div>
                                      )
                                    );
                                  }
                                  return (
                                    <div className='text-center py-12 text-gray-500'>
                                      <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                        <span className='text-xl sm:text-2xl'>
                                          🧾
                                        </span>
                                      </div>
                                      <p className='text-base sm:text-lg font-medium'>
                                        Invoice not yet generated
                                      </p>
                                      <p className='text-xs sm:text-sm mt-2'>
                                        Admin will generate the invoice once
                                        your order is processed
                                      </p>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Invoice Summary */}
                              {orderDetails?.invoiceItems &&
                                orderDetails.invoiceItems.length > 0 && (
                                  <div className='mt-6 pt-4 border-t border-gray-200'>
                                    <div className='flex justify-between items-center'>
                                      <span className='text-lg sm:text-xl font-bold text-gray-900'>
                                        Total
                                      </span>
                                      <span className='text-xl sm:text-2xl font-bold text-gray-900'>
                                        {orderDetails?.invoiceTotal?.toFixed(
                                          3
                                        ) || '0.000'}{' '}
                                        BD
                                      </span>
                                    </div>
                                  </div>
                                )}
                            </>
                          );
                        }
                        return (
                          /* Show message when not ready for delivery */
                          <div className='text-center py-16 sm:py-20 text-gray-500'>
                            <div className='w-16 h-16 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                              <span className='text-2xl sm:text-4xl'>📋</span>
                            </div>
                            <h3 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>
                              Invoice Not Ready Yet
                            </h3>
                            <p className='text-base sm:text-lg mb-6'>
                              Your invoice will be available once your order is
                              ready for delivery.
                            </p>
                            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto'>
                              <div className='flex items-start'>
                                <span className='text-blue-600 mr-3 mt-1'>
                                  ℹ️
                                </span>
                                <div>
                                  <p className='text-xs sm:text-sm font-medium text-blue-800'>
                                    Current Status: {orderDetails?.status}
                                  </p>
                                  <p className='text-xs sm:text-sm text-blue-700 mt-1'>
                                    You can view your items in the{' '}
                                    <strong>Services</strong> tab to verify
                                    everything is correct.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Addresses Tab */}
                {activeTab === 'addresses' && (
                  <div className='space-y-4 sm:space-y-6'>
                    {(orderDetails?.pickupAddress ||
                      orderDetails?.deliveryAddress) && (
                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                        {/* Pickup Address */}
                        {orderDetails?.pickupAddress && (
                          <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm'>
                            <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                              <span className='mr-2'>🚚</span>
                              Pickup Address
                            </h3>
                            <div className='space-y-3'>
                              <p className='font-medium text-gray-900 text-sm sm:text-base'>
                                {orderDetails.pickupAddress.label}
                              </p>
                              <p className='text-gray-600 text-sm sm:text-base'>
                                {formatAddress(orderDetails.pickupAddress)}
                              </p>
                              {orderDetails.pickupAddress.contactNumber && (
                                <p className='text-gray-600 flex items-center text-sm sm:text-base'>
                                  <span className='mr-2'>📞</span>
                                  {orderDetails.pickupAddress.contactNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Delivery Address */}
                        {orderDetails?.deliveryAddress && (
                          <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm'>
                            <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                              <span className='mr-2'>🏠</span>
                              Delivery Address
                            </h3>
                            <div className='space-y-3'>
                              <p className='font-medium text-gray-900 text-sm sm:text-base'>
                                {orderDetails.deliveryAddress.label}
                              </p>
                              <p className='text-gray-600 text-sm sm:text-base'>
                                {formatAddress(orderDetails.deliveryAddress)}
                              </p>
                              {orderDetails.deliveryAddress.contactNumber && (
                                <p className='text-gray-600 flex items-center text-sm sm:text-base'>
                                  <span className='mr-2'>📞</span>
                                  {orderDetails.deliveryAddress.contactNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Customer Address */}
                    {orderDetails?.customerAddress && (
                      <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm'>
                        <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                          <span className='mr-2'>👤</span>
                          Customer Provided Address
                        </h3>
                        <div className='space-y-3'>
                          <p className='text-gray-600 text-sm sm:text-base'>
                            {orderDetails.customerAddress}
                          </p>
                          {orderDetails.customerPhone && (
                            <p className='text-gray-600 flex items-center text-sm sm:text-base'>
                              <span className='mr-2'>📞</span>
                              {orderDetails.customerPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <div className='space-y-4 sm:space-y-6'>
                    {/* Customer Notes */}
                    {orderDetails?.customerNotes && (
                      <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm'>
                        <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                          <span className='mr-2'>📝</span>
                          Customer Notes
                        </h3>
                        <p className='text-gray-700 bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 text-sm sm:text-base'>
                          {orderDetails.customerNotes}
                        </p>
                      </div>
                    )}

                    {/* Special Instructions */}
                    {orderDetails?.processingDetails?.specialInstructions && (
                      <div className='bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm'>
                        <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                          <span className='mr-2'>⚠️</span>
                          Special Instructions
                        </h3>
                        <p className='text-gray-700 bg-yellow-50 rounded-xl p-3 sm:p-4 border border-yellow-100 text-sm sm:text-base'>
                          {orderDetails.processingDetails.specialInstructions}
                        </p>
                      </div>
                    )}

                    {!orderDetails?.customerNotes &&
                      !orderDetails?.processingDetails?.specialInstructions && (
                        <div className='text-center py-16 sm:py-20 text-gray-500'>
                          <p className='text-base sm:text-lg'>
                            No notes or special instructions
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
