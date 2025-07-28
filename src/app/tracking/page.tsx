'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/main-layout';
import Link from 'next/link';

interface OrderItem {
  id: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
  notes?: string;
}

interface OrderServiceMapping {
  id: number;
  service: {
    id: number;
    name: string;
    displayName: string;
    description: string;
    price: number;
  };
  quantity: number;
  price: number;
  orderItems: OrderItem[];
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  invoiceTotal: number;
  pickupStartTime: string;
  pickupEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  pickupTimeSlot?: string;
  deliveryTimeSlot?: string;
  createdAt: string;
  updatedAt: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  specialInstructions?: string;
  paymentStatus: string;
  orderServiceMappings: OrderServiceMapping[];
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
  };
}

interface TimelineEvent {
  status: string;
  time: string;
  completed: boolean;
  icon: string;
  description: string;
}

export default function Tracking() {
  const [trackingId, setTrackingId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (status === 'loading') return;

    if (session?.userType === 'customer') {
      router.push('/customer/dashboard?tab=orders');
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <MainLayout>
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4'></div>
            <p className='text-gray-600 font-medium'>Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Don't render anything if user is logged in (they'll be redirected)
  if (session?.userType === 'customer') {
    return null;
  }

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await fetch(`/api/tracking/${trackingId.trim()}`);

      if (response.ok) {
        const data = (await response.json()) as { order: Order };
        setOrder(data.order);
      } else {
        const errorData = (await response.json()) as { error?: string };
        setError(errorData.error || 'Order not found');
      }
    } catch {
      setError('Failed to fetch order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusPercentage = (order: Order) => {
    const timeline = generateTimeline(order);
    const completedSteps = timeline.filter(step => step.completed).length;
    return (completedSteps / timeline.length) * 100;
  };

  const generateTimeline = (order: Order): TimelineEvent[] => {
    const timeline: TimelineEvent[] = [];
    const createdAt = new Date(order.createdAt);
    const updatedAt = new Date(order.updatedAt);

    // Order Placed
    timeline.push({
      status: 'Order Placed',
      time: createdAt.toLocaleString(),
      completed: true,
      icon: '📋',
      description: 'Your order has been successfully placed',
    });

    // Driver Assigned for Pickup
    if (order.status !== 'ORDER_PLACED') {
      timeline.push({
        status: 'Driver Assigned',
        time: new Date(createdAt.getTime() + 15 * 60000).toLocaleString(),
        completed: true,
        icon: '🚗',
        description: 'A driver has been assigned to pick up your order',
      });
    }

    // Picked Up
    if (
      [
        'PICKUP_COMPLETED',
        'RECEIVED_AT_FACILITY',
        'PROCESSING_STARTED',
        'PROCESSING_COMPLETED',
        'QUALITY_CHECK',
        'READY_FOR_DELIVERY',
        'DELIVERY_ASSIGNED',
        'DELIVERY_IN_PROGRESS',
        'DELIVERED',
      ].includes(order.status)
    ) {
      timeline.push({
        status: 'Picked Up',
        time: new Date(createdAt.getTime() + 90 * 60000).toLocaleString(),
        completed: true,
        icon: '📦',
        description: 'Your items have been collected from your address',
      });
    }

    // Processing
    if (
      [
        'RECEIVED_AT_FACILITY',
        'PROCESSING_STARTED',
        'PROCESSING_COMPLETED',
        'QUALITY_CHECK',
        'READY_FOR_DELIVERY',
        'DELIVERY_ASSIGNED',
        'DELIVERY_IN_PROGRESS',
        'DELIVERED',
      ].includes(order.status)
    ) {
      timeline.push({
        status: 'Processing',
        time: new Date(createdAt.getTime() + 3 * 3600000).toLocaleString(),
        completed: true,
        icon: '🧺',
        description: 'Your items are being cleaned and processed',
      });
    }

    // Quality Check
    if (
      [
        'QUALITY_CHECK',
        'READY_FOR_DELIVERY',
        'DELIVERY_ASSIGNED',
        'DELIVERY_IN_PROGRESS',
        'DELIVERED',
      ].includes(order.status)
    ) {
      timeline.push({
        status: 'Quality Check',
        time: new Date(createdAt.getTime() + 4 * 3600000).toLocaleString(),
        completed: true,
        icon: '✅',
        description: 'Your items have passed quality inspection',
      });
    }

    // Ready for Delivery
    if (
      [
        'READY_FOR_DELIVERY',
        'DELIVERY_ASSIGNED',
        'DELIVERY_IN_PROGRESS',
        'DELIVERED',
      ].includes(order.status)
    ) {
      timeline.push({
        status: 'Ready for Delivery',
        time: new Date(createdAt.getTime() + 5 * 3600000).toLocaleString(),
        completed: true,
        icon: '📦',
        description: 'Your order is ready and waiting for delivery',
      });
    }

    // Driver Assigned for Delivery
    if (
      ['DELIVERY_ASSIGNED', 'DELIVERY_IN_PROGRESS', 'DELIVERED'].includes(
        order.status
      )
    ) {
      timeline.push({
        status: 'Driver Assigned',
        time: new Date(createdAt.getTime() + 6 * 3600000).toLocaleString(),
        completed: true,
        icon: '🚚',
        description: 'A driver has been assigned to deliver your order',
      });
    }

    // Out for Delivery
    if (['DELIVERY_IN_PROGRESS', 'DELIVERED'].includes(order.status)) {
      timeline.push({
        status: 'Out for Delivery',
        time: new Date(createdAt.getTime() + 7 * 3600000).toLocaleString(),
        completed: true,
        icon: '🚚',
        description: 'Your order is on its way to you',
      });
    }

    // Delivered
    if (order.status === 'DELIVERED') {
      timeline.push({
        status: 'Delivered',
        time: new Date(createdAt.getTime() + 8 * 3600000).toLocaleString(),
        completed: true,
        icon: '🎉',
        description: 'Your order has been successfully delivered',
      });
    }

    return timeline;
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      ORDER_PLACED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      PICKUP_ASSIGNED: 'bg-purple-100 text-purple-800',
      PICKUP_IN_PROGRESS: 'bg-orange-100 text-orange-800',
      PICKUP_COMPLETED: 'bg-teal-100 text-teal-800',
      DROPPED_OFF: 'bg-indigo-100 text-indigo-800',
      RECEIVED_AT_FACILITY: 'bg-cyan-100 text-cyan-800',
      PROCESSING_STARTED: 'bg-yellow-100 text-yellow-800',
      PROCESSING_COMPLETED: 'bg-emerald-100 text-emerald-800',
      QUALITY_CHECK: 'bg-violet-100 text-violet-800',
      READY_FOR_DELIVERY: 'bg-green-100 text-green-800',
      DELIVERY_ASSIGNED: 'bg-blue-100 text-blue-800',
      DELIVERY_IN_PROGRESS: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} BD`;
  };

  return (
    <MainLayout>
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
        {/* Header */}
        <div className='bg-white shadow-sm border-b border-gray-200'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='text-center'>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Track Your Order
              </h1>
              <p className='text-gray-600'>
                Enter your order number to track its progress
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Tracking Form */}
          <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8'>
            <form onSubmit={handleTrack} className='max-w-md mx-auto'>
              <div className='mb-6'>
                <label
                  htmlFor='trackingId'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Order Number
                </label>
                <input
                  type='text'
                  id='trackingId'
                  value={trackingId}
                  onChange={e => setTrackingId(e.target.value)}
                  placeholder='Enter your order number (e.g., ORD-123456)'
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
                  required
                />
              </div>
              <button
                type='submit'
                disabled={loading || !trackingId.trim()}
                className='w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? (
                  <span className='flex items-center justify-center'>
                    <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2'></div>
                    Tracking...
                  </span>
                ) : (
                  'Track Order'
                )}
              </button>
            </form>

            {error && (
              <div className='mt-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
                <div className='flex items-center'>
                  <span className='text-red-500 text-xl mr-2'>❌</span>
                  <p className='text-red-700 font-medium'>{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Details */}
          {order && (
            <div className='space-y-8'>
              {/* Order Summary Card */}
              <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center'>
                      <span className='text-white font-bold text-lg'>
                        #{order.orderNumber}
                      </span>
                    </div>
                    <div>
                      <h2 className='text-xl font-bold text-gray-900'>
                        Order #{order.orderNumber}
                      </h2>
                      <p className='text-sm text-gray-600'>
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <p className='text-lg font-bold text-gray-900 mt-1'>
                      {formatCurrency(order.invoiceTotal)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className='mb-6'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700'>
                      Order Progress
                    </span>
                    <span className='text-sm text-gray-500'>
                      {Math.round(getStatusPercentage(order))}%
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full transition-all duration-500'
                      style={{ width: `${getStatusPercentage(order)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Quick Info */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <p className='text-gray-600'>Pickup Time</p>
                    <p className='font-medium'>
                      {order.pickupTimeSlot || 'Not scheduled'}
                    </p>
                  </div>
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <p className='text-gray-600'>Delivery Time</p>
                    <p className='font-medium'>
                      {order.deliveryTimeSlot || 'Not scheduled'}
                    </p>
                  </div>
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <p className='text-gray-600'>Services</p>
                    <p className='font-medium'>
                      {order.orderServiceMappings.length} items
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
                <h3 className='text-lg font-bold text-gray-900 mb-6'>
                  Order Timeline
                </h3>
                <div className='space-y-6'>
                  {generateTimeline(order).map((event, index) => (
                    <div key={index} className='flex items-start space-x-4'>
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          event.completed ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        <span className='text-lg'>{event.icon}</span>
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center space-x-2 mb-1'>
                          <h4
                            className={`font-medium ${
                              event.completed
                                ? 'text-gray-900'
                                : 'text-gray-500'
                            }`}
                          >
                            {event.status}
                          </h4>
                          {event.completed && (
                            <span className='text-green-500 text-sm'>✓</span>
                          )}
                        </div>
                        <p className='text-sm text-gray-600 mb-1'>
                          {event.description}
                        </p>
                        <p className='text-xs text-gray-500'>{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
                <h3 className='text-lg font-bold text-gray-900 mb-6'>
                  Services
                </h3>
                <div className='space-y-4'>
                  {order.orderServiceMappings.map((mapping, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                    >
                      <div>
                        <h4 className='font-medium text-gray-900'>
                          {mapping.service.displayName}
                        </h4>
                        <p className='text-sm text-gray-600'>
                          Quantity: {mapping.quantity}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-medium text-gray-900'>
                          {formatCurrency(mapping.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
                <h3 className='text-lg font-bold text-gray-900 mb-6'>
                  Need Help?
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='text-center p-4 bg-blue-50 rounded-lg'>
                    <span className='text-2xl mb-2 block'>📞</span>
                    <h4 className='font-medium text-gray-900 mb-1'>Call Us</h4>
                    <p className='text-sm text-gray-600'>+973 1234 5678</p>
                  </div>
                  <div className='text-center p-4 bg-green-50 rounded-lg'>
                    <span className='text-2xl mb-2 block'>💬</span>
                    <h4 className='font-medium text-gray-900 mb-1'>
                      Live Chat
                    </h4>
                    <p className='text-sm text-gray-600'>Available 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
