import type { OrderStatus, PaymentStatus, Order } from '@/shared/types';

export const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'ORDER_PLACED':
    case 'PENDING':
      return 'bg-blue-100 text-blue-800';
    case 'CONFIRMED':
      return 'bg-purple-100 text-purple-800';
    case 'PICKUP_ASSIGNED':
      return 'bg-indigo-100 text-indigo-800';
    case 'PICKUP_IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800';
    case 'PICKUP_COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'PICKUP_FAILED':
      return 'bg-red-100 text-red-800';
    case 'RECEIVED_AT_FACILITY':
      return 'bg-cyan-100 text-cyan-800';
    case 'PROCESSING_STARTED':
    case 'PROCESSING':
      return 'bg-orange-100 text-orange-800';
    case 'PROCESSING_COMPLETED':
      return 'bg-lime-100 text-lime-800';
    case 'QUALITY_CHECK':
      return 'bg-pink-100 text-pink-800';
    case 'READY_FOR_DELIVERY':
      return 'bg-emerald-100 text-emerald-800';
    case 'DELIVERY_ASSIGNED':
      return 'bg-teal-100 text-teal-800';
    case 'DELIVERY_IN_PROGRESS':
      return 'bg-blue-100 text-blue-800';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'DELIVERY_FAILED':
      return 'bg-red-100 text-red-800';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800';
    case 'REFUNDED':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusDisplayName = (status: string): string => {
  switch (status) {
    case 'ORDER_PLACED':
      return 'Order Placed';
    case 'PENDING':
      return 'Pending';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'PICKUP_ASSIGNED':
      return 'Pickup Assigned';
    case 'PICKUP_IN_PROGRESS':
      return 'Pickup In Progress';
    case 'PICKUP_COMPLETED':
      return 'Pickup Completed';
    case 'PICKUP_FAILED':
      return 'Pickup Failed';
    case 'RECEIVED_AT_FACILITY':
      return 'Received at Facility';
    case 'PROCESSING_STARTED':
    case 'PROCESSING':
      return 'Processing';
    case 'PROCESSING_COMPLETED':
      return 'Processing Completed';
    case 'QUALITY_CHECK':
      return 'Quality Check';
    case 'READY_FOR_DELIVERY':
      return 'Ready for Delivery';
    case 'DELIVERY_ASSIGNED':
      return 'Delivery Assigned';
    case 'DELIVERY_IN_PROGRESS':
      return 'Delivery In Progress';
    case 'DELIVERED':
      return 'Delivered';
    case 'DELIVERY_FAILED':
      return 'Delivery Failed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'REFUNDED':
      return 'Refunded';
    default:
      return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
  }
};

export const getPaymentStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'REFUNDED':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPaymentStatusDisplayName = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'PAID':
      return 'Paid';
    case 'FAILED':
      return 'Failed';
    case 'REFUNDED':
      return 'Refunded';
    default:
      return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
  }
};

export const filterOrdersByStatus = (
  orders: Order[],
  status: OrderStatus | 'ALL'
) => {
  if (status === 'ALL') return orders;
  return orders.filter(order => order.status === status);
};

export const filterOrdersByPaymentStatus = (
  orders: Order[],
  paymentStatus: PaymentStatus | 'ALL'
) => {
  if (paymentStatus === 'ALL') return orders;
  return orders.filter(order => order.paymentStatus === paymentStatus);
};

export const searchOrders = (orders: Order[], searchTerm: string) => {
  if (!searchTerm.trim()) return orders;

  const term = searchTerm.toLowerCase();
  return orders.filter(
    order =>
      order.orderNumber.toLowerCase().includes(term) ||
      order.customer?.firstName.toLowerCase().includes(term) ||
      order.customer?.lastName.toLowerCase().includes(term) ||
      order.customer?.email.toLowerCase().includes(term) ||
      order.customer?.phone.includes(term)
  );
};

export const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateOnly = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const calculateOrderTotal = (order: Order): number => {
  // Calculate total from order items or service mappings
  let total = 0;

  if (order.orderServiceMappings) {
    total = order.orderServiceMappings.reduce(
      (sum, mapping) => sum + mapping.price,
      0
    );
  }

  return total;
};

export const calculateInvoiceTotal = (order: Order): number => {
  // Calculate total from invoice items
  let total = 0;

  if (order.orderItems) {
    total = order.orderItems.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  return total;
};

export const validateOrderData = (
  data: Partial<Order>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.orderNumber) {
    errors.push('Order number is required');
  }

  if (!data.customerId) {
    errors.push('Customer ID is required');
  }

  if (!data.status) {
    errors.push('Status is required');
  }

  if (!data.paymentStatus) {
    errors.push('Payment status is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
