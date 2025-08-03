import type {
import logger from '@/lib/logger';
  CustomerProfile,
  UpdateProfileData,
  ApiResponse,
} from '@/shared/types/customer';

class ProfileApi {
  private static baseUrl = '/api/customer/profile';

  static async getProfile(): Promise<
    ApiResponse<{ customer: CustomerProfile }>
  > {
    try {
      const response = await fetch(this.baseUrl, {
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
          error: data.error || 'Failed to fetch profile',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error('Error fetching profile:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  static async updateProfile(
    profileData: UpdateProfileData
  ): Promise<ApiResponse<{ customer: CustomerProfile }>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update profile',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error('Error updating profile:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }
}

export { ProfileApi };
