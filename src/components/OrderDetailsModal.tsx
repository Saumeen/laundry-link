'use client';

import { useState, useEffect, useCallback } from 'react';
import { OrderStatus } from '@prisma/client';

// Constants
const Z_INDEX_MODAL = 50;
const MAX_MODAL_WIDTH = '6xl';
const MAX_MODAL_HEIGHT = '95vh';
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

// Professional status configuration with proper OrderStatus values
const STATUS_CONFIG = {
  [OrderStatus.ORDER_PLACED]: {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-100',
    icon: '📋',
    description: 'Your order has been successfully placed and is awaiting confirmation',
    step: 1,
  },
  [OrderStatus.CONFIRMED]: {
    color: 'bg-green-50 text-green-700 border-green-200',
    bgColor: 'bg-green-100',
    icon: '✅',
    description: 'Your order has been confirmed and is being prepared for pickup',
    step: 2,
  },
  [OrderStatus.PICKUP_ASSIGNED]: {
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    bgColor: 'bg-purple-100',
    icon: '🚚',
    description: 'A driver has been assigned to pick up your items',
    step: 3,
  },
  [OrderStatus.PICKUP_IN_PROGRESS]: {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    bgColor: 'bg-orange-100',
    icon: '🔄',
    description: 'Driver is on the way to pick up your items',
    step: 4,
  },
  [OrderStatus.PICKUP_COMPLETED]: {
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    bgColor: 'bg-teal-100',
    icon: '📦',
    description: 'Your items have been successfully picked up',
    step: 5,
  },
  [OrderStatus.PICKUP_FAILED]: {
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-100',
    icon: '❌',
    description: 'Pickup was unsuccessful. We will contact you to reschedule',
    step: 0,
  },
  [OrderStatus.DROPPED_OFF]: {
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bgColor: 'bg-indigo-100',
    icon: '🏢',
    description: 'Your items have been dropped off at our facility',
    step: 6,
  },
  [OrderStatus.RECEIVED_AT_FACILITY]: {
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    bgColor: 'bg-cyan-100',
    icon: '🏭',
    description: 'Your items have been received and are being sorted',
    step: 7,
  },
  [OrderStatus.PROCESSING_STARTED]: {
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    bgColor: 'bg-yellow-100',
    icon: '⚙️',
    description: 'Your items are being cleaned and processed',
    step: 8,
  },
  [OrderStatus.PROCESSING_COMPLETED]: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgColor: 'bg-emerald-100',
    icon: '✨',
    description: 'Processing is complete and items are ready for quality check',
    step: 9,
  },
  [OrderStatus.QUALITY_CHECK]: {
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    bgColor: 'bg-violet-100',
    icon: '🔍',
    description: 'Your items are undergoing quality inspection',
    step: 10,
  },
  [OrderStatus.READY_FOR_DELIVERY]: {
    color: 'bg-green-50 text-green-700 border-green-200',
    bgColor: 'bg-green-100',
    icon: '📦',
    description: 'Your items are ready for delivery',
    step: 11,
  },
  [OrderStatus.DELIVERY_ASSIGNED]: {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-100',
    icon: '🚚',
    description: 'A driver has been assigned for delivery',
    step: 12,
  },
  [OrderStatus.DELIVERY_IN_PROGRESS]: {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    bgColor: 'bg-orange-100',
    icon: '🛵',
    description: 'Driver is on the way to deliver your items',
    step: 13,
  },
  [OrderStatus.DELIVERED]: {
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    bgColor: 'bg-gray-100',
    icon: '🎉',
    description: 'Your order has been successfully delivered',
    step: 14,
  },
  [OrderStatus.DELIVERY_FAILED]: {
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-100',
    icon: '❌',
    description: 'Delivery was unsuccessful. We will contact you to reschedule',
    step: 0,
  },
  [OrderStatus.CANCELLED]: {
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-100',
    icon: '🚫',
    description: 'This order has been cancelled',
    step: 0,
  },
  [OrderStatus.REFUNDED]: {
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-100',
    icon: '💰',
    description: 'This order has been refunded',
    step: 0,
  },
} as const;

