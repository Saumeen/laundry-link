import type {
import logger from '@/lib/logger';
  CustomerAddress,
  PaginatedResponse,
  AddressFilters,
  CreateAddressData,
  UpdateAddressData,
  ApiResponse,
} from '@/shared/types/customer';

class AddressesApi {
  private static baseUrl = '/api/customer/addresses';

  static async getAddresses(
    filters?: AddressFilters
  ): Promise<ApiResponse<PaginatedResponse<CustomerAddress>>> {
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

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to fetch addresses',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error('Error fetching addresses:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async getAddress(
    addressId: number
  ): Promise<ApiResponse<{ address: CustomerAddress }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${addressId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to fetch address',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error('Error fetching address:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async createAddress(
    addressData: CreateAddressData
  ): Promise<ApiResponse<{ address: CustomerAddress }>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(addressData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create address',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error('Error creating address:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async updateAddress(
    addressData: UpdateAddressData
  ): Promise<ApiResponse<{ address: CustomerAddress }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${addressData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(addressData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update address',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error('Error updating address:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async deleteAddress(
    addressId: number
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to delete address',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error('Error deleting address:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async setDefaultAddress(
    addressId: number
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/${addressId}/default`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to set default address',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error('Error setting default address:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }
}

export { AddressesApi };
