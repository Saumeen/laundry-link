import logger from '@/lib/logger';
import type {
  OrderWithDetails,
  OrderFilters,
  CreateOrderData,
  ApiResponse,
  OrdersListResponse,
  OrderResponse,
} from '@/shared/types/customer';

class OrdersApi {
  private static baseUrl = '/api/customer/orders';

  static async getOrders(
    filters?: OrderFilters
  ): Promise<ApiResponse<OrdersListResponse>> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = (await response.json()) as
        | OrdersListResponse
        | { error: string };

      if (!response.ok) {
        return {
          success: false,
          error: (data as { error: string }).error || 'Failed to fetch orders',
        };
      }

      return {
        success: true,
        data: data as OrdersListResponse,
      };
    } catch (error) {
      logger.error('Error fetching orders:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async getOrder(orderId: number): Promise<ApiResponse<OrderResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = (await response.json()) as OrderResponse | { error: string };

      if (!response.ok) {
        return {
          success: false,
          error: (data as { error: string }).error || 'Failed to fetch order',
        };
      }

      return {
        success: true,
        data: data as OrderResponse,
      };
    } catch (error) {
      logger.error('Error fetching order:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async createOrder(
    orderData: CreateOrderData
  ): Promise<ApiResponse<OrderResponse>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      const data = (await response.json()) as OrderResponse | { error: string };

      if (!response.ok) {
        return {
          success: false,
          error: (data as { error: string }).error || 'Failed to create order',
        };
      }

      return {
        success: true,
        data: data as OrderResponse,
      };
    } catch (error) {
      logger.error('Error creating order:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async cancelOrder(
    orderId: number
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = (await response.json()) as
        | { message: string }
        | { error: string };

      if (!response.ok) {
        return {
          success: false,
          error: (data as { error: string }).error || 'Failed to cancel order',
        };
      }

      return {
        success: true,
        data: data as { message: string },
      };
    } catch (error) {
      logger.error('Error canceling order:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }
}

export { OrdersApi };
