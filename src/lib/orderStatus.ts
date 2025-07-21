import { OrderStatus, PaymentStatus, DriverAssignmentStatus, ProcessingStatus, ItemStatus, IssueStatus } from '@prisma/client';

// ===== ORDER STATUS MAPPINGS =====
export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  description: string;
  color: string;
  icon: string;
  canTransitionTo: OrderStatus[];
}> = {
  [OrderStatus.ORDER_PLACED]: {
    label: 'Order Placed',
    description: 'Order has been placed by customer',
    color: 'bg-blue-100 text-blue-800',
    icon: '📋',
    canTransitionTo: [
      OrderStatus.CONFIRMED,
      OrderStatus.CANCELLED
    ]
  },
  [OrderStatus.CONFIRMED]: {
    label: 'Confirmed',
    description: 'Order has been confirmed by staff',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
    canTransitionTo: [
      OrderStatus.PICKUP_ASSIGNED,
      OrderStatus.CANCELLED
    ]
  },
  [OrderStatus.PICKUP_ASSIGNED]: {
    label: 'Pickup Assigned',
    description: 'Driver assigned for pickup',
    color: 'bg-purple-100 text-purple-800',
    icon: '🚚',
    canTransitionTo: [
      OrderStatus.PICKUP_IN_PROGRESS,
      OrderStatus.PICKUP_FAILED,
      OrderStatus.CANCELLED
    ]
  },
  [OrderStatus.PICKUP_IN_PROGRESS]: {
    label: 'Pickup In Progress',
    description: 'Driver is on the way for pickup',
    color: 'bg-orange-100 text-orange-800',
    icon: '🔄',
    canTransitionTo: [
      OrderStatus.PICKUP_COMPLETED,
      OrderStatus.PICKUP_FAILED
    ]
  },
  [OrderStatus.PICKUP_COMPLETED]: {
    label: 'Pickup Completed',
    description: 'Items have been picked up',
    color: 'bg-teal-100 text-teal-800',
    icon: '📦',
    canTransitionTo: [
      OrderStatus.RECEIVED_AT_FACILITY
    ]
  },
  [OrderStatus.PICKUP_FAILED]: {
    label: 'Pickup Failed',
    description: 'Pickup was unsuccessful',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
    canTransitionTo: [
      OrderStatus.PICKUP_ASSIGNED,
      OrderStatus.CANCELLED
    ]
  },
  [OrderStatus.RECEIVED_AT_FACILITY]: {
    label: 'Received at Facility',
    description: 'Items received at processing facility',
    color: 'bg-indigo-100 text-indigo-800',
    icon: '🏭',
    canTransitionTo: [
      OrderStatus.PROCESSING_STARTED
    ]
  },
  [OrderStatus.PROCESSING_STARTED]: {
    label: 'Processing Started',
    description: 'Items are being processed',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⚙️',
    canTransitionTo: [
      OrderStatus.PROCESSING_COMPLETED,
      OrderStatus.QUALITY_CHECK
    ]
  },
  [OrderStatus.PROCESSING_COMPLETED]: {
    label: 'Processing Completed',
    description: 'All items have been processed',
    color: 'bg-emerald-100 text-emerald-800',
    icon: '✅',
    canTransitionTo: [
      OrderStatus.QUALITY_CHECK,
      OrderStatus.READY_FOR_DELIVERY
    ]
  },
  [OrderStatus.QUALITY_CHECK]: {
    label: 'Quality Check',
    description: 'Items undergoing quality inspection',
    color: 'bg-cyan-100 text-cyan-800',
    icon: '🔍',
    canTransitionTo: [
      OrderStatus.READY_FOR_DELIVERY,
      OrderStatus.PROCESSING_STARTED
    ]
  },
  [OrderStatus.READY_FOR_DELIVERY]: {
    label: 'Ready for Delivery',
    description: 'Items ready for delivery',
    color: 'bg-lime-100 text-lime-800',
    icon: '📦',
    canTransitionTo: [
      OrderStatus.DELIVERY_ASSIGNED
    ]
  },
  [OrderStatus.DELIVERY_ASSIGNED]: {
    label: 'Delivery Assigned',
    description: 'Driver assigned for delivery',
    color: 'bg-purple-100 text-purple-800',
    icon: '🚚',
    canTransitionTo: [
      OrderStatus.DELIVERY_IN_PROGRESS,
      OrderStatus.DELIVERY_FAILED
    ]
  },
  [OrderStatus.DELIVERY_IN_PROGRESS]: {
    label: 'Delivery In Progress',
    description: 'Driver is on the way for delivery',
    color: 'bg-orange-100 text-orange-800',
    icon: '🔄',
    canTransitionTo: [
      OrderStatus.DELIVERED,
      OrderStatus.DELIVERY_FAILED
    ]
  },
  [OrderStatus.DELIVERED]: {
    label: 'Delivered',
    description: 'Order has been delivered successfully',
    color: 'bg-green-100 text-green-800',
    icon: '🎉',
    canTransitionTo: [
      OrderStatus.REFUNDED
    ]
  },
  [OrderStatus.DELIVERY_FAILED]: {
    label: 'Delivery Failed',
    description: 'Delivery was unsuccessful',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
    canTransitionTo: [
      OrderStatus.DELIVERY_ASSIGNED,
      OrderStatus.CANCELLED
    ]
  },
  [OrderStatus.CANCELLED]: {
    label: 'Cancelled',
    description: 'Order has been cancelled',
    color: 'bg-gray-100 text-gray-800',
    icon: '🚫',
    canTransitionTo: [
      OrderStatus.REFUNDED
    ]
  },
  [OrderStatus.REFUNDED]: {
    label: 'Refunded',
    description: 'Payment has been refunded',
    color: 'bg-pink-100 text-pink-800',
    icon: '💰',
    canTransitionTo: []
  }
};

