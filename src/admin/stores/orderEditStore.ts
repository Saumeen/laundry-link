import { create } from 'zustand';

interface OrderEditState {
  // Form state
  pickupStartTime: string;
  pickupEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  status: string;
  specialInstructions: string;
  sendEmailNotification: boolean;

  // Address fields
  addressLabel: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  area: string;
  building: string;
  floor: string;
  apartment: string;
  contactNumber: string;
  locationType: string;

  // Actions
  setPickupStartTime: (time: string) => void;
  setPickupEndTime: (time: string) => void;
  setDeliveryStartTime: (time: string) => void;
  setDeliveryEndTime: (time: string) => void;
  setStatus: (status: string) => void;
  setSpecialInstructions: (instructions: string) => void;
  setSendEmailNotification: (send: boolean) => void;
  setAddressLabel: (label: string) => void;
  setAddressLine1: (line1: string) => void;
  setAddressLine2: (line2: string) => void;
  setCity: (city: string) => void;
  setArea: (area: string) => void;
  setBuilding: (building: string) => void;
  setFloor: (floor: string) => void;
  setApartment: (apartment: string) => void;
  setContactNumber: (number: string) => void;
  setLocationType: (type: string) => void;

  // Initialize form with order data
  initializeForm: (order: any) => void;

  // Reset form
  resetForm: () => void;

  // Get all form data
  getFormData: () => any;
}

export const useOrderEditStore = create<OrderEditState>((set, get) => ({
  // Initial state
  pickupStartTime: '',
  pickupEndTime: '',
  deliveryStartTime: '',
  deliveryEndTime: '',
  status: '',
  specialInstructions: '',
  sendEmailNotification: false,
  addressLabel: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  area: '',
  building: '',
  floor: '',
  apartment: '',
  contactNumber: '',
  locationType: 'flat',

  // Actions
  setPickupStartTime: (time: string) => set({ pickupStartTime: time }),
  setPickupEndTime: (time: string) => set({ pickupEndTime: time }),
  setDeliveryStartTime: (time: string) => set({ deliveryStartTime: time }),
  setDeliveryEndTime: (time: string) => set({ deliveryEndTime: time }),
  setStatus: (status: string) => set({ status }),
  setSpecialInstructions: (instructions: string) =>
    set({ specialInstructions: instructions }),
  setSendEmailNotification: (send: boolean) =>
    set({ sendEmailNotification: send }),
  setAddressLabel: (label: string) => set({ addressLabel: label }),
  setAddressLine1: (line1: string) => set({ addressLine1: line1 }),
  setAddressLine2: (line2: string) => set({ addressLine2: line2 }),
  setCity: (city: string) => set({ city }),
  setArea: (area: string) => set({ area }),
  setBuilding: (building: string) => set({ building }),
  setFloor: (floor: string) => set({ floor }),
  setApartment: (apartment: string) => set({ apartment }),
  setContactNumber: (number: string) => set({ contactNumber: number }),
  setLocationType: (type: string) => set({ locationType: type }),

  initializeForm: (order: any) =>
    set({
      pickupStartTime: order.pickupStartTime
        ? new Date(order.pickupStartTime).toISOString()
        : '',
      pickupEndTime: order.pickupEndTime
        ? new Date(order.pickupEndTime).toISOString()
        : '',
      deliveryStartTime: order.deliveryStartTime
        ? new Date(order.deliveryStartTime).toISOString()
        : '',
      deliveryEndTime: order.deliveryEndTime
        ? new Date(order.deliveryEndTime).toISOString()
        : '',
      status: order.status,
      specialInstructions: order.specialInstructions || '',
      sendEmailNotification: false,
      addressLabel: order.address?.label || '',
      addressLine1: order.address?.addressLine1 || '',
      addressLine2: order.address?.addressLine2 || '',
      city: order.address?.city || '',
      area: order.address?.area || '',
      building: order.address?.building || '',
      floor: order.address?.floor || '',
      apartment: order.address?.apartment || '',
      contactNumber: order.address?.contactNumber || '',
      locationType: order.address?.locationType || 'flat',
    }),

  resetForm: () =>
    set({
      pickupStartTime: '',
      pickupEndTime: '',
      deliveryStartTime: '',
      deliveryEndTime: '',
      status: '',
      specialInstructions: '',
      sendEmailNotification: false,
      addressLabel: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      area: '',
      building: '',
      floor: '',
      apartment: '',
      contactNumber: '',
      locationType: 'flat',
    }),

  getFormData: () => {
    const state = get();
    return {
      pickupStartTime: state.pickupStartTime,
      pickupEndTime: state.pickupEndTime,
      deliveryStartTime: state.deliveryStartTime,
      deliveryEndTime: state.deliveryEndTime,
      status: state.status,
      specialInstructions: state.specialInstructions,
      sendEmailNotification: state.sendEmailNotification,
      addressLabel: state.addressLabel,
      addressLine1: state.addressLine1,
      addressLine2: state.addressLine2,
      city: state.city,
      area: state.area,
      building: state.building,
      floor: state.floor,
      apartment: state.apartment,
      contactNumber: state.contactNumber,
      locationType: state.locationType,
    };
  },
}));
