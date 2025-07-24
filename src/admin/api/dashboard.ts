import { apiClient } from '@/shared/api/client';
import type { DashboardStats, AdminUser, ApiResponse } from '@/shared/types';

export class DashboardApi {
  // Get super admin statistics
  static async getSuperAdminStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>('/api/admin/super-admin-stats');
  }

  // Get operation manager statistics
  static async getOperationManagerStats(): Promise<
    ApiResponse<DashboardStats>
  > {
    return apiClient.get<DashboardStats>('/api/admin/operation-manager-stats');
  }

  // Get driver statistics
  static async getDriverStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>('/api/admin/driver/stats');
  }

  // Get facility team statistics
  static async getFacilityTeamStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>('/api/admin/facility-team/stats');
  }

  // Get current admin user information
  static async getCurrentAdminUser(): Promise<ApiResponse<AdminUser>> {
    return apiClient.get<AdminUser>('/api/admin/me');
  }
}
