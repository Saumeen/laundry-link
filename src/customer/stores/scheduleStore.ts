import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  ScheduleFormData,
  CustomerData,
  Address,
  Service,
} from '@/types/schedule';

interface ScheduleState {
  // Form data
  formData: ScheduleFormData;

  // Customer and address data
  customerData: CustomerData | null;
  addresses: Address[];
  services: Service[];

  // UI state
  currentStep: number;
  isLoading: boolean;
  isSubmitting: boolean;
  submitError: string;
  timeValidationError: string;

  // Express service state
  isExpressService: boolean;

  // Actions
  setFormData: (data: Partial<ScheduleFormData>) => void;
  setCustomerData: (data: CustomerData | null) => void;
  setAddresses: (addresses: Address[]) => void;
  setServices: (services: Service[]) => void;
  setCurrentStep: (step: number) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string) => void;
  setTimeValidationError: (error: string) => void;

  // Service actions
  toggleService: (serviceId: string) => void;
  checkExpressService: () => void;

  // Navigation actions
  nextStep: () => void;
  previousStep: () => void;
  resetForm: () => void;

  // Address actions
  selectAddress: (addressId: string) => void;
  addAddress: (address: Address) => void;
}

const initialFormData: ScheduleFormData = {
  selectedAddressId: '',
  firstName: '',
  lastName: '',
  locationType: '',
  hotelName: '',
  roomNumber: '',
  collectionMethod: '',
  house: '',
  road: '',
  block: '',
  homeCollectionMethod: 'Collect directly from me',
  building: '',
  flatNumber: '',
  officeNumber: '',
  contactNumber: '',
  email: '',
  addressLabel: '',
  pickupDate: '',
  pickupTimeSlot: '',
  deliveryDate: '',
  deliveryTimeSlot: '',
  services: [],
  specialInstructions: '',
};

export const useScheduleStore = create<ScheduleState>()(
  devtools(
    (set, get) => ({
      // Initial state
      formData: initialFormData,
      customerData: null,
      addresses: [],
      services: [],
      currentStep: 1,
      isLoading: false,
      isSubmitting: false,
      submitError: '',
      timeValidationError: '',
      isExpressService: false,

      // Form actions
      setFormData: (data: Partial<ScheduleFormData>) => {
        set(state => ({
          formData: { ...state.formData, ...data },
        }));
        // Check if express service is selected whenever services change
        if (data.services !== undefined) {
          get().checkExpressService();
        }
      },

      setCustomerData: (data: CustomerData | null) => {
        set({ customerData: data });
      },

      setAddresses: (addresses: Address[]) => {
        set({ addresses });
        // Auto-select default address if available
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          get().setFormData({
            selectedAddressId: defaultAddress.id.toString(),
          });
        }
      },

      setServices: (services: Service[]) => {
        set({ services });
      },

      setCurrentStep: (step: number) => {
        set({ currentStep: step });
      },

      setIsLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setIsSubmitting: (submitting: boolean) => {
        set({ isSubmitting: submitting });
      },

      setSubmitError: (error: string) => {
        set({ submitError: error });
      },

      setTimeValidationError: (error: string) => {
        set({ timeValidationError: error });
      },

      // Service actions
      toggleService: (serviceId: string) => {
        set(state => {
          const currentServices = state.formData.services;
          let newServices: string[];

          if (currentServices.includes(serviceId)) {
            newServices = currentServices.filter(id => id !== serviceId);
          } else {
            newServices = [...currentServices, serviceId];
          }

          return {
            formData: { ...state.formData, services: newServices },
          };
        });

        // Check express service after toggling
        get().checkExpressService();
      },

      checkExpressService: () => {
        const { formData, services } = get();
        const expressService = services.find(s => s.name === 'express-service');

        if (
          expressService &&
          formData.services.includes(expressService.id.toString())
        ) {
          set({ isExpressService: true });

          // Auto-set express service times
          const now = new Date();
          const pickupStartTime = now.toISOString();
          const deliveryEndTime = new Date(
            now.getTime() + 6 * 60 * 60 * 1000
          ).toISOString();

          get().setFormData({
            pickupStartTimeUTC: pickupStartTime,
            pickupEndTimeUTC: pickupStartTime, // Same as start for express
            deliveryStartTimeUTC: deliveryEndTime, // Same as end for express
            deliveryEndTimeUTC: deliveryEndTime,
            pickupDate: now.toISOString().split('T')[0],
            deliveryDate: new Date(now.getTime() + 6 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            pickupTimeSlot: 'express',
            deliveryTimeSlot: 'express',
          });
        } else {
          set({ isExpressService: false });
        }
      },

      // Navigation actions
      nextStep: () => {
        const { currentStep, isExpressService } = get();
        const maxSteps = isExpressService ? 3 : 4;

        if (currentStep < maxSteps) {
          set({ currentStep: currentStep + 1 });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      resetForm: () => {
        set({
          formData: initialFormData,
          currentStep: 1,
          isExpressService: false,
          submitError: '',
          timeValidationError: '',
        });
      },

      // Address actions
      selectAddress: (addressId: string) => {
        get().setFormData({ selectedAddressId: addressId });
      },

      addAddress: (address: Address) => {
        set(state => ({
          addresses: [...state.addresses, address],
        }));
        get().selectAddress(address.id.toString());
      },
    }),
    {
      name: 'schedule-store',
    }
  )
);