// Tab configuration with icons
const TABS = [
  { id: 'overview', label: 'Overview', icon: '📋' },
  { id: 'timeline', label: 'Timeline', icon: '⏱️' },
  { id: 'services', label: 'Services', icon: '🧺' },
  { id: 'invoice', label: 'Invoice', icon: '🧾' },
  { id: 'addresses', label: 'Addresses', icon: '📍' },
  { id: 'notes', label: 'Notes', icon: '📝' },
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
  status: OrderStatus;
  invoiceTotal: number;
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
const isInvoiceReady = (status: OrderStatus): boolean => {
  switch (status) {
    case OrderStatus.PROCESSING_COMPLETED:
    case OrderStatus.QUALITY_CHECK:
    case OrderStatus.READY_FOR_DELIVERY:
    case OrderStatus.DELIVERY_ASSIGNED:
    case OrderStatus.DELIVERY_IN_PROGRESS:
    case OrderStatus.DELIVERED:
      return true;
    default:
      return false;
  }
};

const getStatusConfig = (status: OrderStatus) => {
  return (
    STATUS_CONFIG[status] || {
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      bgColor: 'bg-gray-100',
      icon: '❓',
      description: 'Status unknown',
      step: 0,
    }
  );
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
};

const formatAddress = (address: Address): string => {
  if (!address) return 'Not specified';
  
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
};

// Component: Professional Status Card
const StatusCard = ({ orderDetails }: { orderDetails: OrderDetails }) => {
  const statusConfig = getStatusConfig(orderDetails.status);
  
  return (
    <div className='bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-lg'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${statusConfig.bgColor} shadow-md`}>
            <span className='text-2xl'>{statusConfig.icon}</span>
          </div>
          <div className='flex-1'>
            <h3 className='text-xl font-bold text-gray-900 mb-2'>Order Status</h3>
            <div className='flex items-center space-x-3'>
              <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full border-2 ${statusConfig.color} shadow-sm`}>
                {statusConfig.icon} {orderDetails.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className='text-sm text-gray-600 mt-2 max-w-md'>{statusConfig.description}</p>
          </div>
        </div>
        <div className='text-right'>
          <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-200'>
            <p className='text-3xl font-bold text-gray-900'>
              {orderDetails.invoiceTotal?.toFixed(3) || '0.000'} BD
            </p>
            <p className='text-sm text-gray-600 font-medium'>Total Amount</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component: Order Timeline
const OrderTimeline = ({ orderDetails }: { orderDetails: OrderDetails }) => {
  const currentStep = getStatusConfig(orderDetails.status).step;
  const totalSteps = 14;
  
  const timelineSteps = [
    { step: 1, title: 'Order Placed', description: 'Order submitted successfully' },
    { step: 2, title: 'Confirmed', description: 'Order confirmed by our team' },
    { step: 3, title: 'Pickup Assigned', description: 'Driver assigned for pickup' },
    { step: 4, title: 'Pickup In Progress', description: 'Driver en route' },
    { step: 5, title: 'Pickup Completed', description: 'Items collected' },
    { step: 6, title: 'Dropped Off', description: 'Items at facility' },
    { step: 7, title: 'Received', description: 'Items being sorted' },
    { step: 8, title: 'Processing', description: 'Items being cleaned' },
    { step: 9, title: 'Processing Complete', description: 'Cleaning finished' },
    { step: 10, title: 'Quality Check', description: 'Final inspection' },
    { step: 11, title: 'Ready for Delivery', description: 'Items ready' },
    { step: 12, title: 'Delivery Assigned', description: 'Driver assigned' },
    { step: 13, title: 'Delivery In Progress', description: 'Driver en route' },
    { step: 14, title: 'Delivered', description: 'Order completed' },
  ];

  return (
    <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
      <h3 className='text-xl font-bold text-gray-900 mb-6'>Order Progress</h3>
      <div className='relative'>
        {/* Progress Bar */}
        <div className='absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full'>
          <div 
            className='h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500'
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        
        {/* Timeline Steps */}
        <div className='space-y-8'>
          {timelineSteps.map((step, index) => {
            const isCompleted = step.step <= currentStep;
            const isCurrent = step.step === currentStep;
            
            return (
              <div key={step.step} className='relative flex items-start space-x-4'>
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white shadow-lg' 
                    : isCurrent
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg animate-pulse'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <span className='text-lg'>✓</span>
                  ) : (
                    <span className='text-sm font-bold'>{step.step}</span>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <h4 className={`text-sm font-semibold ${
                    isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h4>
                  <p className={`text-xs ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Component: Order Information
const OrderInformation = ({ orderDetails }: { orderDetails: OrderDetails }) => {
  return (
    <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
      <h3 className='text-xl font-bold text-gray-900 mb-6'>Order Information</h3>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Order Number:</span>
            <span className='text-sm font-bold text-gray-900'>#{orderDetails.orderNumber}</span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Order Date:</span>
            <span className='text-sm font-semibold text-gray-900'>
              {orderDetails.createdAt ? formatDate(orderDetails.createdAt) : 'N/A'}
            </span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Customer Phone:</span>
            <span className='text-sm font-semibold text-gray-900'>{orderDetails.customerPhone || 'N/A'}</span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Pickup Date:</span>
            <span className='text-sm font-semibold text-gray-900'>
              {orderDetails.pickupStartTime
                ? new Date(orderDetails.pickupStartTime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>
        </div>
        <div className='space-y-4'>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Last Updated:</span>
            <span className='text-sm font-semibold text-gray-900'>
              {orderDetails.updatedAt ? formatDate(orderDetails.updatedAt) : 'N/A'}
            </span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Pickup Time:</span>
            <span className='text-sm font-semibold text-gray-900'>{orderDetails.pickupTimeSlot || 'N/A'}</span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Delivery Date:</span>
            <span className='text-sm font-semibold text-gray-900'>
              {orderDetails.deliveryStartTime
                ? new Date(orderDetails.deliveryStartTime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>
          <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
            <span className='text-sm font-medium text-gray-600'>Delivery Time:</span>
            <span className='text-sm font-semibold text-gray-900'>{orderDetails.deliveryTimeSlot || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component: Processing Details
const ProcessingDetails = ({ processingDetails }: { processingDetails?: ProcessingDetails }) => {
  if (!processingDetails) return null;
  
  return (
    <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
      <h3 className='text-xl font-bold text-gray-900 mb-6'>Processing Details</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {processingDetails.washType && (
          <div className='flex justify-between items-center p-3 bg-blue-50 rounded-lg'>
            <span className='text-sm font-medium text-blue-700'>Wash Type:</span>
            <span className='text-sm font-semibold text-blue-900'>{processingDetails.washType}</span>
          </div>
        )}
        {processingDetails.dryType && (
          <div className='flex justify-between items-center p-3 bg-green-50 rounded-lg'>
            <span className='text-sm font-medium text-green-700'>Dry Type:</span>
            <span className='text-sm font-semibold text-green-900'>{processingDetails.dryType}</span>
          </div>
        )}
        {processingDetails.fabricType && (
          <div className='flex justify-between items-center p-3 bg-purple-50 rounded-lg'>
            <span className='text-sm font-medium text-purple-700'>Fabric Type:</span>
            <span className='text-sm font-semibold text-purple-900'>{processingDetails.fabricType}</span>
          </div>
        )}
        {processingDetails.stainTreatment && (
          <div className='flex justify-between items-center p-3 bg-orange-50 rounded-lg'>
            <span className='text-sm font-medium text-orange-700'>Stain Treatment:</span>
            <span className='text-sm font-semibold text-orange-900'>{processingDetails.stainTreatment}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Component: Service Item
const ServiceItem = ({ item, isVerified = false }: { item: OrderItem; isVerified?: boolean }) => {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
      isVerified 
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className='flex-1'>
        <div className='flex items-center space-x-2'>
          <p className='font-semibold text-gray-900'>{item.serviceName}</p>
          {isVerified && (
            <span className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium'>
              Verified
            </span>
          )}
        </div>
        {item.notes && (
          <p className='text-sm text-gray-600 mt-1 italic'>"{item.notes}"</p>
        )}
      </div>
      <div className='text-right'>
        <p className='text-sm text-gray-600 font-medium'>Qty: {item.quantity}</p>
        <p className='text-sm text-gray-600'>@{item.unitPrice?.toFixed(3)} BD</p>
        <p className='font-bold text-lg text-gray-900'>{item.totalPrice?.toFixed(3)} BD</p>
      </div>
    </div>
  );
};

// Component: Services Tab
const ServicesTab = ({ orderDetails }: { orderDetails: OrderDetails }) => {
  return (
    <div className='space-y-6'>
      <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
        <h3 className='text-xl font-bold text-gray-900 mb-6'>Selected Services</h3>
        
        {/* Original services */}
        <div className='mb-8'>
          <h4 className='text-lg font-semibold text-gray-800 mb-4 flex items-center'>
            <span className='mr-2'>🧺</span>
            Services Requested
          </h4>
          <div className='space-y-4'>
            {orderDetails.items?.map((item, index) => (
              <ServiceItem key={item?.id || index} item={item} />
            ))}
            {(!orderDetails.items || orderDetails.items.length === 0) && (
              <div className='text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
                <div className='text-4xl mb-4'>🧺</div>
                <p className='font-medium text-lg'>No services selected</p>
                <p className='text-sm mt-2'>No services have been selected for this order</p>
              </div>
            )}
          </div>
        </div>

        {/* Verified items */}
        {orderDetails.invoiceItems && orderDetails.invoiceItems.length > 0 && (
          <div className='border-t-2 border-gray-200 pt-8'>
            <h4 className='text-lg font-semibold text-gray-800 mb-4 flex items-center'>
              <span className='mr-2'>✅</span>
              Items Found & Sorted
              <span className='ml-3 px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-bold'>
                VERIFIED
              </span>
            </h4>
            <div className='space-y-4'>
              {orderDetails.invoiceItems.map((item, index) => (
                <ServiceItem key={item?.id || index} item={item} isVerified={true} />
              ))}
            </div>
            <div className='mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl'>
              <div className='flex items-start space-x-3'>
                <span className='text-xl'>⚠️</span>
                <div>
                  <p className='text-sm font-semibold text-yellow-800 mb-1'>Important Notice</p>
                  <p className='text-sm text-yellow-700'>
                    Please verify that all your items are listed above. Contact us immediately if you notice any missing or incorrect items.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No verified items yet */}
        {(!orderDetails.invoiceItems || orderDetails.invoiceItems.length === 0) && (
          <div className='border-t-2 border-gray-200 pt-8'>
            <div className='text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
              <div className='text-4xl mb-4'>⏳</div>
              <p className='font-medium text-lg'>Items being sorted</p>
              <p className='text-sm mt-2 max-w-md mx-auto'>
                Our team is currently sorting and counting your items. You'll see the detailed list here once processing begins.
              </p>
            </div>
          </div>
        )}

        <div className='mt-8 pt-6 border-t-2 border-gray-200'>
          <div className='flex justify-between items-center bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl'>
            <span className='text-xl font-bold text-gray-900'>Total Amount</span>
            <span className='text-2xl font-bold text-blue-600'>
              {orderDetails.invoiceTotal?.toFixed(3) || '0.000'} BD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component: Invoice Tab
const InvoiceTab = ({ orderDetails, onDownload, onPrint, invoiceLoading }: {
  orderDetails: OrderDetails;
  onDownload: () => void;
  onPrint: () => void;
  invoiceLoading: boolean;
}) => {
  const isReady = isInvoiceReady(orderDetails.status);

  return (
    <div className='space-y-6'>
      <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-bold text-gray-900'>Invoice Details</h3>
          {isReady && (
            <div className='flex space-x-3'>
              <button
                onClick={onPrint}
                className='px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm'
              >
                🖨️ Print
              </button>
              <button
                onClick={onDownload}
                disabled={invoiceLoading}
                className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {invoiceLoading ? '⏳ Generating...' : '📥 Download PDF'}
              </button>
            </div>
          )}
        </div>

        {isReady ? (
          <>
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6'>
              <div className='grid grid-cols-3 gap-6 text-center'>
                <div className='bg-white rounded-lg p-4 shadow-sm'>
                  <div className='text-sm text-gray-600 font-medium'>Invoice Total</div>
                  <div className='font-bold text-2xl text-green-600'>
                    {orderDetails.invoiceTotal?.toFixed(3) || '0.000'} BD
                  </div>
                </div>
                <div className='bg-white rounded-lg p-4 shadow-sm'>
                  <div className='text-sm text-gray-600 font-medium'>Services</div>
                  <div className='font-bold text-2xl text-blue-600'>{orderDetails.items?.length || 0}</div>
                </div>
                <div className='bg-white rounded-lg p-4 shadow-sm'>
                  <div className='text-sm text-gray-600 font-medium'>Items</div>
                  <div className='font-bold text-2xl text-purple-600'>{orderDetails.invoiceItems?.length || 0}</div>
                </div>
              </div>
            </div>

            {orderDetails.invoiceItems && orderDetails.invoiceItems.length > 0 ? (
              <div className='space-y-4'>
                {orderDetails.invoiceItems.map((item, index) => (
                  <ServiceItem key={item?.id || index} item={item} isVerified={true} />
                ))}
                <div className='mt-6 pt-4 border-t-2 border-gray-200'>
                  <div className='flex justify-between items-center bg-gradient-to-r from-gray-50 to-green-50 p-4 rounded-xl'>
                    <span className='text-xl font-bold text-gray-900'>Total</span>
                    <span className='text-2xl font-bold text-green-600'>
                      {orderDetails.invoiceTotal?.toFixed(3) || '0.000'} BD
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-center py-16 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
                <div className='text-4xl mb-4'>📄</div>
                <p className='font-medium text-lg'>Invoice not yet generated</p>
                <p className='text-sm mt-2'>Admin will generate the invoice once your order is processed</p>
              </div>
            )}
          </>
        ) : (
          <div className='text-center py-16 text-gray-500'>
            <div className='text-6xl mb-6'>📋</div>
            <h3 className='text-2xl font-bold text-gray-900 mb-4'>Invoice Not Ready Yet</h3>
            <p className='mb-8 text-lg'>Your invoice will be available once your order is ready for delivery.</p>
            <div className='bg-blue-50 border-2 border-blue-200 rounded-xl p-6 max-w-md mx-auto'>
              <p className='text-sm font-bold text-blue-800 mb-2'>Current Status: {orderDetails.status.replace(/_/g, ' ')}</p>
              <p className='text-sm text-blue-700'>
                You can view your items in the Services tab to verify everything is correct.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component: Address Card
const AddressCard = ({ title, address, icon }: { title: string; address: Address; icon: string }) => {
  return (
    <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow'>
      <div className='flex items-center mb-4'>
        <span className='text-2xl mr-3'>{icon}</span>
        <h3 className='text-lg font-bold text-gray-900'>{title}</h3>
      </div>
      <div className='space-y-3'>
        <div className='p-3 bg-gray-50 rounded-lg'>
          <p className='font-semibold text-gray-900'>{address.label}</p>
        </div>
        <div className='p-3 bg-blue-50 rounded-lg'>
          <p className='text-gray-700'>{formatAddress(address)}</p>
        </div>
        {address.contactNumber && (
          <div className='p-3 bg-green-50 rounded-lg'>
            <p className='text-gray-700 font-medium'>📞 {address.contactNumber}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Component: Addresses Tab
const AddressesTab = ({ orderDetails }: { orderDetails: OrderDetails }) => {
  return (
    <div className='space-y-6'>
      {(orderDetails.pickupAddress || orderDetails.deliveryAddress) && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {orderDetails.pickupAddress && (
            <AddressCard title='Pickup Address' address={orderDetails.pickupAddress} icon='📤' />
          )}
          {orderDetails.deliveryAddress && (
            <AddressCard title='Delivery Address' address={orderDetails.deliveryAddress} icon='📥' />
          )}
        </div>
      )}

      {orderDetails.customerAddress && (
        <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>🏠</span>
            <h3 className='text-lg font-bold text-gray-900'>Customer Address</h3>
          </div>
          <div className='space-y-3'>
            <div className='p-4 bg-gray-50 rounded-lg'>
              <p className='text-gray-700'>{orderDetails.customerAddress}</p>
            </div>
            {orderDetails.customerPhone && (
              <div className='p-4 bg-blue-50 rounded-lg'>
                <p className='text-gray-700 font-medium'>📞 {orderDetails.customerPhone}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Component: Notes Tab
const NotesTab = ({ orderDetails }: { orderDetails: OrderDetails }) => {
  return (
    <div className='space-y-6'>
      {orderDetails.customerNotes && (
        <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>💬</span>
            <h3 className='text-lg font-bold text-gray-900'>Customer Notes</h3>
          </div>
          <div className='p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400'>
            <p className='text-gray-700 italic'>"{orderDetails.customerNotes}"</p>
          </div>
        </div>
      )}

      {orderDetails.processingDetails?.specialInstructions && (
        <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
          <div className='flex items-center mb-4'>
            <span className='text-2xl mr-3'>⚠️</span>
            <h3 className='text-lg font-bold text-gray-900'>Special Instructions</h3>
          </div>
          <div className='p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400'>
            <p className='text-gray-700 font-medium'>{orderDetails.processingDetails.specialInstructions}</p>
          </div>
        </div>
      )}

      {!orderDetails.customerNotes && !orderDetails.processingDetails?.specialInstructions && (
        <div className='text-center py-16 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200'>
          <div className='text-4xl mb-4'>📝</div>
          <p className='font-medium text-lg'>No notes or special instructions</p>
          <p className='text-sm mt-2'>No additional notes have been added to this order</p>
        </div>
      )}
    </div>
  );
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
      }
    } catch {
      // Error handling for download invoice
    } finally {
      setInvoiceLoading(false);
    }
  }, [orderId, orderDetails?.orderNumber]);

  const handlePrintInvoice = useCallback(() => {
    window.print();
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  if (!orderId) return null;

  return (
    <div className={`fixed inset-0 z-${Z_INDEX_MODAL} ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/60 backdrop-blur-sm'
        aria-hidden='true'
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className='fixed inset-0 flex items-center justify-center p-4'>
        <div className={`mx-auto w-full max-w-${MAX_MODAL_WIDTH} max-h-[${MAX_MODAL_HEIGHT}] bg-gray-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl'>
            <div className='flex items-center space-x-4'>
              <div className='w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
                <span className='text-white font-bold text-lg'>
                  #{orderDetails?.orderNumber || 'N/A'}
                </span>
              </div>
              <div>
                <h2 className='text-2xl font-bold text-gray-900'>Order Details</h2>
                <p className='text-sm text-gray-600 font-medium'>Order #{orderDetails?.orderNumber || 'N/A'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='p-3 hover:bg-gray-100 rounded-xl transition-colors'
            >
              <span className='text-2xl text-gray-500 hover:text-gray-700'>×</span>
            </button>
          </div>

          {/* Tabs */}
          <div className='border-b border-gray-200 bg-white'>
            <div className='flex overflow-x-auto scrollbar-hide'>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className='mr-2'>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-y-auto min-h-0 bg-gray-50'>
            {loading && (
              <div className='flex flex-col items-center justify-center py-20 px-4'>
                <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4'></div>
                <span className='text-gray-600 font-medium'>Loading order details...</span>
              </div>
            )}

            {error && !loading && (
              <div className='flex flex-col items-center justify-center py-20 px-4'>
                <div className='text-6xl mb-4'>❌</div>
                <p className='text-red-600 text-center mb-6 font-medium'>{error}</p>
                <button
                  onClick={handleRetry}
                  className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm'
                >
                  🔄 Try Again
                </button>
              </div>
            )}

            {orderDetails && !loading && !error && (
              <div className='p-6'>
                {activeTab === 'overview' && (
                  <div className='space-y-6'>
                    <StatusCard orderDetails={orderDetails} />
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                      <OrderInformation orderDetails={orderDetails} />
                      <ProcessingDetails processingDetails={orderDetails.processingDetails} />
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && <OrderTimeline orderDetails={orderDetails} />}
                {activeTab === 'services' && <ServicesTab orderDetails={orderDetails} />}
                {activeTab === 'invoice' && (
                  <InvoiceTab
                    orderDetails={orderDetails}
                    onDownload={handleDownloadInvoice}
                    onPrint={handlePrintInvoice}
                    invoiceLoading={invoiceLoading}
                  />
                )}
                {activeTab === 'addresses' && <AddressesTab orderDetails={orderDetails} />}
                {activeTab === 'notes' && <NotesTab orderDetails={orderDetails} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
