'use client';

import {
  getStatusBadgeColor,
  getStatusDisplayName,
} from '@/admin/utils/orderUtils';
import AdminHeader from '@/components/admin/AdminHeader';
import { ToastProvider } from '@/components/ui/Toast';
import {
  formatUTCForDisplay,
  formatUTCForTimeDisplay,
} from '@/lib/utils/timezone';
import logger from '@/lib/logger';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import type { OrderStatus } from '@/shared/types';

// Order interface matching API response
interface OrderWithRelations {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  pickupTime: string;
  deliveryTime: string;
  pickupStartTime: string;
  pickupEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  pickupTimeSlot?: string;
  deliveryTimeSlot?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    wallet?: {
      balance: number;
      currency: string;
    };
  };
  address?: {
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
    locationType?: string;
    latitude?: number;
    longitude?: number;
  };
  orderServiceMappings: Array<{
    id: number;
    serviceId: number;
    quantity: number;
    price: number;
    service: {
      id: number;
      name: string;
      displayName: string;
      description: string;
      pricingType: string;
      pricingUnit: string;
      price: number;
      unit: string;
    };
    orderItems: Array<{
      id: number;
      itemName: string;
      itemType: string;
      quantity: number;
      pricePerItem: number;
      totalPrice: number;
      notes?: string;
    }>;
  }>;
  driverAssignments?: any[];
  specialInstructions?: string | null;
  invoiceTotal?: number | null;
  minimumOrderApplied?: boolean | null;
  orderProcessing?: any;
  paymentRecords?: Array<{
    id: number;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND';
    description?: string;
    tapTransactionId?: string;
    tapReference?: string;
    refundAmount?: number;
    refundReason?: string;
    processedAt?: string;
    createdAt: string;
    updatedAt: string;
    walletTransaction?: {
      id: number;
      transactionType: string;
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      status: string;
      description: string;
    };
  }>;
  paymentSummary?: {
    totalPaid: number;
    totalRefunded: number;
    totalPending: number;
    totalFailed: number;
    availableForRefund: number;
    netAmountPaid: number;
    outstandingAmount: number;
    paymentRecordsCount: number;
    invoiceTotal: number;
  };
}

// Import the new modular components
import {
  DriverAssignmentsTab,
  OrderEditTab,
  OrderOverviewTab,
} from '@/components/admin/orders';
import ServicesTab from '@/components/admin/orders/ServicesTab';
import OrderItemsTab from '@/components/admin/orders/OrderItemsTab';
import InvoiceTab from '@/components/admin/orders/InvoiceTab';
import OrderHistoryTab from '@/components/admin/orders/OrderHistoryTab';
import PaymentTab from '@/components/admin/orders/PaymentTab';

// Constants
const ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'OPERATION_MANAGER',
  'DRIVER',
  'FACILITY_TEAM',
] as const;

// API Response interfaces
interface OrderResponse {
  order: OrderWithRelations;
}

interface ErrorResponse {
  error: string;
}

type TabType =
  | 'overview'
  | 'edit'
  | 'assignments'
  | 'services'
  | 'order-items'
  | 'invoice'
  | 'history'
  | 'payment';