// ===== PAYMENT STATUS MAPPINGS =====
export const PAYMENT_STATUS_CONFIG = {
  [PaymentStatus.PENDING]: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳'
  },
  [PaymentStatus.PAID]: {
    label: 'Paid',
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  [PaymentStatus.FAILED]: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800',
    icon: '❌'
  },
  [PaymentStatus.REFUNDED]: {
    label: 'Refunded',
    color: 'bg-pink-100 text-pink-800',
    icon: '💰'
  },
  [PaymentStatus.PARTIAL_REFUND]: {
    label: 'Partial Refund',
    color: 'bg-orange-100 text-orange-800',
    icon: '💸'
  }
};

// ===== DRIVER ASSIGNMENT STATUS MAPPINGS =====
export const DRIVER_ASSIGNMENT_STATUS_CONFIG = {
  [DriverAssignmentStatus.ASSIGNED]: {
    label: 'Assigned',
    description: 'Driver assignment has been created',
    color: 'bg-blue-100 text-blue-800',
    icon: '📋'
  },
  [DriverAssignmentStatus.IN_PROGRESS]: {
    label: 'In Progress',
    description: 'Driver is currently working on this assignment',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '🔄'
  },
  [DriverAssignmentStatus.COMPLETED]: {
    label: 'Completed',
    description: 'Assignment has been completed successfully',
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  [DriverAssignmentStatus.CANCELLED]: {
    label: 'Cancelled',
    description: 'Assignment has been cancelled',
    color: 'bg-red-100 text-red-800',
    icon: '❌'
  },
  [DriverAssignmentStatus.RESCHEDULED]: {
    label: 'Rescheduled',
    description: 'Assignment has been rescheduled',
    color: 'bg-purple-100 text-purple-800',
    icon: '📅'
  },
  [DriverAssignmentStatus.FAILED]: {
    label: 'Failed',
    description: 'Assignment failed to complete',
    color: 'bg-red-100 text-red-800',
    icon: '💥'
  }
};

// ===== PROCESSING STATUS MAPPINGS =====
export const PROCESSING_STATUS_CONFIG = {
  [ProcessingStatus.PENDING]: {
    label: 'Pending',
    description: 'Processing is pending',
    color: 'bg-gray-100 text-gray-800',
    icon: '⏳'
  },
  [ProcessingStatus.IN_PROGRESS]: {
    label: 'In Progress',
    description: 'Items are being processed',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⚙️'
  },
  [ProcessingStatus.COMPLETED]: {
    label: 'Completed',
    description: 'Processing has been completed',
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  [ProcessingStatus.QUALITY_CHECK]: {
    label: 'Quality Check',
    description: 'Items undergoing quality inspection',
    color: 'bg-cyan-100 text-cyan-800',
    icon: '🔍'
  },
  [ProcessingStatus.READY_FOR_DELIVERY]: {
    label: 'Ready for Delivery',
    description: 'Items ready for delivery',
    color: 'bg-lime-100 text-lime-800',
    icon: '📦'
  },
  [ProcessingStatus.ISSUE_REPORTED]: {
    label: 'Issue Reported',
    description: 'An issue has been reported during processing',
    color: 'bg-red-100 text-red-800',
    icon: '⚠️'
  }
};

// ===== ITEM STATUS MAPPINGS =====
export const ITEM_STATUS_CONFIG = {
  [ItemStatus.PENDING]: {
    label: 'Pending',
    description: 'Item processing is pending',
    color: 'bg-gray-100 text-gray-800',
    icon: '⏳'
  },
  [ItemStatus.IN_PROGRESS]: {
    label: 'In Progress',
    description: 'Item is being processed',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⚙️'
  },
  [ItemStatus.COMPLETED]: {
    label: 'Completed',
    description: 'Item processing completed',
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  [ItemStatus.ISSUE_REPORTED]: {
    label: 'Issue Reported',
    description: 'An issue has been reported with this item',
    color: 'bg-red-100 text-red-800',
    icon: '⚠️'
  }
};

// ===== ISSUE STATUS MAPPINGS =====
export const ISSUE_STATUS_CONFIG = {
  [IssueStatus.REPORTED]: {
    label: 'Reported',
    description: 'Issue has been reported',
    color: 'bg-red-100 text-red-800',
    icon: '🚨'
  },
  [IssueStatus.INVESTIGATING]: {
    label: 'Investigating',
    description: 'Issue is being investigated',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '🔍'
  },
  [IssueStatus.RESOLVED]: {
    label: 'Resolved',
    description: 'Issue has been resolved',
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  [IssueStatus.ESCALATED]: {
    label: 'Escalated',
    description: 'Issue has been escalated',
    color: 'bg-orange-100 text-orange-800',
    icon: '📈'
  }
};

// ===== HELPER FUNCTIONS =====
export function getOrderStatusConfig(status: OrderStatus) {
  return ORDER_STATUS_CONFIG[status];
}

export function getPaymentStatusConfig(status: PaymentStatus) {
  return PAYMENT_STATUS_CONFIG[status];
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  const config = ORDER_STATUS_CONFIG[from];
  return config?.canTransitionTo.includes(to) || false;
}

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.label || status;
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_CONFIG[status]?.label || status;
}

export function getDriverAssignmentStatusConfig(status: DriverAssignmentStatus) {
  return DRIVER_ASSIGNMENT_STATUS_CONFIG[status];
}

export function getProcessingStatusConfig(status: ProcessingStatus) {
  return PROCESSING_STATUS_CONFIG[status];
}

export function getItemStatusConfig(status: ItemStatus) {
  return ITEM_STATUS_CONFIG[status];
}

export function getIssueStatusConfig(status: IssueStatus) {
  return ISSUE_STATUS_CONFIG[status];
}

export function getDriverAssignmentStatusLabel(status: DriverAssignmentStatus): string {
  return DRIVER_ASSIGNMENT_STATUS_CONFIG[status]?.label || status;
}

export function getProcessingStatusLabel(status: ProcessingStatus): string {
  return PROCESSING_STATUS_CONFIG[status]?.label || status;
}

export function getItemStatusLabel(status: ItemStatus): string {
  return ITEM_STATUS_CONFIG[status]?.label || status;
}

export function getIssueStatusLabel(status: IssueStatus): string {
  return ISSUE_STATUS_CONFIG[status]?.label || status;
}

// ===== ORDER STATUS FLOW =====
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.ORDER_PLACED,
  OrderStatus.CONFIRMED,
  OrderStatus.PICKUP_ASSIGNED,
  OrderStatus.PICKUP_IN_PROGRESS,
  OrderStatus.PICKUP_COMPLETED,
  OrderStatus.PICKUP_FAILED,
  OrderStatus.RECEIVED_AT_FACILITY,
  OrderStatus.PROCESSING_STARTED,
  OrderStatus.PROCESSING_COMPLETED,
  OrderStatus.QUALITY_CHECK,
  OrderStatus.READY_FOR_DELIVERY,
  OrderStatus.DELIVERY_ASSIGNED,
  OrderStatus.DELIVERY_IN_PROGRESS,
  OrderStatus.DELIVERY_FAILED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED
];

export function getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === ORDER_STATUS_FLOW.length - 1) {
    return null;
  }
  return ORDER_STATUS_FLOW[currentIndex + 1];
}

