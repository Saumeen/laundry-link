import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import logger from '@/lib/logger';
import type {
  CustomerAddress,
  AddressFilters,
  CreateAddressData,
  UpdateAddressData,
  FormState,
} from '@/shared/types/customer';
import { AddressesApi } from '@/customer/api/addresses';

interface AddressesState {
  // Data
  addresses: CustomerAddress[];
  selectedAddress: CustomerAddress | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;

  // UI State
  loading: boolean;
  filters: AddressFilters;
  showAddressForm: boolean;
  showAddressDetails: boolean;

  // Form States
  createAddressForm: FormState;
  updateAddressForm: FormState;
  deleteAddressForm: FormState;

  // Actions
  fetchAddresses: (filters?: AddressFilters) => Promise<void>;
  selectAddress: (address: CustomerAddress | null) => void;
  createAddress: (addressData: CreateAddressData) => Promise<void>;
  updateAddress: (addressData: UpdateAddressData) => Promise<void>;
  deleteAddress: (addressId: number) => Promise<void>;
  setDefaultAddress: (addressId: number) => Promise<void>;
  setFilters: (filters: Partial<AddressFilters>) => void;
  resetFilters: () => void;
  toggleAddressForm: () => void;
  toggleAddressDetails: () => void;
}

const initialState = {
  addresses: [],
  selectedAddress: null,
  pagination: null,
  loading: false,
  filters: {
    page: 1,
    limit: 10,
  },
  showAddressForm: false,
  showAddressDetails: false,
  createAddressForm: { loading: false, error: null, success: false },
  updateAddressForm: { loading: false, error: null, success: false },
  deleteAddressForm: { loading: false, error: null, success: false },
};

export const useAddressesStore = create<AddressesState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchAddresses: async (filters?: AddressFilters) => {
        set({ loading: true });
        try {
          const currentFilters = { ...get().filters, ...filters };
          const response = await AddressesApi.getAddresses(currentFilters);

          if (response.success && response.data) {
            set({
              addresses: response.data.data,
              pagination: response.data.pagination,
              filters: currentFilters,
            });
          } else {
            logger.error('Failed to fetch addresses:', response.error);
          }
        } catch (error) {
          logger.error('Error fetching addresses:', error);
        } finally {
          set({ loading: false });
        }
      },

      selectAddress: (address: CustomerAddress | null) => {
        set({ selectedAddress: address });
      },

      createAddress: async (addressData: CreateAddressData) => {
        set(state => ({
          createAddressForm: {
            ...state.createAddressForm,
            loading: true,
            error: null,
            success: false,
          },
        }));

        try {
          const response = await AddressesApi.createAddress(addressData);

          if (response.success && response.data && response.data.address) {
            set(state => ({
              createAddressForm: { loading: false, error: null, success: true },
              addresses: [response.data!.address, ...state.addresses],
              showAddressForm: false,
            }));
          } else {
            set(state => ({
              createAddressForm: {
                ...state.createAddressForm,
                loading: false,
                error: response.error || 'Failed to create address',
              },
            }));
          }
        } catch (error) {
          logger.error('Error creating address:', error);
          set(state => ({
            createAddressForm: {
              ...state.createAddressForm,
              loading: false,
              error: 'Network error occurred',
            },
          }));
        }
      },

      updateAddress: async (addressData: UpdateAddressData) => {
        set(state => ({
          updateAddressForm: {
            ...state.updateAddressForm,
            loading: true,
            error: null,
            success: false,
          },
        }));

        try {
          const response = await AddressesApi.updateAddress(addressData);

          if (response.success && response.data) {
            set(state => ({
              updateAddressForm: { loading: false, error: null, success: true },
              addresses: state.addresses.map(address =>
                address.id === addressData.id ? response.data!.address : address
              ),
              selectedAddress:
                state.selectedAddress?.id === addressData.id
                  ? response.data!.address
                  : state.selectedAddress,
              showAddressForm: false,
            }));
          } else {
            set(state => ({
              updateAddressForm: {
                ...state.updateAddressForm,
                loading: false,
                error: response.error || 'Failed to update address',
              },
            }));
          }
        } catch (error) {
          logger.error('Error updating address:', error);
          set(state => ({
            updateAddressForm: {
              ...state.updateAddressForm,
              loading: false,
              error: 'Network error occurred',
            },
          }));
        }
      },

      deleteAddress: async (addressId: number) => {
        set(state => ({
          deleteAddressForm: {
            ...state.deleteAddressForm,
            loading: true,
            error: null,
            success: false,
          },
        }));

        try {
          const response = await AddressesApi.deleteAddress(addressId);

          if (response.success) {
            set(state => ({
              deleteAddressForm: { loading: false, error: null, success: true },
              addresses: state.addresses.filter(
                address => address.id !== addressId
              ),
              selectedAddress:
                state.selectedAddress?.id === addressId
                  ? null
                  : state.selectedAddress,
              showAddressDetails: false,
            }));
          } else {
            set(state => ({
              deleteAddressForm: {
                ...state.deleteAddressForm,
                loading: false,
                error: response.error || 'Failed to delete address',
              },
            }));
          }
        } catch (error) {
          logger.error('Error deleting address:', error);
          set(state => ({
            deleteAddressForm: {
              ...state.deleteAddressForm,
              loading: false,
              error: 'Network error occurred',
            },
          }));
        }
      },

      setDefaultAddress: async (addressId: number) => {
        try {
          const response = await AddressesApi.setDefaultAddress(addressId);

          if (response.success) {
            set(state => ({
              addresses: state.addresses.map(address => ({
                ...address,
                isDefault: address.id === addressId,
              })),
            }));
          } else {
            logger.error('Failed to set default address:', response.error);
          }
        } catch (error) {
          logger.error('Error setting default address:', error);
        }
      },

      setFilters: (filters: Partial<AddressFilters>) => {
        set(state => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      resetFilters: () => {
        set({ filters: initialState.filters });
      },

      toggleAddressForm: () => {
        set(state => ({ showAddressForm: !state.showAddressForm }));
      },

      toggleAddressDetails: () => {
        set(state => ({ showAddressDetails: !state.showAddressDetails }));
      },
    }),
    {
      name: 'customer-addresses-store',
    }
  )
);
