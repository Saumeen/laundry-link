import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { customerApi, parseJsonResponse } from '@/lib/api';
import googleMapsService, { GeocodingResult } from '@/lib/googleMaps';

interface Address {
  id: number;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  address?: string;
  city: string;
  area?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  locationType?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  contactNumber?: string;
}

interface FormData {
  googleAddress: string;
  locationType: string;
  city: string;
  area: string;
  building: string;
  hotelName: string;
  roomNumber: string;
  collectionMethod: string;
  house: string;
  road: string;
  block: string;
  homeCollectionMethod: string;
  flatNumber: string;
  officeNumber: string;
  contactNumber: string;
  email: string;
}

export const useAddressSelector = (
  onAddressCreate?: (address: Address) => void
) => {
  const { data: session, status } = useSession();
  // Simple phone number validation function
  const isValidPhoneNumber = (phone: string) => {
    // Basic phone number validation - can be enhanced as needed
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [currentView, setCurrentView] = useState<'select' | 'create'>('select');
  const [selectedAddress, setSelectedAddress] = useState<GeocodingResult | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  // Memoized form data
  const [formData, setFormData] = useState<FormData>({
    googleAddress: '',
    locationType: 'home',
    city: '',
    area: '',
    building: '',
    hotelName: '',
    roomNumber: '',
    collectionMethod: 'reception',
    house: '',
    road: '',
    block: '',
    homeCollectionMethod: 'directly',
    flatNumber: '',
    officeNumber: '',
    contactNumber: '',
    email: '',
  });

  // Fetch addresses when component mounts or session changes
  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({ ...prev, email: session.user!.email || '' }));
      fetchAddresses();
    }
  }, [session]);

  // Memoized function to fetch addresses
  const fetchAddresses = useCallback(async () => {
    if (!session?.user?.email) return;
    
    setLoading(true);
    try {
      const response = await customerApi.getAddresses();
      const data = await parseJsonResponse<{ addresses?: Address[] }>(response);
      setAddresses(data.addresses || []);
    } catch (error) {
      setMessage('❌ Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  // Memoized function to handle address selection from Google Maps
  const handleNewAddressSelect = useCallback(async (suggestion: any) => {
    try {
      setAddressLoading(true);
      const geocodingResult = await googleMapsService.geocodePlaceId(suggestion.place_id);
      
      if (geocodingResult) {
        setSelectedAddress(geocodingResult);
        setFormData(prev => ({
          ...prev,
          googleAddress: suggestion.description,
          city: geocodingResult.city || '',
          area: geocodingResult.area || '',
          building: geocodingResult.building || '',
          hotelName: '',
          roomNumber: '',
          house: '',
          road: '',
          block: '',
          flatNumber: '',
          officeNumber: '',
        }));
        
        // Clear the googleAddress error when a valid address is selected
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.googleAddress;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    } finally {
      setAddressLoading(false);
    }
  }, []);

  // Memoized function to handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // Memoized function to reset form
  const resetForm = useCallback(() => {
    setFormData({
      googleAddress: '',
      locationType: 'home',
      city: '',
      area: '',
      building: '',
      hotelName: '',
      roomNumber: '',
      collectionMethod: 'reception',
      house: '',
      road: '',
      block: '',
      homeCollectionMethod: 'directly',
      flatNumber: '',
      officeNumber: '',
      contactNumber: '',
      email: session?.user?.email || '',
    });
    setSelectedAddress(null);
    setMessage('');
    setErrors({});
  }, [session?.user?.email]);

  // Memoized function to show create form
  const showCreateForm = useCallback(() => {
    resetForm();
    setCurrentView('create');
  }, [resetForm]);

  // Memoized function to go back to select view
  const goBackToSelect = useCallback(() => {
    setCurrentView('select');
    resetForm();
  }, [resetForm]);

  // Memoized function to save address
  const saveAddress = useCallback(async (addressData: any) => {
    setSaving(true);
    try {
      const response = await customerApi.createAddress(addressData);
      const newAddress = await parseJsonResponse<Address>(response);
      
      setMessage('✅ Address created successfully!');
      setAddresses(prev => [...prev, newAddress]);
      
      if (onAddressCreate) {
        onAddressCreate(newAddress);
      }
      
      // Reset form and go back to select view
      resetForm();
      setCurrentView('select');
    } catch (error) {
      console.error('Error creating address:', error);
      setMessage('❌ Failed to create address');
    } finally {
      setSaving(false);
    }
  }, [onAddressCreate, resetForm]);

  // Memoized function to handle save
  const handleSave = useCallback(async () => {
    // Clear previous errors
    setErrors({});
    
    // Validation
    const newErrors: {[key: string]: string} = {};

    if (!formData.googleAddress.trim()) {
      newErrors.googleAddress = 'Address is required';
    }
    
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!isValidPhoneNumber(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid phone number';
    }
    
    // Only validate location-specific fields if they are filled in
    if (formData.locationType === 'hotel' && (formData.hotelName.trim() || formData.roomNumber.trim())) {
      if (!formData.hotelName.trim()) {
        newErrors.hotelName = 'Hotel name is required';
      }
      if (!formData.roomNumber.trim()) {
        newErrors.roomNumber = 'Room number is required';
      }
    } else if (formData.locationType === 'home' && (formData.house.trim() || formData.road.trim())) {
      if (!formData.house.trim()) {
        newErrors.house = 'House is required';
      }
      if (!formData.road.trim()) {
        newErrors.road = 'Road is required';
      }
    } else if (formData.locationType === 'flat' && (formData.building.trim() || formData.road.trim())) {
      if (!formData.building.trim()) {
        newErrors.building = 'Building is required';
      }
      if (!formData.road.trim()) {
        newErrors.road = 'Road is required';
      }
    } else if (formData.locationType === 'office' && (formData.building.trim() || formData.road.trim())) {
      if (!formData.building.trim()) {
        newErrors.building = 'Building is required';
      }
      if (!formData.road.trim()) {
        newErrors.road = 'Road is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!session?.user?.email) {
      setMessage('❌ Please log in again');
      return;
    }

    // Prepare address data with Google Maps information
    const addressData = {
      ...formData,
      label: formData.googleAddress, // Use Google address as label
      latitude: selectedAddress?.latitude,
      longitude: selectedAddress?.longitude,
      formattedAddress: selectedAddress?.formatted_address,
    };

    // Save address directly without phone verification
    try {
      await saveAddress(addressData);
      setMessage('✅ Address saved successfully!');
    } catch (error) {
      setMessage('❌ Failed to save address');
    }
  }, [formData, selectedAddress, session?.user?.email, saveAddress, isValidPhoneNumber]);

  // Memoized function to format address for display
  const formatAddress = useCallback((address: Address) => {
    if (address.addressLine1) {
      let formatted = address.addressLine1;
      if (address.addressLine2) formatted += `, ${address.addressLine2}`;
      if (address.city) formatted += `, ${address.city}`;
      return formatted;
    }
    return 'Address not available';
  }, []);

  // Memoized computed values
  const isProcessing = useMemo(() => {
    return loading || saving || addressLoading;
  }, [loading, saving, addressLoading]);

  const hasAddresses = useMemo(() => {
    return addresses.length > 0;
  }, [addresses]);

  return {
    // State
    addresses,
    loading,
    saving,
    message,
    errors,
    currentView,
    selectedAddress,
    addressLoading,
    formData,
    isProcessing,
    hasAddresses,
    
    // Actions
    fetchAddresses,
    handleNewAddressSelect,
    handleInputChange,
    resetForm,
    showCreateForm,
    goBackToSelect,
    handleSave,
    formatAddress,
    
    // Setters
    setFormData,
    setMessage,
    setErrors,
  };
}; 