export function getPreviousStatus(currentStatus: OrderStatus): OrderStatus | null {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  if (currentIndex <= 0) {
    return null;
  }
  return ORDER_STATUS_FLOW[currentIndex - 1];
}

// ===== STATUS VALIDATION =====
export function isValidOrderStatus(status: string): status is OrderStatus {
  return Object.values(OrderStatus).includes(status as OrderStatus);
}

export function isValidPaymentStatus(status: string): status is PaymentStatus {
  return Object.values(PaymentStatus).includes(status as PaymentStatus);
}

export function isValidDriverAssignmentStatus(status: string): status is DriverAssignmentStatus {
  return Object.values(DriverAssignmentStatus).includes(status as DriverAssignmentStatus);
}

export function isValidProcessingStatus(status: string): status is ProcessingStatus {
  return Object.values(ProcessingStatus).includes(status as ProcessingStatus);
}

export function isValidItemStatus(status: string): status is ItemStatus {
  return Object.values(ItemStatus).includes(status as ItemStatus);
}

export function isValidIssueStatus(status: string): status is IssueStatus {
  return Object.values(IssueStatus).includes(status as IssueStatus);
}

// ===== ORDER HISTORY HELPERS =====
export function createOrderHistoryEntry(
  orderId: number,
  staffId: number | null,
  action: string,
  oldValue: any,
  newValue: any,
  description: string,
  metadata?: any
) {
  return {
    orderId,
    staffId,
    action,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    description,
    metadata: metadata ? JSON.stringify(metadata) : null
  };
}

