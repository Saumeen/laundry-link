'use client';

import React from 'react';
import { 
  OrderStatus, 
  PaymentStatus, 
  ProcessingStatus,
  DriverAssignmentStatus,
  ItemStatus,
  IssueStatus
} from '@prisma/client';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PROCESSING_STATUS_LABELS,
  DRIVER_STATUS_LABELS,
  ITEM_STATUS_LABELS,
  ISSUE_STATUS_LABELS,
  getOrderStatusColor,
  getPaymentStatusColor
} from '@/types/enums';

interface OrderStatusDisplayProps {
  status: OrderStatus;
  type?: 'order' | 'payment' | 'processing' | 'driver' | 'item' | 'issue';
  className?: string;
  showLabel?: boolean;
}

const OrderStatusDisplay: React.FC<OrderStatusDisplayProps> = ({
  status,
  type = 'order',
  className = '',
  showLabel = true
}) => {
  const getStatusInfo = () => {
    switch (type) {
      case 'payment':
        return {
          label: PAYMENT_STATUS_LABELS[status as PaymentStatus],
          color: getPaymentStatusColor(status as PaymentStatus)
        };
      case 'processing':
        return {
          label: PROCESSING_STATUS_LABELS[status as ProcessingStatus],
          color: 'bg-blue-100 text-blue-800'
        };
      case 'driver':
        return {
          label: DRIVER_STATUS_LABELS[status as DriverAssignmentStatus],
          color: 'bg-purple-100 text-purple-800'
        };
      case 'item':
        return {
          label: ITEM_STATUS_LABELS[status as ItemStatus],
          color: 'bg-orange-100 text-orange-800'
        };
      case 'issue':
        return {
          label: ISSUE_STATUS_LABELS[status as IssueStatus],
          color: 'bg-red-100 text-red-800'
        };
      default:
        return {
          label: ORDER_STATUS_LABELS[status],
          color: getOrderStatusColor(status)
        };
    }
  };

  const { label, color } = getStatusInfo();

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
        {showLabel ? label : status}
      </span>
    </div>
  );
};

export default OrderStatusDisplay; 