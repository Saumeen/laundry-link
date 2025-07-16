/**
 * Helper functions for calculating totals and prices
 */

export interface OrderItem {
  id?: number;
  quantity: number;
  pricePerItem: number;
  totalPrice?: number;
}

export interface OrderServiceMapping {
  id?: number;
  quantity: number;
  price: number;
}

export interface Order {
  orderItems?: OrderItem[];
  orderServiceMappings?: OrderServiceMapping[];
}

/**
 * Calculate total price for a single order item
 */
export function calculateOrderItemTotal(item: OrderItem): number {
  return item.quantity * item.pricePerItem;
}

/**
 * Calculate total price for a service mapping
 */
export function calculateServiceMappingTotal(mapping: OrderServiceMapping): number {
  return mapping.quantity * mapping.price;
}

/**
 * Calculate total amount for an order from order items
 */
export function calculateOrderTotalFromOrderItems(order: Order): number {
  if (!order.orderItems || order.orderItems.length === 0) {
    return 0;
  }
  
  return order.orderItems.reduce((sum, item) => {
    return sum + calculateOrderItemTotal(item);
  }, 0);
}

/**
 * Calculate total amount for an order from service mappings
 */
export function calculateOrderTotalFromServiceMappings(order: Order): number {
  if (!order.orderServiceMappings || order.orderServiceMappings.length === 0) {
    return 0;
  }
  
  return order.orderServiceMappings.reduce((sum, mapping) => {
    return sum + calculateServiceMappingTotal(mapping);
  }, 0);
}

/**
 * Calculate total amount for an order (prefers order items if available)
 */
export function calculateOrderTotal(order: Order): number {
  // Prefer order items if available, otherwise use service mappings
  if (order.orderItems && order.orderItems.length > 0) {
    return calculateOrderTotalFromOrderItems(order);
  }
  
  if (order.orderServiceMappings && order.orderServiceMappings.length > 0) {
    return calculateOrderTotalFromServiceMappings(order);
  }
  
  return 0;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'BD'): string {
  return `${amount.toFixed(3)} ${currency}`;
} 