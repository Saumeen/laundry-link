import { 
  OrderStatus, 
  PaymentStatus, 
  DriverAssignmentStatus, 
  ProcessingStatus, 
  ItemStatus, 
  IssueStatus
} from "@prisma/client";

// Re-export all enums for easy importing
export {
  OrderStatus,
  PaymentStatus,
  DriverAssignmentStatus,
  ProcessingStatus,
  ItemStatus,
  IssueStatus
};

// Type definitions for API requests/responses
export interface OrderUpdateRequest {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  processingStatus?: ProcessingStatus;
  driverStatus?: DriverAssignmentStatus;
  itemStatus?: ItemStatus;
  issueStatus?: IssueStatus;
  notes?: string;
}

export interface ProcessingUpdateRequest {
  processingStatus?: ProcessingStatus;
  totalPieces?: number;
  totalWeight?: number;
  processingNotes?: string;
  qualityScore?: number;
}

export interface DriverAssignmentRequest {
  status?: DriverAssignmentStatus;
  estimatedTime?: Date;
  actualTime?: Date;
  notes?: string;
}

export interface ItemProcessingRequest {
  itemStatus?: ItemStatus;
  notes?: string;
}

export interface IssueReportRequest {
  issueStatus?: IssueStatus;
  description?: string;
  resolution?: string;
}

// Status mapping utilities
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
<<<<<<< Updated upstream
  ORDER_PLACED: "Order Placed",
  CONFIRMED: "Confirmed",
  PICKUP_ASSIGNED: "Pickup Assigned",
  PICKUP_IN_PROGRESS: "Pickup In Progress",
  PICKUP_COMPLETED: "Pickup Completed",
  PICKUP_FAILED: "Pickup Failed",
  RECEIVED_AT_FACILITY: "Received at Facility",
  PROCESSING_STARTED: "Processing Started",
  PROCESSING_COMPLETED: "Processing Completed",
  QUALITY_CHECK: "Quality Check",
  READY_FOR_DELIVERY: "Ready for Delivery",
  DELIVERY_ASSIGNED: "Delivery Assigned",
  DELIVERY_IN_PROGRESS: "Delivery In Progress",
  DELIVERED: "Delivered",
  DELIVERY_FAILED: "Delivery Failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded"
=======
  ORDER_PLACED: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PICKUP_ASSIGNED: 'Pickup Assigned',
  PICKUP_IN_PROGRESS: 'Pickup In Progress',
  PICKUP_COMPLETED: 'Pickup Completed',
  PICKUP_FAILED: 'Pickup Failed',
  DROPPED_OFF: 'Dropped Off At Facility',
  RECEIVED_AT_FACILITY: 'Received at Facility',
  PROCESSING_STARTED: 'Processing Started',
  PROCESSING_COMPLETED: 'Processing Completed',
  QUALITY_CHECK: 'Quality Check',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  DELIVERY_ASSIGNED: 'Delivery Assigned',
  DELIVERY_IN_PROGRESS: 'Delivery In Progress',
  DELIVERED: 'Delivered',
  DELIVERY_FAILED: 'Delivery Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
>>>>>>> Stashed changes
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  PARTIAL_REFUND: "Partial Refund"
};

export const PROCESSING_STATUS_LABELS: Record<ProcessingStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  QUALITY_CHECK: "Quality Check",
  READY_FOR_DELIVERY: "Ready for Delivery",
  ISSUE_REPORTED: "Issue Reported"
};

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ISSUE_REPORTED: "Issue Reported"
};

export const DRIVER_STATUS_LABELS: Record<DriverAssignmentStatus, string> = {
<<<<<<< Updated upstream
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  RESCHEDULED: "Rescheduled",
  FAILED: "Failed"
=======
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DROPPED_OFF: 'Dropped Off At Facility',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
  FAILED: 'Failed',
>>>>>>> Stashed changes
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  REPORTED: "Reported",
  INVESTIGATING: "Investigating",
  RESOLVED: "Resolved",
  ESCALATED: "Escalated"
};

// Status color utilities
export const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.DELIVERED:
      return 'bg-green-100 text-green-800';
    case OrderStatus.PROCESSING_STARTED:
    case OrderStatus.PROCESSING_COMPLETED:
      return 'bg-blue-100 text-blue-800';
    case OrderStatus.PICKUP_IN_PROGRESS:
    case OrderStatus.DELIVERY_IN_PROGRESS:
      return 'bg-yellow-100 text-yellow-800';
    case OrderStatus.CANCELLED:
    case OrderStatus.DELIVERY_FAILED:
    case OrderStatus.PICKUP_FAILED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'bg-green-100 text-green-800';
    case PaymentStatus.FAILED:
      return 'bg-red-100 text-red-800';
    case PaymentStatus.REFUNDED:
    case PaymentStatus.PARTIAL_REFUND:
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
}; 