// ===== STATUS CHANGE VALIDATION =====
export function validateStatusChange(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  userRole?: string
): { isValid: boolean; message?: string } {
  // Check if transition is allowed
  if (!canTransitionOrderStatus(currentStatus, newStatus)) {
    return {
      isValid: false,
      message: `Cannot transition from ${getOrderStatusLabel(currentStatus)} to ${getOrderStatusLabel(newStatus)}`
    };
  }

  // Role-based validation
  if (userRole) {
    const rolePermissions = getRolePermissions(userRole);
    if (!rolePermissions.includes(newStatus)) {
      return {
        isValid: false,
        message: `Your role (${userRole}) does not have permission to set status to ${getOrderStatusLabel(newStatus)}`
      };
    }
  }

  return { isValid: true };
}

// ===== ROLE PERMISSIONS =====
function getRolePermissions(role: string): OrderStatus[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return [
        OrderStatus.ORDER_PLACED,
        OrderStatus.CONFIRMED,
        OrderStatus.PICKUP_ASSIGNED,
        OrderStatus.PICKUP_IN_PROGRESS,
        OrderStatus.PICKUP_COMPLETED,
        OrderStatus.PICKUP_FAILED,
        OrderStatus.RECEIVED_AT_FACILITY,
        OrderStatus.PROCESSING_STARTED,
        OrderStatus.PROCESSING_COMPLETED,
        OrderStatus.QUALITY_CHECK,
        OrderStatus.READY_FOR_DELIVERY,
        OrderStatus.DELIVERY_ASSIGNED,
        OrderStatus.DELIVERY_IN_PROGRESS,
        OrderStatus.DELIVERY_FAILED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED
      ];
    case 'OPERATION_MANAGER':
      return [
        OrderStatus.CONFIRMED,
        OrderStatus.PICKUP_ASSIGNED,
        OrderStatus.PICKUP_IN_PROGRESS,
        OrderStatus.PICKUP_COMPLETED,
        OrderStatus.PICKUP_FAILED,
        OrderStatus.RECEIVED_AT_FACILITY,
        OrderStatus.PROCESSING_STARTED,
        OrderStatus.PROCESSING_COMPLETED,
        OrderStatus.QUALITY_CHECK,
        OrderStatus.READY_FOR_DELIVERY,
        OrderStatus.DELIVERY_ASSIGNED,
        OrderStatus.DELIVERY_IN_PROGRESS,
        OrderStatus.DELIVERY_FAILED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED
      ];
    case 'DRIVER':
      return [
        OrderStatus.PICKUP_IN_PROGRESS,
        OrderStatus.PICKUP_COMPLETED,
        OrderStatus.PICKUP_FAILED,
        OrderStatus.DELIVERY_IN_PROGRESS,
        OrderStatus.DELIVERED,
        OrderStatus.DELIVERY_FAILED
      ];
    case 'FACILITY_TEAM':
      return [
        OrderStatus.PROCESSING_STARTED,
        OrderStatus.PROCESSING_COMPLETED,
        OrderStatus.QUALITY_CHECK,
        OrderStatus.READY_FOR_DELIVERY
      ];
    default:
      return [];
  }
} 