// Tab Button Component
const TabButton = React.memo(
  ({
    isActive,
    onClick,
    children,
    count,
  }: {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    count?: number;
  }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        isActive
          ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
            isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
);

function OrderEditPageContent() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  const [order, setOrder] = useState<OrderWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [orderId, setOrderId] = useState<string>('');

  // Memoized tab click handlers
  const handleTabClick = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // Handle async params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setOrderId(resolvedParams.orderId as string);
    };
    getParams();
  }, [params]);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/order-details/${orderId}`);
      if (response.ok) {
        const data = (await response.json()) as OrderResponse;
        setOrder(data.order);
      } else {
        const errorData = (await response.json()) as ErrorResponse;
        setError(errorData.error || 'Failed to fetch order');
      }
    } catch (error) {
      logger.error('Error fetching order:', error);
      setError('Failed to fetch order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (session?.userType !== 'admin') {
      router.push('/admin/login');
      return;
    }

    // Check if user has appropriate role to view orders
    if (session?.role && !ALLOWED_ROLES.includes(session.role as any)) {
      router.push('/admin/login');
      return;
    }

    fetchOrder();
  }, [status, session, router, fetchOrder]);

  // Get the appropriate dashboard URL based on user role
  const getDashboardUrl = useCallback(() => {
    if (!session?.role) return '/admin';

    switch (session.role) {
      case 'SUPER_ADMIN':
        return '/admin/super-admin';
      case 'OPERATION_MANAGER':
        return '/admin/operation-manager';
      case 'DRIVER':
        return '/admin/driver';
      case 'FACILITY_TEAM':
        return '/admin/facility-team';
      default:
        return '/admin';
    }
  }, [session?.role]);

  const getStatusColor = useCallback((status: string) => {
    return getStatusBadgeColor(status);
  }, []);

  const getOrderTotal = (order: OrderWithRelations): number => {
    if (!order) return 0;

    let subtotal = 0;
    if (order.orderServiceMappings) {
      order.orderServiceMappings.forEach(mapping => {
        if (mapping.orderItems) {
          mapping.orderItems.forEach(item => {
            subtotal += item.totalPrice;
          });
        }
      });
    }

    return order.invoiceTotal || subtotal;
  };

  const handleDeleteOrderItem = async (orderId: number, itemId: number) => {
    try {
      const response = await fetch(`/api/admin/delete-order-item?id=${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to delete item');
      }

      // Refresh the order data
      await fetchOrder();
    } catch (error) {
      logger.error('Error deleting order item:', error);
      throw error;
    }
  };

  const total = getOrderTotal(order!);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <AdminHeader title='Loading Order...' />
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <AdminHeader title='Order Not Found' />
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center py-12'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Order Not Found
            </h2>
            <p className='text-gray-600 mb-6'>
              {error || 'The requested order could not be found.'}
            </p>
            <Link
              href={getDashboardUrl()}
              className='bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700'
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <AdminHeader title={`Order #${order.orderNumber}`} />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='flex items-center space-x-4'>
                <Link
                  href={getDashboardUrl()}
                  className='text-blue-600 hover:text-blue-700 flex items-center'
                >
                  <svg
                    className='w-5 h-5 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                  Back to Dashboard
                </Link>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Order #{order.orderNumber}
                </h1>
              </div>
              <div className='mt-2 text-gray-600'>
                Customer: {order.customer.firstName} {order.customer.lastName} |{' '}
                {order.customer.email}
              </div>
              <div className='text-sm text-gray-500'>
                Created: {formatUTCForDisplay(order.createdAt)}
              </div>
            </div>
            <div className='text-right'>
              <span
                className={`px-3 py-1 text-sm rounded-full ${getStatusColor(order.status)}`}
              >
                {getStatusDisplayName(order.status)}
              </span>
              {order.invoiceTotal && (
                <p className='text-2xl font-bold text-gray-900 mt-2'>
                  {order.invoiceTotal.toFixed(3)} BD
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 text-center'>
            <div>
              <div className='text-sm text-gray-600'>Order Status</div>
              <div className='font-semibold text-gray-900'>
                {getStatusDisplayName(order.status)}
              </div>
            </div>
            <div>
              <div className='text-sm text-gray-600'>Total Amount</div>
              <div className='font-bold text-lg text-blue-600'>
                {total.toFixed(3)} BD
              </div>
            </div>
            <div>
              <div className='text-sm text-gray-600'>Services</div>
              <div className='font-semibold text-gray-900'>
                {order.orderServiceMappings?.length || 0}
              </div>
            </div>
            <div>
              <div className='text-sm text-gray-600'>Items</div>
              <div className='font-semibold text-gray-900'>
                {order.orderServiceMappings?.reduce(
                  (total, mapping) => total + (mapping.orderItems?.length || 0),
                  0
                ) || 0}
              </div>
            </div>
          </div>
          {/* Time Information */}
          <div className='mt-4 pt-4 border-t border-blue-200'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-center'>
              <div>
                <div className='text-sm text-gray-600'>Pickup Date & Time</div>
                <div className='font-semibold text-gray-900'>
                  {formatUTCForDisplay(order.pickupTime)}
                </div>
                {order.orderServiceMappings?.some(
                  mapping => mapping.service.name === 'express-service'
                ) ? (
                  <div className='text-sm text-orange-600 font-semibold'>
                    Express Service
                  </div>
                ) : order.pickupTimeSlot ? (
                  <div className='text-sm text-blue-600'>
                    Slot: {order.pickupTimeSlot}
                  </div>
                ) : null}
              </div>
              <div>
                <div className='text-sm text-gray-600'>
                  Delivery Date & Time
                </div>
                <div className='font-semibold text-gray-900'>
                  {formatUTCForDisplay(order.deliveryTime)}
                </div>
                {order.orderServiceMappings?.some(
                  mapping => mapping.service.name === 'express-service'
                ) ? (
                  <div className='text-sm text-orange-600 font-semibold'>
                    Express Service
                  </div>
                ) : order.deliveryTimeSlot ? (
                  <div className='text-sm text-blue-600'>
                    Slot: {order.deliveryTimeSlot}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='bg-white rounded-lg shadow mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='flex space-x-8 px-6'>
              <TabButton
                isActive={activeTab === 'overview'}
                onClick={() => handleTabClick('overview')}
              >
                Overview
              </TabButton>
              <TabButton
                isActive={activeTab === 'edit'}
                onClick={() => handleTabClick('edit')}
              >
                Edit Order
              </TabButton>
              <TabButton
                isActive={activeTab === 'assignments'}
                onClick={() => handleTabClick('assignments')}
                count={order.driverAssignments?.length || 0}
              >
                Driver Assignments
              </TabButton>
              <TabButton
                isActive={activeTab === 'services'}
                onClick={() => handleTabClick('services')}
                count={order.orderServiceMappings?.length || 0}
              >
                Services Requested
              </TabButton>
              <TabButton
                isActive={activeTab === 'order-items'}
                onClick={() => handleTabClick('order-items')}
                count={
                  order.orderServiceMappings?.reduce(
                    (total, mapping) =>
                      total + (mapping.orderItems?.length || 0),
                    0
                  ) || 0
                }
              >
                Order Items
              </TabButton>
              <TabButton
                isActive={activeTab === 'invoice'}
                onClick={() => handleTabClick('invoice')}
              >
                Invoice
              </TabButton>
              <TabButton
                isActive={activeTab === 'history'}
                onClick={() => handleTabClick('history')}
              >
                Order History
              </TabButton>
              {session?.role === 'SUPER_ADMIN' && (
                <TabButton
                  isActive={activeTab === 'payment'}
                  onClick={() => handleTabClick('payment')}
                  count={(order.paymentRecords || []).length}
                >
                  Payment Management
                </TabButton>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className='p-6'>
            {activeTab === 'overview' && (
              <OrderOverviewTab order={order as any} onRefresh={fetchOrder} />
            )}
            {activeTab === 'edit' && (
              <OrderEditTab order={order as any} onUpdate={fetchOrder} />
            )}
            {activeTab === 'assignments' && (
              <DriverAssignmentsTab
                order={order as any}
                onRefresh={fetchOrder}
              />
            )}
            {activeTab === 'services' && (
              <ServicesTab order={order as any} onRefresh={fetchOrder} />
            )}
            {activeTab === 'order-items' && (
              <OrderItemsTab 
                order={order as any} 
                onRefresh={fetchOrder} 
                onDeleteOrderItem={handleDeleteOrderItem}
              />
            )}
            {activeTab === 'invoice' && (
              <InvoiceTab order={order as any} onRefresh={fetchOrder} />
            )}
            {activeTab === 'history' && (
              <OrderHistoryTab order={order as any} onRefresh={fetchOrder} />
            )}
            {activeTab === 'payment' && (
              <PaymentTab order={order as any} onRefresh={fetchOrder} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderEditPage() {
  return (
    <ToastProvider>
      <OrderEditPageContent />
    </ToastProvider>
  );
}
