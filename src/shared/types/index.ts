// Re-export Prisma types for easy access
export type {
  Customer,
  Order,
  OrderItem,
  OrderServiceMapping,
  OrderUpdate,
  Staff,
  Role,
  Address,
  Service,
  PricingCategory,
  PricingItem,
  ServicePricingMapping,
  DriverAssignment,
  DriverPhoto,
  OrderProcessing,
  ProcessingItem,
  ProcessingItemDetail,
  IssueReport,
  OrderHistory,
  OrderStatus,
  PaymentStatus,
  DriverAssignmentStatus,
  ProcessingStatus,
  ItemStatus,
  IssueStatus,
} from '@prisma/client';

// Import specific types for use in interfaces
import type { OrderStatus, PaymentStatus } from '@prisma/client';

// Common API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Common form types
export interface FormState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Common filter types
export interface BaseFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface OrderFilters extends BaseFilters {
  status?: OrderStatus | 'ALL';
  paymentStatus?: PaymentStatus | 'ALL';
  customerId?: number;
  dateFrom?: string;
  dateTo?: string;
  serviceType?: 'EXPRESS' | 'REGULAR' | 'ALL';
}

export interface CustomerFilters extends BaseFilters {
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  dateFrom?: string;
  dateTo?: string;
}

// Dashboard stats types
export interface DashboardStats {
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  activeStaff: number;
  pendingOrders: number;
  completedOrders: number;
  activeDrivers: number;
}

// Admin user types
export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: {
    id: number;
    name: string;
    permissions: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Modal types
export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}
