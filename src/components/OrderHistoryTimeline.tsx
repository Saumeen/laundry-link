'use client';

import React, { useState, useEffect } from 'react';
import OrderStatusDisplay from './OrderStatusDisplay';
import { OrderStatus } from '@prisma/client';

interface OrderHistoryTimelineProps {
  orderId: number;
  className?: string;
}

interface TimelineEvent {
  id: string;
  type: 'history' | 'update' | 'driver_assignment' | 'processing';
  createdAt: Date;
  description: string;
  staff?: {
    firstName: string;
    lastName: string;
  };
  metadata?: Record<string, unknown>;
}

export const OrderHistoryTimeline: React.FC<OrderHistoryTimelineProps> = ({
  orderId,
  className = '',
}) => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [orderId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/order-history/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order history');
      }
      const data = await response.json();
      setTimeline(data as TimelineEvent[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timeline');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bahrain',
    }).format(new Date(date));
  };

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'history':
        return '📝';
      case 'update':
        return '🔄';
      case 'driver_assignment':
        return '🚚';
      case 'processing':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'history':
        return 'bg-blue-50 border-blue-200';
      case 'update':
        return 'bg-green-50 border-green-200';
      case 'driver_assignment':
        return 'bg-purple-50 border-purple-200';
      case 'processing':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const renderEventContent = (event: TimelineEvent) => {
    if (event.type === 'history') {
      const metadata = event.metadata || {};

      // Handle status changes
      if (metadata.oldValue && metadata.newValue) {
        const oldValue =
          typeof metadata.oldValue === 'string'
            ? JSON.parse(metadata.oldValue)
            : metadata.oldValue;
        const newValue =
          typeof metadata.newValue === 'string'
            ? JSON.parse(metadata.newValue)
            : metadata.newValue;

        if (oldValue.status && newValue.status) {
          return (
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <span className='text-sm text-gray-600'>Status changed:</span>
                <OrderStatusDisplay
                  status={oldValue.status as OrderStatus}
                  type='order'
                />
                <span className='text-gray-400'>→</span>
                <OrderStatusDisplay
                  status={newValue.status as OrderStatus}
                  type='order'
                />
              </div>
              {(() => {
                const notes = (metadata as Record<string, unknown>).notes;
                return notes && typeof notes === 'string' ? (
                  <p className='text-sm text-gray-600 bg-gray-50 p-2 rounded'>
                    Note: {notes}
                  </p>
                ) : null;
              })()}
            </div>
          );
        }

        if (oldValue.paymentStatus && newValue.paymentStatus) {
          return (
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <span className='text-sm text-gray-600'>
                  Payment status changed:
                </span>
                <span className='px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'>
                  {String(oldValue.paymentStatus)}
                </span>
                <span className='text-gray-400'>→</span>
                <span className='px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'>
                  {String(newValue.paymentStatus)}
                </span>
              </div>
              {(() => {
                const notes = (metadata as Record<string, unknown>).notes;
                return notes && typeof notes === 'string' ? (
                  <p className='text-sm text-gray-600 bg-gray-50 p-2 rounded'>
                    Note: {notes}
                  </p>
                ) : null;
              })()}
            </div>
          );
        }
      }

      // Handle notes
      if (event.description && !event.description.includes('changed')) {
        return (
          <div className='space-y-2'>
            <p className='text-sm text-gray-800'>{event.description}</p>
            {metadata && Object.keys(metadata).length > 0 && (
              <div className='text-xs text-gray-500 bg-gray-50 p-2 rounded'>
                <pre className='whitespace-pre-wrap'>
                  {JSON.stringify(metadata as Record<string, unknown>, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      }
    }

    return <p className='text-sm text-gray-800'>{event.description}</p>;
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className='space-y-4'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex space-x-4'>
              <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
              <div className='flex-1 space-y-2'>
                <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                <div className='h-3 bg-gray-200 rounded w-1/2'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className='text-red-600'>Error: {error}</p>
        <button
          onClick={fetchTimeline}
          className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Retry
        </button>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>No history available for this order.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>Order Timeline</h3>
        <button
          onClick={fetchTimeline}
          className='text-sm text-blue-600 hover:text-blue-800'
        >
          Refresh
        </button>
      </div>

      <div className='relative'>
        {/* Timeline line */}
        <div className='absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200'></div>

        {/* Timeline events */}
        <div className='space-y-6'>
          {timeline.map((event, index) => (
            <div
              key={`${event.type}-${index}`}
              className='relative flex space-x-4'
            >
              {/* Event dot */}
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center'>
                  <span className='text-sm'>{getEventIcon(event)}</span>
                </div>
              </div>

              {/* Event content */}
              <div
                className={`flex-1 p-4 rounded-lg border ${getEventColor(event)}`}
              >
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm font-medium text-gray-900'>
                      {event.staff
                        ? `${event.staff.firstName} ${event.staff.lastName}`
                        : 'System'}
                    </span>
                    <span className='text-xs text-gray-500'>
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                  <span className='text-xs text-gray-500 capitalize'>
                    {event.type.replace('_', ' ')}
                  </span>
                </div>

                {renderEventContent(event)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryTimeline;
