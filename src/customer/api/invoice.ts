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
        throw new Error('Failed to download invoice');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading invoice:', error);
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
      console.error('Error generating invoice:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }
}

export { InvoiceApi };
