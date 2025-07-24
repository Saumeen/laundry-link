import { apiClient } from '@/shared/api/client';
import type {
  Order,
  OrderFilters,
  PaginatedResponse,
  ApiResponse,
} from '@/shared/types';
import type { OrderStatus, PaymentStatus } from '@prisma/client';

// Include related data in Order type
export interface OrderWithDetails extends Order {
  customer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  addresses?: Array<{
    id: number;
    label: string;
    addressLine1: string;
    city: string;
    isDefault: boolean;
  }>;
  orderServiceMappings?: Array<{
    id: number;
    serviceId: number;
    quantity: number;
    price: number;
    service: {
      id: number;
      name: string;
      description?: string;
    };
  }>;
  orderItems?: Array<{
    id: number;
    orderServiceMappingId: number;
    quantity: number;
    pricePerItem: number;
    total?: number;
    service?: {
      id: number;
      name: string;
    };
    notes?: string;
  }>;
}

export interface ProcessingData {
  totalPieces: string;
  totalWeight: string;
  processingNotes: string;
}

export interface InvoiceItemData {
  orderServiceMappingId: number;
  quantity: number;
  unitPrice: number;
  notes: string;
}

export class OrdersApi {
  // Get all orders with pagination and filters
  static async getOrders(
    filters?: OrderFilters
  ): Promise<ApiResponse<PaginatedResponse<OrderWithDetails>>> {
    const params = filters
      ? Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== undefined)
        )
      : {};

    return apiClient.get<PaginatedResponse<OrderWithDetails>>(
      '/api/admin/orders-detailed',
      params
    );
  }

  // Get single order by ID
  static async getOrder(
    orderId: number
  ): Promise<ApiResponse<OrderWithDetails>> {
    return apiClient.get<OrderWithDetails>(
      `/api/admin/order-details/${orderId}`
    );
  }

  // Update order status
  static async updateOrderStatus(
    orderId: number,
    status: OrderStatus
  ): Promise<ApiResponse<Order>> {
    return apiClient.patch<Order>(`/api/admin/update-order/${orderId}`, {
      status,
    });
  }

  // Update processing data
  static async updateProcessingData(
    orderId: number,
    data: ProcessingData
  ): Promise<ApiResponse<Order>> {
    return apiClient.patch<Order>(`/api/admin/update-processing`, {
      orderId,
      ...data,
    });
  }

  // Add invoice item
  static async addInvoiceItem(
    orderId: number,
    item: InvoiceItemData
  ): Promise<ApiResponse<Order>> {
    return apiClient.post<Order>(`/api/admin/add-order-item`, {
      orderId,
      ...item,
    });
  }

  // Delete invoice item
  static async deleteInvoiceItem(
    itemId: number
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>(
      `/api/admin/delete-order-item`,
      { itemId }
    );
  }

  // Update payment status
  static async updatePaymentStatus(
    orderId: number,
    paymentStatus: PaymentStatus
  ): Promise<ApiResponse<Order>> {
    return apiClient.patch<Order>(`/api/admin/update-payment-status`, {
      orderId,
      paymentStatus,
    });
  }

  // Generate invoice PDF
  static async generateInvoicePdf(
    orderId: number
  ): Promise<ApiResponse<{ pdfUrl: string }>> {
    return apiClient.post<{ pdfUrl: string }>(
      `/api/admin/generate-invoice-pdf`,
      { orderId }
    );
  }
}
