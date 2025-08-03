import logger from '@/lib/logger';
import type { ApiResponse } from '@/shared/types/customer';

class InvoiceApi {
  private static baseUrl = '/api/customer/invoice';

  static async downloadInvoice(orderId: number): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to download invoice';
        try {
          const errorData = await response.json();
          errorMessage = (errorData as { error: string }).error || errorMessage;
        } catch {
          // If we can't parse the error response, use default message
        }
        throw new Error(errorMessage);
      }

      return await response.blob();
    } catch (error) {
      logger.error('Error downloading invoice:', error);
      throw error;
    }
  }

  static async generateInvoice(
    orderId: number
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${orderId}/generate`, {
        method: 'POST',
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
          error:
            (data as { error: string }).error || 'Failed to generate invoice',
        };
      }

      return {
        success: true,
        data: data as { message: string },
      };
    } catch (error) {
      logger.error('Error generating invoice:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }
}

export { InvoiceApi };
