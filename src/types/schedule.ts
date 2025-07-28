// Time slot configuration interface
export interface TimeSlotConfig {
  slotDuration: number;
  startTime: string;
  endTime: string;
}

// Generated time slot interface
export interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// Schedule form data interface
export interface ScheduleFormData {
  selectedAddressId: string;
  firstName: string;
  lastName: string;
  locationType: string;
  hotelName: string;
  roomNumber: string;
  collectionMethod: string;
  house: string;
  road: string;
  block: string;
  homeCollectionMethod: string;
  building: string;
  flatNumber: string;
  officeNumber: string;
  contactNumber: string;
  email: string;
  addressLabel: string;
  pickupDate: string;
  pickupTimeSlot: string;
  pickupStartTimeUTC?: string;
  pickupEndTimeUTC?: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  deliveryStartTimeUTC?: string;
  deliveryEndTimeUTC?: string;
  services: string[];
  specialInstructions: string;
}

// Customer data interface
export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// API response interfaces
export interface ApiAddressesResponse {
  addresses: Address[];
}

export interface ApiOrderResponse {
  orderNumber: string;
  error?: string;
}

// Address interface (re-export from common types)
export interface Address {
  id: string | number;
  label: string;
  address?: string;
  addressLine1?: string;
  contactNumber?: string;
  isDefault?: boolean;
  locationType?: string;
  hotelName?: string;
  roomNumber?: string;
  collectionMethod?: string;
  house?: string;
  road?: string;
  block?: string;
  homeCollectionMethod?: string;
  building?: string;
  flatNumber?: string;
  officeNumber?: string;
}

// Service interface (re-export from useServices)
export interface Service {
  id: string | number;
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  pricingType: string;
  pricingUnit: string;
}
