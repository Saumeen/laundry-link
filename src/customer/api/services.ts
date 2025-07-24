import type {
  Service,
  PricingCategory,
  PricingItem,
  TimeSlot,
  TimeSlotConfig,
  ApiResponse,
} from '@/shared/types/customer';

class ServicesApi {
  private static baseUrl = '/api';

  static async getServices(): Promise<ApiResponse<{ services: Service[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/services`, {
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
          error: data.error || 'Failed to fetch services',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching services:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async getPricing(): Promise<ApiResponse<{ pricing: PricingItem[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/pricing`, {
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
          error: data.error || 'Failed to fetch pricing',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching pricing:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async getTimeSlots(date: string): Promise<ApiResponse<{ timeSlots: TimeSlot[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/time-slots?date=${date}`, {
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
          error: data.error || 'Failed to fetch time slots',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching time slots:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async getTimeSlotConfig(): Promise<ApiResponse<{ config: TimeSlotConfig }>> {
    try {
      const response = await fetch(`${this.baseUrl}/time-slots/config`, {
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
          error: data.error || 'Failed to fetch time slot config',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching time slot config:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }
}

export { ServicesApi }; 