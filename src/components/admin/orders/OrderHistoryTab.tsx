'use client';

import React, { useState, useEffect } from 'react';
import { formatUTCForDisplay } from '@/lib/utils/timezone';

interface OrderHistoryEntry {
  id: number;
  orderId: number;
  status: string;
  previousStatus?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface DriverAssignment {
  id: number;
  driverId: number;
  orderId: number;
  status: string;
  assignedAt: string;
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  orderHistory?: OrderHistoryEntry[];
  driverAssignments?: DriverAssignment[];
  specialInstructions?: string;
}

interface TimelineEvent {
  id: string | number;
  type: string;
  status: string;
  timestamp: string;
  description: string;
  icon: React.ReactElement;
  previousStatus?: string;
  createdBy?: string;
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface OrderHistoryTabProps {
  order: Order;
  onRefresh: () => void;
}

export default function OrderHistoryTab({ order }: OrderHistoryTabProps) {
  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderHistory();
  }, [order.id]);

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/order-history/${order.id}`);
      if (response.ok) {
        const data = await response.json() as { history: OrderHistoryEntry[] };
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'ready_for_pickup':
        return 'bg-orange-100 text-orange-800';
      case 'picked_up':
        return 'bg-indigo-100 text-indigo-800';
      case 'in_transit':
        return 'bg-cyan-100 text-cyan-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'ready_for_pickup': 'Ready for Pickup',
      'picked_up': 'Picked Up',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return statusMap[status] || status;
  };

  const getTimelineIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
            <svg className='w-4 h-4 text-yellow-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
        );
      case 'confirmed':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
            <svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
        );
      case 'processing':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
            <svg className='w-4 h-4 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
            </svg>
          </div>
        );
      case 'ready_for_pickup':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center'>
            <svg className='w-4 h-4 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
            </svg>
          </div>
        );
      case 'picked_up':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center'>
            <svg className='w-4 h-4 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16l-4-4m0 0l4-4m-4 4h18' />
            </svg>
          </div>
        );
      case 'in_transit':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center'>
            <svg className='w-4 h-4 text-cyan-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
            </svg>
          </div>
        );
      case 'delivered':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
            <svg className='w-4 h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
            </svg>
          </div>
        );
      case 'cancelled':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
            <svg className='w-4 h-4 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </div>
        );
      default:
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center'>
            <svg className='w-4 h-4 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
        );
    }
  };

  // Create a combined timeline with order history and driver assignments
  const createTimeline = (): TimelineEvent[] => {
    const timeline: TimelineEvent[] = [];

    // Add order creation
    timeline.push({
      id: 'creation',
      type: 'order_created',
      status: 'Order Created',
      timestamp: order.createdAt,
      description: 'Order was created by customer',
      icon: (
        <div className='flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
          <svg className='w-4 h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
          </svg>
        </div>
      ),
    });

    // Add order history entries
    if (history.length > 0) {
      history.forEach((entry) => {
        timeline.push({
          id: entry.id,
          type: 'status_change',
          status: getStatusDisplayName(entry.status),
          previousStatus: entry.previousStatus ? getStatusDisplayName(entry.previousStatus) : undefined,
          timestamp: entry.createdAt,
          description: entry.notes || `Status changed to ${getStatusDisplayName(entry.status)}`,
          createdBy: entry.createdBy,
          icon: getTimelineIcon(entry.status),
        });
      });
    }

    // Add driver assignments
    if (order.driverAssignments && order.driverAssignments.length > 0) {
      order.driverAssignments.forEach((assignment) => {
        timeline.push({
          id: `driver-${assignment.id}`,
          type: 'driver_assignment',
          status: `Driver ${assignment.status}`,
          timestamp: assignment.assignedAt,
          description: assignment.driver 
            ? `Driver ${assignment.driver.firstName} ${assignment.driver.lastName} assigned`
            : 'Driver assigned',
          driver: assignment.driver,
          icon: (
            <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
              <svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
              </svg>
            </div>
          ),
        });
      });
    }

    // Sort by timestamp
    return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const timeline = createTimeline();

  if (loading) {
    return (
      <div className='space-y-6'>
        <h3 className='text-lg font-semibold text-gray-900'>Order History</h3>
        <div className='flex items-center justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Order History & Timeline
        </h3>
        <span className='text-sm text-gray-500'>
          {timeline.length} events
        </span>
      </div>

      {/* Current Status */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h4 className='text-lg font-semibold text-gray-900 mb-2'>Current Status</h4>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
              {getStatusDisplayName(order.status)}
            </span>
          </div>
          <div className='text-right'>
            <div className='text-sm text-gray-600'>Last Updated</div>
            <div className='text-sm font-medium'>{formatUTCForDisplay(order.updatedAt)}</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h4 className='text-lg font-semibold text-gray-900 mb-6'>Order Timeline</h4>
        
        {timeline.length === 0 ? (
          <div className='text-center py-8'>
            <div className='text-gray-400 mb-2'>
              <svg className='mx-auto h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <p className='text-gray-500'>No history available for this order</p>
          </div>
        ) : (
          <div className='flow-root'>
            <ul className='-mb-8'>
              {timeline.map((event, eventIdx) => (
                <li key={event.id}>
                  <div className='relative pb-8'>
                    {eventIdx !== timeline.length - 1 ? (
                      <span
                        className='absolute top-8 left-4 -ml-px h-full w-0.5 bg-gray-200'
                        aria-hidden='true'
                      />
                    ) : null}
                    <div className='relative flex space-x-3'>
                      {event.icon}
                      <div className='min-w-0 flex-1 pt-1.5 flex justify-between space-x-4'>
                        <div>
                          <p className='text-sm text-gray-900 font-medium'>
                            {event.status}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {event.description}
                          </p>
                          {event.previousStatus && (
                            <p className='text-xs text-gray-400 mt-1'>
                              Changed from: {event.previousStatus}
                            </p>
                          )}
                          {event.createdBy && (
                            <p className='text-xs text-gray-400 mt-1'>
                              Updated by: {event.createdBy}
                            </p>
                          )}
                          {event.driver && (
                            <p className='text-xs text-gray-400 mt-1'>
                              Driver: {event.driver.firstName} {event.driver.lastName} ({event.driver.phone})
                            </p>
                          )}
                        </div>
                        <div className='text-right text-sm whitespace-nowrap text-gray-500'>
                          <time dateTime={event.timestamp}>
                            {formatUTCForDisplay(event.timestamp)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <h4 className='font-semibold text-yellow-900 mb-2'>Special Instructions</h4>
          <p className='text-yellow-800'>{order.specialInstructions}</p>
        </div>
      )}

      {/* Driver Assignments Summary */}
      {order.driverAssignments && order.driverAssignments.length > 0 && (
        <div className='bg-white border border-gray-200 rounded-lg p-6'>
          <h4 className='text-lg font-semibold text-gray-900 mb-4'>Driver Assignments</h4>
          <div className='space-y-3'>
            {order.driverAssignments.map((assignment) => (
              <div key={assignment.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                <div>
                  <div className='font-medium text-gray-900'>
                    {assignment.driver 
                      ? `${assignment.driver.firstName} ${assignment.driver.lastName}`
                      : 'Driver Assigned'
                    }
                  </div>
                  <div className='text-sm text-gray-500'>
                    Status: {assignment.status}
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-sm text-gray-500'>
                    {formatUTCForDisplay(assignment.assignedAt)}
                  </div>
                  {assignment.driver && (
                    <div className='text-sm text-gray-500'>
                      {assignment.driver.phone}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 