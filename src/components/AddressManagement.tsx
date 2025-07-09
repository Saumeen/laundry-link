import { useState, useEffect } from 'react';

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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    label: '',
    locationType: 'home',
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
    building: '',
    flatNumber: '',
    // Office fields
    officeNumber: '',
    // Contact number (required for all addresses)
    contactNumber: '',
    email: '',
  });

  // Get customer email from localStorage
  useEffect(() => {
    const customerData = localStorage.getItem('customer');
    if (customerData) {
      const customer = JSON.parse(customerData);
      setCustomerEmail(customer.email);
      setFormData(prev => ({ ...prev, email: customer.email }));
    }
  }, []);

  // Fetch addresses when component mounts or customer email changes
  useEffect(() => {
    if (customerEmail) {
      fetchAddresses();
    }
  }, [customerEmail]);

  const fetchAddresses = async () => {
    if (!customerEmail) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/customer/addresses?email=${encodeURIComponent(customerEmail)}`);
      if (response.ok) {
        const data = await response.json();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      label: '',
      locationType: 'home',
      hotelName: '',
      roomNumber: '',
      collectionMethod: 'reception',
      house: '',
      road: '',
      block: '',
      homeCollectionMethod: 'directly',
      building: '',
      flatNumber: '',
      officeNumber: '',
      contactNumber: '',
      email: customerEmail,
    });
    setMessage('');
    setEditingId(null);
  };

  // Populate form for editing
  const startEdit = (address: Address) => {
    setEditingId(address.id);
    
    // Parse the address back to form fields based on location type
    const addressParts = address.addressLine1?.split(', ') || [];
    
    let parsedData = {
      label: address.label,
      locationType: address.locationType || 'home',
      hotelName: '',
      roomNumber: '',
      collectionMethod: 'reception',
      house: '',
      road: address.area || '',
      block: '',
      homeCollectionMethod: 'directly',
      building: address.building || '',
      flatNumber: address.floor || '',
      officeNumber: address.apartment || '',
      contactNumber: '', // Will be populated from existing data if available
      email: customerEmail,
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
    // Validation
    let isValid = true;
    let errorMsg = '';

    if (!formData.label.trim()) {
      isValid = false;
      errorMsg = 'Label is required';
    } else if (!formData.contactNumber.trim()) {
      isValid = false;
      errorMsg = 'Contact number is required';
    } else if (formData.locationType === 'hotel') {
      if (!formData.hotelName.trim() || !formData.roomNumber.trim()) {
        isValid = false;
        errorMsg = 'Hotel name and room number are required';
      }
    } else if (formData.locationType === 'home') {
      if (!formData.house.trim() || !formData.road.trim()) {
        isValid = false;
        errorMsg = 'House and road are required';
      }
    } else if (formData.locationType === 'flat') {
      if (!formData.building.trim() || !formData.road.trim()) {
        isValid = false;
        errorMsg = 'Building and road are required';
      }
    } else if (formData.locationType === 'office') {
      if (!formData.building.trim() || !formData.road.trim()) {
        isValid = false;
        errorMsg = 'Building and road are required';
      }
    }

    if (!isValid) {
      setMessage(`❌ ${errorMsg}`);
      return;
    }

    if (!customerEmail) {
      setMessage('❌ Please log in again');
      return;
    }

    setSaving(true);

    try {
      const url = editingId 
        ? `/api/customer/addresses/${editingId}?email=${encodeURIComponent(customerEmail)}`
        : `/api/customer/addresses?email=${encodeURIComponent(customerEmail)}`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage(`✅ Address ${editingId ? 'updated' : 'saved'} successfully!`);
        resetForm();
        await fetchAddresses();
      } else {
        const data = await response.json();
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
      const response = await fetch(`/api/customer/addresses/${addressId}/default?email=${encodeURIComponent(customerEmail)}`, {
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
      const response = await fetch(`/api/customer/addresses/${addressId}?email=${encodeURIComponent(customerEmail)}`, {
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
                  Hotel Name *
                </label>
                <input
                  type="text"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleInputChange}
                  placeholder="Hotel name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  placeholder="Room number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  House *
                </label>
                <input
                  type="text"
                  name="house"
                  value={formData.house}
                  onChange={handleInputChange}
                  placeholder="House number/name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Label *
            </label>
            <input
              type="text"
              name="label"
              value={formData.label}
              onChange={handleInputChange}
              placeholder="e.g., Home, Office, Hotel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

