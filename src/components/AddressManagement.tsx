import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import googleMapsService, { GeocodingResult } from '../lib/googleMaps';
import GoogleMapsAutocomplete from './GoogleMapsAutocomplete';

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
}

export default function AddressManagement() {
  const { data: session, status } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Google Maps autocomplete state
  const [selectedAddress, setSelectedAddress] = useState<GeocodingResult | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
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
    email: '',
  });

  // Fetch addresses when component mounts or session changes
  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({ ...prev, email: session.user!.email || '' }));
      fetchAddresses();
    }
  }, [session]);



  const fetchAddresses = async () => {
    if (!session?.user?.email) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/customer/addresses');
      if (response.ok) {
        const data = await response.json() as { addresses?: Address[] };
        setAddresses(data.addresses || []);
      } else {
        setMessage('❌ Failed to load addresses');
      }
    } catch (error) {
      setMessage('❌ Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };



  // Handle address selection from new Google Maps component
  const handleNewAddressSelect = async (suggestion: any) => {
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  };

  const resetForm = () => {
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
      email: session?.user?.email || '',
    });
    setSelectedAddress(null);
    setMessage('');
    setErrors({});
    setEditingId(null);
  };

  // Populate form for editing
  const startEdit = (address: Address) => {
    setEditingId(address.id);
    
    // Parse the address back to form fields based on location type
    const addressParts = address.addressLine1?.split(', ') || [];
    
    let parsedData: any = {
      googleAddress: address.addressLine1 || '',
      locationType: address.locationType || 'home',
      // Address components from Google Maps
      city: address.city || '',
      area: address.area || '',
      building: address.building || '',
      // Hotel fields
      hotelName: '',
      roomNumber: '',
      collectionMethod: 'reception',
      // Home fields
      house: '',
      road: address.area || '',
      block: '',
      homeCollectionMethod: 'directly',
      // Flat fields
      flatNumber: address.floor || '',
      // Office fields
      officeNumber: address.apartment || '',
      // Contact number (required for all addresses)
      contactNumber: '', // Will be populated from existing data if available
      email: session?.user?.email || '',
    };

    // Try to parse based on location type
    if (address.locationType === 'hotel' && addressParts.length >= 2) {
      parsedData.hotelName = addressParts[0] || '';
      parsedData.roomNumber = addressParts[1]?.replace('Room ', '') || '';
    } else if (address.locationType === 'home' && addressParts.length >= 2) {
      parsedData.house = addressParts[0] || '';
      parsedData.road = addressParts[1] || '';
      if (addressParts[2]?.includes('Block')) {
        parsedData.block = addressParts[2].replace('Block ', '') || '';
      }
    } else if (address.locationType === 'flat' && addressParts.length >= 3) {
      parsedData.building = addressParts[0] || '';
      parsedData.road = addressParts[1] || '';
      if (addressParts[2]?.includes('Block')) {
        parsedData.block = addressParts[2].replace('Block ', '') || '';
      }
    } else if (address.locationType === 'office' && addressParts.length >= 3) {
      parsedData.building = addressParts[0] || '';
      parsedData.road = addressParts[1] || '';
      if (addressParts[2]?.includes('Block')) {
        parsedData.block = addressParts[2].replace('Block ', '') || '';
      }
    }

    setFormData(parsedData);
  };

  const handleSave = async () => {
    // Clear previous errors
    setErrors({});
    
    // Validation
    const newErrors: {[key: string]: string} = {};

    if (!formData.googleAddress.trim()) {
      newErrors.googleAddress = 'Address is required';
    }
    
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    }
    
    // Only validate location-specific fields if they are filled in
    // This allows users to use either Google address OR manual entry
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

    setSaving(true);

    try {
      // Prepare address data with Google Maps information
      const addressData = {
        ...formData,
        label: formData.googleAddress, // Use Google address as label
        latitude: selectedAddress?.latitude,
        longitude: selectedAddress?.longitude,
        formattedAddress: selectedAddress?.formatted_address,
      };

      const url = editingId 
        ? `/api/customer/addresses/${editingId}`
        : `/api/customer/addresses`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData),
      });

      if (response.ok) {
        setMessage(`✅ Address ${editingId ? 'updated' : 'saved'} successfully!`);
        resetForm();
        await fetchAddresses();
      } else {
        const data = await response.json() as { error?: string };
        setMessage(`❌ ${data.error || 'Failed to save address'}`);
      }
    } catch (error) {
      setMessage('❌ Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  // Set default address
  const handleSetDefault = async (addressId: number) => {
    try {
      const response = await fetch(`/api/customer/addresses/${addressId}/default`, {
        method: 'PUT',
      });

      if (response.ok) {
        setMessage('✅ Default address updated!');
        await fetchAddresses();
      } else {
        setMessage('❌ Failed to set default address');
      }
    } catch (error) {
      setMessage('❌ Failed to set default address');
    }
  };

  // Delete address
  const handleDelete = async (addressId: number) => {
    if (!confirm('Delete this address?')) return;

    try {
      const response = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('✅ Address deleted!');
        await fetchAddresses();
      } else {
        setMessage('❌ Failed to delete address');
      }
    } catch (error) {
      setMessage('❌ Failed to delete address');
    }
  };

  // Format address for display
  const formatAddress = (address: Address) => {
    if (address.addressLine1) {
      let formatted = address.addressLine1;
      if (address.addressLine2) formatted += `, ${address.addressLine2}`;
      if (address.city) formatted += `, ${address.city}`;
      return formatted;
    }
    return 'Address not available';
  };

  // Render location-specific form
  const renderLocationForm = () => {
    switch (formData.locationType) {
      case 'hotel':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hotel Name (Optional)
                </label>
                <input
                  type="text"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleInputChange}
                  placeholder="Hotel name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.hotelName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.hotelName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.hotelName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number (Optional)
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  placeholder="Room number"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.roomNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.roomNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.roomNumber}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Method *
              </label>
              <select
                name="collectionMethod"
                value={formData.collectionMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="reception">From Reception</option>
                <option value="concierge">From Concierge</option>
                <option value="direct">Directly from Room</option>
              </select>
            </div>
          </div>
        );

      case 'home':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  House (Optional)
                </label>
                <input
                  type="text"
                  name="house"
                  value={formData.house}
                  onChange={handleInputChange}
                  placeholder="House number/name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.house ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.house && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.house}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Road *
                </label>
                <input
                  type="text"
                  name="road"
                  value={formData.road}
                  onChange={handleInputChange}
                  placeholder="Road name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.road ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.road && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.road}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Block
              </label>
              <input
                type="text"
                name="block"
                value={formData.block}
                onChange={handleInputChange}
                placeholder="Block number (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Method *
              </label>
              <select
                name="homeCollectionMethod"
                value={formData.homeCollectionMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="directly">Collect directly from me</option>
                <option value="outside">I'll leave it outside</option>
              </select>
            </div>
          </div>
        );

      case 'flat':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block
                </label>
                <input
                  type="text"
                  name="block"
                  value={formData.block}
                  onChange={handleInputChange}
                  placeholder="Block number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Building *
                </label>
                <input
                  type="text"
                  name="building"
                  value={formData.building}
                  onChange={handleInputChange}
                  placeholder="Building number or name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.building ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.building && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.building}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Road *
                </label>
                <input
                  type="text"
                  name="road"
                  value={formData.road}
                  onChange={handleInputChange}
                  placeholder="Road name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.road ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.road && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.road}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flat Number
                </label>
                <input
                  type="text"
                  name="flatNumber"
                  value={formData.flatNumber}
                  onChange={handleInputChange}
                  placeholder="Flat number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 'office':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block
                </label>
                <input
                  type="text"
                  name="block"
                  value={formData.block}
                  onChange={handleInputChange}
                  placeholder="Block number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Building *
                </label>
                <input
                  type="text"
                  name="building"
                  value={formData.building}
                  onChange={handleInputChange}
                  placeholder="Building number or name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.building ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.building && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.building}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Road *
                </label>
                <input
                  type="text"
                  name="road"
                  value={formData.road}
                  onChange={handleInputChange}
                  placeholder="Road name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.road ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.road && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.road}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Office Number
                </label>
                <input
                  type="text"
                  name="officeNumber"
                  value={formData.officeNumber}
                  onChange={handleInputChange}
                  placeholder="Office number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Please log in to manage your addresses</p>
        <a href="/registerlogin" className="text-blue-600 hover:text-blue-800">
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Add/Edit Address Form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? 'Edit Address' : 'Add New Address'}
        </h3>
        
        <div className="space-y-4">
          {/* Google Address Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            
            <GoogleMapsAutocomplete
              value={formData.googleAddress}
              onChange={(value) => setFormData(prev => ({ ...prev, googleAddress: value }))}
              onAddressSelect={handleNewAddressSelect}
              placeholder="Start typing your address..."
              className={`w-full ${errors.googleAddress ? 'border-red-500' : ''}`}
            />
            
            {errors.googleAddress && (
              <p className="mt-1 text-sm text-red-600">
                {errors.googleAddress}
              </p>
            )}
            
            <p className="mt-1 text-xs text-gray-500">
              Select your address from Google Maps suggestions. This will be used as the address.
            </p>
            {addressLoading && (
              <div className="mt-2 text-sm text-gray-500">
                Loading suggestions...
              </div>
            )}
            {selectedAddress && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-700">
                  <strong>Selected Address:</strong> {selectedAddress.formatted_address}
                </div>
                {selectedAddress.latitude && selectedAddress.longitude && (
                  <div className="text-xs text-green-600 mt-1">
                    Coordinates: {selectedAddress.latitude.toFixed(6)}, {selectedAddress.longitude.toFixed(6)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Type *
            </label>
            <select
              name="locationType"
              value={formData.locationType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hotel">Hotel</option>
              <option value="home">Home</option>
              <option value="flat">Flat/Apartment</option>
              <option value="office">Office</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Choose your location type and optionally fill in additional details below (optional when using Google address).
            </p>
          </div>

          {/* Location-specific form */}
          {renderLocationForm()}

          {/* Contact Number (Required for all addresses) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number *
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              placeholder="Enter your contact number"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.contactNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.contactNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.contactNumber}
              </p>
            )}
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (editingId ? 'Update Address' : 'Save Address')}
          </button>
          
          {editingId && (
            <button
              onClick={resetForm}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Saved Addresses */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Saved Addresses</h3>
        
        {addresses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No addresses saved yet</p>
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white border rounded-lg p-4 ${address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{address.label}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 capitalize">
                      {address.locationType || 'flat'}
                    </span>
                    {address.isDefault && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600 font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  
                  <div className="text-gray-600">
                    <p>{formatAddress(address)}</p>
                    {address.building && (
                      <p className="text-sm">Building: {address.building}</p>
                    )}
                    {address.floor && (
                      <p className="text-sm">Floor: {address.floor}</p>
                    )}
                    {address.apartment && (
                      <p className="text-sm">Apartment: {address.apartment}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  {/* Edit Button */}
                  <button
                    onClick={() => startEdit(address)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit address"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  {/* Set Default Button */}
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-green-600 hover:text-green-800"
                      title="Set as default"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete address"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


