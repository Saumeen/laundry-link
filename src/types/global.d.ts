/// <reference types="google.maps" />

declare global {
  interface Window {
    google: typeof google;
  }
}

// Role system types
export type UserRole = 'SUPER_ADMIN' | 'OPERATION_MANAGER' | 'DRIVER' | 'FACILITY_TEAM';

export interface Role {
  id: number;
  name: UserRole;
  description?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: number;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
}

export interface OrderUpdate {
  id: number;
  orderId: number;
  staffId?: number;
  status: string;
  notes?: string;
  createdAt: Date;
  staff?: Staff;
}

export interface DriverAssignment {
  id: number;
  orderId: number;
  driverId: number;
  assignmentType: 'pickup' | 'delivery';
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  estimatedTime?: Date;
  actualTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  driver: Staff;
}

// Permission types
export interface Permission {
  name: string;
  description: string;
  category: 'orders' | 'customers' | 'staff' | 'reports' | 'settings';
}

// Admin portal types
export interface AdminDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  activeDrivers: number;
}

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
} 