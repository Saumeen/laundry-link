import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { customerApi } from '../lib/api';
import { parseJsonResponse } from '../lib/api';
import googleMapsService, { GeocodingResult } from '../lib/googleMaps';
import EnhancedAddressForm, { FormData } from './EnhancedAddressForm';

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

interface AddressSelectorProps {
  selectedAddressId?: string;
  onAddressSelect: (addressId: string) => void;
  onAddressCreate?: (address: Address) => void;
  showCreateNew?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function AddressSelector({
  selectedAddressId,
  onAddressSelect,
  onAddressCreate,
  showCreateNew = true,
  className = '',
  label = 'Select Address',
  required = false
}: AddressSelectorProps) {
  const { data: session, status } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // View state - 'select' or 'create'
  const [currentView, setCurrentView] = useState<'select' | 'create'>('select');
  
  // Google Maps autocomplete state
  const [selectedAddress, setSelectedAddress] = useState<GeocodingResult | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  // Simple phone number validation function
  const isValidPhoneNumber = (phone: string) => {
    // Basic phone number validation - can be enhanced as needed
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };
  

  
  // Form data with proper typing
  const [formData, setFormData] = useState<FormData>({
    googleAddress: '',
    locationType: 'home',
    // Address components from Google Maps
    city: '',
    area: '',
    building: '',
    // Hotel fields
    hotelName: '',
    roomNumber: '',
    collectionMethod: 'reception',
    // Home fields
    house: '',
    road: '',
    block: '',
    homeCollectionMethod: 'directly',
    // Flat fields
    flatNumber: '',
    // Office fields
    officeNumber: '',
    // Contact number (required for all addresses)
    contactNumber: '',
  });

  // Fetch addresses when component mounts or session changes
  useEffect(() => {
    if (session?.user?.email) {
      fetchAddresses();
    }
  }, [session]);

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

  // Handle address selection from Google Maps component
  const handleNewAddressSelect = useCallback(async (suggestion: any) => {
    try {
      setAddressLoading(true);
      const geocodingResult = await googleMapsService.geocodePlaceId(suggestion.place_id);
      
      if (geocodingResult) {
        setSelectedAddress(geocodingResult);
        setFormData(prev => ({
          ...prev,
          googleAddress: suggestion.description,
          // Extract and populate address components from geocoding result
          city: geocodingResult.city || '',
          area: geocodingResult.area || '',
          building: geocodingResult.building || '',
          // Clear other location-specific fields to avoid conflicts
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

  const resetForm = useCallback(() => {
    setFormData({
      googleAddress: '',
      locationType: 'home',
      // Address components from Google Maps
      city: '',
      area: '',
      building: '',
      // Hotel fields
      hotelName: '',
      roomNumber: '',
      collectionMethod: 'reception',
      // Home fields
      house: '',
      road: '',
      block: '',
      homeCollectionMethod: 'directly',
      // Flat fields
      flatNumber: '',
      // Office fields
      officeNumber: '',
      // Contact number (required for all addresses)
      contactNumber: '',
    });
    setSelectedAddress(null);
    setMessage('');
    setErrors({});
  }, []);

  // Show create form
  const showCreateForm = useCallback(() => {
    resetForm();
    setCurrentView('create');
  }, [resetForm]);

  // Go back to selection view
  const goBackToSelect = useCallback(() => {
    setCurrentView('select');
    resetForm();
  }, [resetForm]);

  const saveAddress = useCallback(async (addressData: any) => {
    try {
      const response = await customerApi.createAddress(addressData);
      const result = await parseJsonResponse(response);
      
      // Type guard for result
      if (
        result &&
        typeof result === 'object' &&
        'address' in result &&
        result.address &&
        typeof result.address === 'object' &&
        'id' in result.address &&
        typeof result.address.id !== 'undefined'
      ) {
        // If onAddressCreate callback is provided, call it with the new address
        if (onAddressCreate) {
          onAddressCreate(result.address as Address);
        }
        // Select the newly created address
        onAddressSelect(String(result.address.id));
      }
      
      // Refresh addresses list
      await fetchAddresses();
      
      setMessage('✅ Address saved successfully!');
      setCurrentView('select');
      resetForm();
    } catch (error) {
      console.error('Error saving address:', error);
      setMessage('❌ Failed to save address. Please try again.');
    }
  }, [onAddressCreate, onAddressSelect, fetchAddresses, resetForm]);

  const handleSave = useCallback(async () => {
    // Validate required fields
    const newErrors: {[key: string]: string} = {};

    // Always require contact number
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!isValidPhoneNumber(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid phone number';
    }

    // If Google address is selected (and geocoded), all other fields are optional
    if (formData.googleAddress.trim() && selectedAddress) {
      // No further validation needed
    } else {
      // Require googleAddress
      if (!formData.googleAddress.trim()) {
        newErrors.googleAddress = 'Address is required';
      }
      // Location-specific validations
      if (formData.locationType === 'hotel') {
        if (!formData.hotelName.trim()) {
          newErrors.hotelName = 'Hotel name is required';
        }
        if (!formData.roomNumber.trim()) {
          newErrors.roomNumber = 'Room number is required';
        }
      } else if (formData.locationType === 'home') {
        if (!formData.house.trim()) {
          newErrors.house = 'House number is required';
        }
        if (!formData.road.trim()) {
          newErrors.road = 'Road name is required';
        }
      } else if (formData.locationType === 'flat') {
        if (!formData.building.trim()) {
          newErrors.building = 'Building name is required';
        }
        if (!formData.flatNumber.trim()) {
          newErrors.flatNumber = 'Flat number is required';
        }
      } else if (formData.locationType === 'office') {
        if (!formData.building.trim()) {
          newErrors.building = 'Building name is required';
        }
        if (!formData.officeNumber.trim()) {
          newErrors.officeNumber = 'Office number is required';
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      // Prepare address data for API
      const addressData: any = {
        label: formData.googleAddress,
        addressLine1: formData.googleAddress,
        city: formData.city,
        area: formData.area,
        building: formData.building,
        locationType: formData.locationType,
        contactNumber: formData.contactNumber,
        email: session?.user?.email || '',
        // GPS coordinates if available
        ...(selectedAddress?.latitude && selectedAddress?.longitude && {
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
        }),
      };

      // Add location-specific data only if Google address is not provided
      if (!formData.googleAddress.trim() || !selectedAddress) {
        if (formData.locationType === 'hotel') {
          addressData.hotelName = formData.hotelName;
          addressData.roomNumber = formData.roomNumber;
          addressData.collectionMethod = formData.collectionMethod;
        } else if (formData.locationType === 'home') {
          addressData.house = formData.house;
          addressData.road = formData.road;
          addressData.block = formData.block;
          addressData.homeCollectionMethod = formData.homeCollectionMethod;
        } else if (formData.locationType === 'flat') {
          addressData.flatNumber = formData.flatNumber;
        } else if (formData.locationType === 'office') {
          addressData.officeNumber = formData.officeNumber;
        }
      }

      await saveAddress(addressData);
    } catch (error) {
      console.error('Error in handleSave:', error);
      setMessage('❌ Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [formData, selectedAddress, saveAddress, isValidPhoneNumber]);

  // Format address for display
  const formatAddress = useCallback((address: Address) => {
    if (address.addressLine1) {
      let formatted = address.addressLine1;
      if (address.addressLine2) formatted += `, ${address.addressLine2}`;
      if (address.city) formatted += `, ${address.city}`;
      return formatted;
    }
    return 'Address not available';
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 mb-2">Please log in to manage addresses</p>
        <a href="/registerlogin" className="text-blue-600 hover:text-blue-800 text-sm">
          Go to Login
        </a>
      </div>
    );
  }



  // Create Form View
  if (currentView === 'create') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Status Message */}
        {message && (
          <div className={`p-3 rounded-lg ${
            message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Form Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Add New Address</h3>
          <button
            onClick={goBackToSelect}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Selection</span>
          </button>
        </div>

        {/* Enhanced Address Form */}
        <EnhancedAddressForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          selectedAddress={selectedAddress}
          setSelectedAddress={setSelectedAddress}
          addressLoading={addressLoading}
          setAddressLoading={setAddressLoading}
          onAddressSelect={handleNewAddressSelect}
        />

        {/* Save/Cancel Buttons */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Address</span>
              </>
            )}
          </button>
          
          <button
            onClick={goBackToSelect}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Select View
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Message */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Address Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {showCreateNew && (
            <button
              onClick={showCreateForm}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Address
            </button>
          )}
        </div>
        
        {addresses.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first address to get started.</p>
            {showCreateNew && (
              <div className="mt-4">
                <button
                  onClick={showCreateForm}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Address
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {addresses.map((address) => (
              <label key={address.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="selectedAddressId"
                  value={address.id.toString()}
                  checked={selectedAddressId === address.id.toString()}
                  onChange={(e) => onAddressSelect(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{address.label}</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 capitalize">
                      {address.locationType || 'flat'}
                    </span>
                    {address.isDefault && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600 font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{formatAddress(address)}</div>
                  {address.contactNumber && (
                    <div className="text-sm text-gray-500">Contact: {address.contactNumber}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 