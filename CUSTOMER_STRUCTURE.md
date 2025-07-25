# Customer Structure Documentation

## Overview

This document outlines the comprehensive customer-side architecture for the LaundryLink application, following the same patterns as the admin structure for consistency and maintainability.

## Architecture Overview

```
src/
├── customer/
│   ├── api/                    # API client layer
│   │   ├── orders.ts          # Orders API client
│   │   ├── profile.ts         # Profile API client
│   │   ├── addresses.ts       # Addresses API client
│   │   └── services.ts        # Services API client
│   ├── stores/                # Zustand state management
│   │   ├── ordersStore.ts     # Orders state management
│   │   ├── profileStore.ts    # Profile state management
│   │   └── addressesStore.ts  # Addresses state management
│   ├── components/            # Reusable customer components
│   │   ├── CustomerDashboard.tsx
│   │   └── CustomerLayout.tsx
│   └── index.ts               # Main exports
├── shared/
│   └── types/
│       └── customer.ts        # Customer-specific types
└── app/
    └── customer/              # Customer pages
        └── dashboard/
            └── page.tsx       # Dashboard page
```

## Key Features

### 1. **Type Safety**
- Comprehensive TypeScript types for all customer entities
- Proper type definitions for API responses, forms, and state
- Type-safe API clients and stores

### 2. **State Management with Zustand**
- Centralized state management for customer data
- Optimistic updates for better UX
- Form state management with loading, error, and success states
- DevTools integration for debugging

### 3. **API Layer**
- Consistent API client pattern following admin structure
- Error handling and type-safe responses
- Automatic request/response transformation
- Credentials inclusion for authentication

### 4. **Professional UI Components**
- Modern, responsive design with Tailwind CSS
- Consistent design system across all components
- Mobile-first approach with proper navigation
- Loading states and error handling

## API Structure

### Orders API (`/api/customer/orders`)
- `GET /` - Fetch customer orders with pagination and filters
- `GET /:id` - Get specific order details
- `POST /` - Create new order
- `DELETE /:id` - Cancel order

### Profile API (`/api/customer/profile`)
- `GET /` - Get customer profile
- `PUT /` - Update customer profile

### Addresses API (`/api/customer/addresses`)
- `GET /` - Fetch customer addresses
- `GET /:id` - Get specific address
- `POST /` - Create new address
- `PUT /:id` - Update address
- `DELETE /:id` - Delete address
- `PUT /:id/default` - Set default address

### Services API (`/api/services`, `/api/pricing`, `/api/time-slots`)
- `GET /services` - Get available services
- `GET /pricing` - Get pricing information
- `GET /time-slots` - Get available time slots
- `GET /time-slots/config` - Get time slot configuration

## State Management

### Orders Store
```typescript
interface OrdersState {
  orders: OrderWithDetails[];
  selectedOrder: OrderWithDetails | null;
  pagination: PaginationInfo;
  loading: boolean;
  filters: OrderFilters;
  showOrderDetails: boolean;
  createOrderForm: FormState;
  cancelOrderForm: FormState;
  
  // Actions
  fetchOrders: (filters?: OrderFilters) => Promise<void>;
  selectOrder: (order: OrderWithDetails | null) => void;
  createOrder: (orderData: CreateOrderData) => Promise<void>;
  cancelOrder: (orderId: number) => Promise<void>;
  // ... more actions
}
```

### Profile Store
```typescript
interface ProfileState {
  profile: CustomerProfile | null;
  loading: boolean;
  updateProfileForm: FormState;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (profileData: UpdateProfileData) => Promise<void>;
  setProfile: (profile: CustomerProfile) => void;
}
```

### Addresses Store
```typescript
interface AddressesState {
  addresses: CustomerAddress[];
  selectedAddress: CustomerAddress | null;
  pagination: PaginationInfo;
  loading: boolean;
  filters: AddressFilters;
  showAddressForm: boolean;
  showAddressDetails: boolean;
  createAddressForm: FormState;
  updateAddressForm: FormState;
  deleteAddressForm: FormState;
  
  // Actions
  fetchAddresses: (filters?: AddressFilters) => Promise<void>;
  createAddress: (addressData: CreateAddressData) => Promise<void>;
  updateAddress: (addressData: UpdateAddressData) => Promise<void>;
  deleteAddress: (addressId: number) => Promise<void>;
  setDefaultAddress: (addressId: number) => Promise<void>;
  // ... more actions
}
```

## Component Architecture

### CustomerLayout
- Responsive sidebar navigation
- Mobile menu with hamburger toggle
- User profile display with wallet balance
- Active route highlighting
- Consistent branding

### CustomerDashboard
- Overview statistics (total orders, completed, in progress)
- Recent orders list with status indicators
- Quick actions for common tasks
- Professional loading states
- Integration with OrderDetailsModal

## Type Definitions

### Core Types
```typescript
// Customer Profile
interface CustomerProfile {
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

// Order with full details
interface OrderWithDetails {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  invoiceTotal?: number;
  // ... all order fields with relations
  orderServiceMappings: OrderServiceMapping[];
  orderProcessing?: OrderProcessing;
  orderUpdates: OrderUpdate[];
}

// Address management
interface CustomerAddress {
  id: number;
  customerId: number;
  label: string;
  addressLine1: string;
  // ... all address fields
  isDefault: boolean;
  googleAddress?: string;
  locationType?: string;
}
```

### API Response Types
```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Usage Examples

### Using the Customer Dashboard
```typescript
import { CustomerDashboard } from '@/customer/components/CustomerDashboard';
import { CustomerLayout } from '@/customer/components/CustomerLayout';

export default function DashboardPage() {
  return (
    <CustomerLayout>
      <CustomerDashboard />
    </CustomerLayout>
  );
}
```

### Using Stores in Components
```typescript
import { useOrdersStore, useProfileStore } from '@/customer';

function MyComponent() {
  const { orders, loading, fetchOrders } = useOrdersStore();
  const { profile } = useProfileStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Component logic
}
```

### Using API Clients Directly
```typescript
import { OrdersApi, ProfileApi } from '@/customer';

async function handleCreateOrder(orderData: CreateOrderData) {
  const response = await OrdersApi.createOrder(orderData);
  
  if (response.success) {
    // Handle success
  } else {
    // Handle error
  }
}
```

## Best Practices

### 1. **State Management**
- Use stores for global state that needs to be shared across components
- Keep local state in components when it's only used within that component
- Use form states for loading, error, and success feedback

### 2. **API Calls**
- Always handle errors gracefully
- Use the API clients instead of direct fetch calls
- Implement proper loading states

### 3. **Type Safety**
- Always use proper TypeScript types
- Avoid using `any` type
- Use the provided type definitions

### 4. **UI/UX**
- Follow the established design system
- Use consistent spacing and colors
- Implement proper loading and error states
- Make components responsive

### 5. **Performance**
- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Use Zustand's selective subscriptions when possible

## File Structure for New Features

When adding new customer features, follow this structure:

1. **Add types** to `src/shared/types/customer.ts`
2. **Create API client** in `src/customer/api/`
3. **Create store** in `src/customer/stores/`
4. **Create components** in `src/customer/components/`
5. **Create pages** in `src/app/customer/`
6. **Update exports** in `src/customer/index.ts`

## Integration with Existing Code

The customer structure integrates seamlessly with:
- Existing admin structure (following same patterns)
- Next.js App Router
- Prisma database schema
- Authentication system
- Existing components and utilities

This architecture provides a solid foundation for building scalable, maintainable customer-facing features while maintaining consistency with the existing codebase. 