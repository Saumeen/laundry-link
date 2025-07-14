/**
 * Helper functions for calculating totals and prices
 */

export interface InvoiceItem {
  id?: number;
  quantity: number;
  pricePerItem: number;
}

export interface OrderServiceMapping {
  id?: number;
  quantity: number;
  price: number;
}

export interface Order {
  invoiceItems?: InvoiceItem[];
  orderServiceMappings?: OrderServiceMapping[];
}

/**
 * Calculate total price for a single invoice item
 */
export function calculateInvoiceItemTotal(item: InvoiceItem): number {
  return item.quantity * item.pricePerItem;
}

/**
 * Calculate total price for a service mapping
 */
export function calculateServiceMappingTotal(mapping: OrderServiceMapping): number {
  return mapping.quantity * mapping.price;
}

/**
 * Calculate total amount for an order from invoice items
 */
export function calculateOrderTotalFromInvoiceItems(order: Order): number {
  if (!order.invoiceItems || order.invoiceItems.length === 0) {
    return 0;
  }
  
  return order.invoiceItems.reduce((sum, item) => {
    return sum + calculateInvoiceItemTotal(item);
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
 * Calculate total amount for an order (prefers invoice items if available)
 */
export function calculateOrderTotal(order: Order): number {
  // Prefer invoice items if available, otherwise use service mappings
  if (order.invoiceItems && order.invoiceItems.length > 0) {
    return calculateOrderTotalFromInvoiceItems(order);
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