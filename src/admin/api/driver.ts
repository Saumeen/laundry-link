import { apiClient } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';

export interface DriverAssignment {
  id: number;
  assignmentType: 'pickup' | 'delivery';
  status: string;
  estimatedTime: string | null;
  actualTime: string | null;
  notes: string | null;
  order: {
    id: number;
    orderNumber: string;
    customerFirstName: string;
    customerLastName: string;
    customerPhone: string;
    customerAddress: string;
    pickupTime: string;
    deliveryTime: string;
    specialInstructions: string | null;
    customer: {
      id: number;
      firstName: string;
      lastName: string;
      phone: string;
    };
    address: {
      id: number;
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      area: string | null;
      building: string | null;
      floor: string | null;
      apartment: string | null;
      landmark: string | null;
      locationType: string | null;
      latitude: number | null;
      longitude: number | null;
    } | null;
  };
  photos: Array<{
    id: number;
    photoUrl: string;
    photoType: string;
    description: string | null;
    createdAt: string;
  }>;
}

export interface DriverStats {
  period: string;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  pendingAssignments: number;
  cancelledAssignments: number;
  earnings: number;
  pickupAssignments: number;
  deliveryAssignments: number;
  completionRate: number;
  recentAssignments: Array<{
    id: number;
    status: string;
    assignmentType: string;
    order: {
      orderNumber: string;
      customerFirstName: string;
      customerLastName: string;
    };
  }>;
}

export class DriverApi {
  // Get driver assignments
  static async getAssignments(): Promise<ApiResponse<DriverAssignment[]>> {
    return apiClient.get<DriverAssignment[]>('/api/admin/driver/assignments');
  }

  // Get driver statistics
  static async getStats(
    period: string = 'today'
  ): Promise<ApiResponse<DriverStats>> {
    return apiClient.get<DriverStats>(
      `/api/admin/driver/stats?period=${period}`
    );
  }

  // Update assignment status
  static async updateAssignmentStatus(
    assignmentId: number,
    status: string,
    notes?: string
  ): Promise<ApiResponse<DriverAssignment>> {
    return apiClient.put<DriverAssignment>('/api/admin/driver/assignments', {
      assignmentId,
      status,
      notes,
    });
  }

  // Upload photo for assignment
  static async uploadPhoto(
    assignmentId: number,
    photoData: {
      photoUrl: string;
      photoType: string;
      description?: string;
    }
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>(`/api/admin/driver/photo`, {
      assignmentId,
      ...photoData,
    });
  }

  // Get driver profile
  static async getProfile(): Promise<ApiResponse<Record<string, unknown>>> {
    return apiClient.get<Record<string, unknown>>('/api/admin/driver/profile');
  }

  // Update driver profile
  static async updateProfile(
    profileData: Record<string, unknown>
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return apiClient.patch<Record<string, unknown>>(
      '/api/admin/driver/profile',
      profileData
    );
  }
}
