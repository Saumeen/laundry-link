
import logger from '@/lib/logger';
import type { 
Service,
  PricingCategory,
  PricingItem,
  TimeSlot,
  Configuration,
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

      const data = (await response.json()) as
        | { services: Service[] }
        | { error: string };

      if (!response.ok) {
        return {
          success: false,
          error: 'error' in data ? data.error : 'Failed to fetch services',
        };
      }

      return {
        success: true,
        data: data as { services: Service[] },
      };
    } catch (error) {
      logger.error('Error fetching services:', error);
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

      const data = (await response.json()) as
        | { pricing: PricingItem[] }
        | { error: string };

      if (!response.ok) {
        return {
          success: false,
          error: 'error' in data ? data.error : 'Failed to fetch pricing',
        };
      }

      return {
        success: true,
        data: data as { pricing: PricingItem[] },
      };
    } catch (error) {
      logger.error('Error fetching pricing:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async getTimeSlots(
    date: string
  ): Promise<ApiResponse<{ timeSlots: TimeSlot[] }>> {
    try {
      const response = await fetch(`${this.baseUrl}/time-slots?date=${date}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = (await response.json()) as
        | { timeSlots: TimeSlot[] }
        | { error: string };

      if (!response.ok) {
        return {
          success: false,
          error: 'error' in data ? data.error : 'Failed to fetch time slots',
        };
      }

      return {
        success: true,
        data: data as { timeSlots: TimeSlot[] },
      };
    } catch (error) {
      logger.error('Error fetching time slots:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async getTimeSlotConfig(): Promise<
    ApiResponse<{ config: TimeSlotConfig }>
  > {
    try {
      const response = await fetch(`${this.baseUrl}/time-slots`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = (await response.json()) as
        | { config: TimeSlotConfig }
        | { error: string };

      if (!response.ok) {
        return {
          success: false,
          error:
            'error' in data ? data.error : 'Failed to fetch time slot config',
        };
      }

      return {
        success: true,
        data: data as { config: TimeSlotConfig },
      };
    } catch (error) {
      logger.error('Error fetching time slot config:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }
}

export { ServicesApi };
