// API Clients
export { OrdersApi } from './api/orders';
export { ProfileApi } from './api/profile';
export { AddressesApi } from './api/addresses';
export { ServicesApi } from './api/services';
export { InvoiceApi } from './api/invoice';
export { walletApi } from './api/wallet';

// Components
export { CustomerDashboard } from './components/CustomerDashboard';
export { CustomerLayout } from './components/CustomerLayout';

// Stores
export { useOrdersStore } from './stores/ordersStore';
export { useProfileStore } from './stores/profileStore';
export { useAddressesStore } from './stores/addressesStore';
export { useWalletStore } from './stores/walletStore';

// Types
export type {
  CustomerProfile,
  CustomerAddress,
  OrderWithDetails,
  OrderItem,
  OrderServiceMapping,
  ProcessingItem,
  OrderProcessing,
  Service,
  PricingCategory,
  PricingItem,
  TimeSlot,
  Configuration,
  CreateOrderData,
  UpdateProfileData,
  CreateAddressData,
  UpdateAddressData,
  OrderFilters,
  AddressFilters,
  FormState,
  ApiResponse,
  PaginatedResponse,
  OrdersListResponse,
  OrderResponse,
  ValidationSession,
  PhoneVerificationData,
  PhoneExistsResponse,
} from '@/shared/types/customer';
