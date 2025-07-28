import type { OrderStatus, PaymentStatus } from '@prisma/client';

// Customer Profile Types
export interface CustomerProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddress {
  id: number;
  customerId: number;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  area?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  contactNumber?: string;
  isDefault: boolean;
  address?: string;
  googleAddress?: string;
  locationType?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface OrderItem {
  id: number;
  orderServiceMappingId: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderServiceMapping {
  id: number;
  orderId: number;
  serviceId: number;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
  service: {
    id: number;
    name: string;
    displayName: string;
    description: string;
    pricingType: string;
    pricingUnit: string;
    price: number;
    unit: string;
    turnaround: string;
    category: string;
    features: string[];
  };
  processingItems: ProcessingItem[];
  orderItems: OrderItem[];
}

export interface ProcessingItem {
  id: number;
  orderServiceMappingId: number;
  itemName: string;
  quantity: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingItemDetail {
  id: number;
  processingItemId: number;
  detailType: string;
  detailValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderProcessing {
  id: number;
  orderId: number;
  totalPieces?: number;
  totalWeight?: number;
  processingNotes?: string;
  washType?: string;
  dryType?: string;
  specialInstructions?: string;
  fabricType?: string;
  stainTreatment?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types for Orders
export interface OrderWithDetails {
  id: number;
  orderNumber: string;
  customerId: number;
  addressId?: number;
  status: OrderStatus;
  pickupStartTime: string;
  pickupEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  specialInstructions?: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  invoiceTotal?: number;
  minimumOrderApplied: boolean;
  invoiceGenerated: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  createdByStaffId?: number;
  createdAt: string;
  updatedAt: string;

  // Additional fields from API response
  pickupTime?: string;
  deliveryTime?: string;
  pickupTimeSlot?: string;
  deliveryTimeSlot?: string;
  customerNotes?: string;

  // Relations
  address?: CustomerAddress;
  pickupAddress?: CustomerAddress;
  deliveryAddress?: CustomerAddress;
  orderServiceMappings: OrderServiceMapping[];
  orderProcessing?: OrderProcessing;
  orderUpdates: OrderUpdate[];

  // Transformed fields for UI
  items?: OrderItem[];
  invoiceItems?: OrderItem[];
}

export interface OrderUpdate {
  id: number;
  orderId: number;
  staffId?: number;
  oldStatus?: OrderStatus;
  newStatus: OrderStatus;
  notes?: string;
  createdAt: string;
}

// API Response Types
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

// API Response for Orders List
export interface OrdersListResponse {
  orders: OrderWithDetails[];
  total: number;
}

// API Response for Single Order
export interface OrderResponse {
  order: OrderWithDetails;
}

// Filter Types
export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface AddressFilters {
  page?: number;
  limit?: number;
  search?: string;
  isDefault?: boolean;
}

// Form Types
export interface FormState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface CreateOrderData {
  addressId?: number;
  pickupTime: string;
  deliveryTime: string;
  specialInstructions?: string;
  services: Array<{
    serviceId: number;
    quantity: number;
  }>;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface CreateAddressData {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  area?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  contactNumber?: string;
  isDefault?: boolean;
  googleAddress?: string;
  locationType?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {
  id: number;
}

// Invoice Types
export interface InvoiceData {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupTime: string;
  deliveryTime: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
}

// Service Types
export interface Service {
  id: number;
  name: string;
  displayName: string;
  description: string;
  pricingType: string;
  pricingUnit: string;
  price: number;
  unit: string;
  turnaround: string;
  category: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

// Pricing Types
export interface PricingCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PricingItem {
  id: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  unit: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category: PricingCategory;
}

// Time Slot Types
export interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  date: string;
}

export interface TimeSlotConfig {
  id: number;
  slotDuration: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// Validation Types
export interface ValidationSession {
  isValid: boolean;
  customer?: CustomerProfile;
  message?: string;
}

// Phone Verification Types
export interface PhoneVerificationData {
  phone: string;
  code: string;
}

export interface PhoneExistsResponse {
  exists: boolean;
  message?: string;
}
