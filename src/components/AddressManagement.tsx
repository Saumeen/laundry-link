import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import AddressSelector from './AddressSelector';
import { customerApi, parseJsonResponse } from '@/lib/api';

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
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // View state - 'list' or 'form'
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');

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

  // Show form for creating new address
  const showCreateForm = useCallback(() => {
    setCurrentView('form');
  }, []);

  // Go back to listing view
  const goBackToList = useCallback(() => {
    setCurrentView('list');
    setEditingId(null);
  }, []);

  // Handle address creation from AddressSelector
  const handleAddressCreate = useCallback((newAddress: Address) => {
    setMessage('✅ Address created successfully!');
    fetchAddresses();
    setCurrentView('list');
  }, [fetchAddresses]);

  // Set default address
  const handleSetDefault = useCallback(async (addressId: number) => {
    try {
      const response = await customerApi.setDefaultAddress(addressId);
      await parseJsonResponse(response);
      setMessage('✅ Default address updated!');
      await fetchAddresses();
    } catch (error) {
      setMessage('❌ Failed to set default address');
    }
  }, [fetchAddresses]);

  // Delete address
  const handleDelete = useCallback(async (addressId: number) => {
    if (!confirm('Delete this address?')) return;

    try {
      const response = await customerApi.deleteAddress(addressId);
      await parseJsonResponse(response);
      setMessage('✅ Address deleted!');
      await fetchAddresses();
    } catch (error) {
      setMessage('❌ Failed to delete address');
    }
  }, [fetchAddresses]);

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

  // Memoize computed values
  const hasAddresses = useMemo(() => addresses.length > 0, [addresses.length]);
  const defaultAddress = useMemo(() => addresses.find(addr => addr.isDefault), [addresses]);

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

  // Form View - Using AddressSelector
  if (currentView === 'form') {
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

        {/* Form Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button
            onClick={goBackToList}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Addresses</span>
          </button>
        </div>

        {/* Address Selector Component */}
        <AddressSelector
          onAddressSelect={() => {}} // Not used in management view
          onAddressCreate={handleAddressCreate}
          showCreateNew={true}
          className="bg-white rounded-lg border border-gray-200 p-6"
        />
      </div>
    );
  }

  // List View
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Addresses</h2>
          <p className="text-gray-600 mt-1">Manage your delivery addresses</p>
        </div>
        <button
          onClick={showCreateForm}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create Address</span>
        </button>
      </div>

      {/* Addresses List */}
      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first address.</p>
            <div className="mt-6">
              <button
                onClick={showCreateForm}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Address
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white border rounded-lg p-6 hover:shadow-md transition-shadow ${
                  address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="font-semibold text-gray-900 text-lg">{address.label}</h4>
                      <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600 capitalize">
                        {address.locationType || 'flat'}
                      </span>
                      {address.isDefault && (
                        <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-600 font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    
                    <div className="text-gray-600 space-y-1">
                      <p className="text-sm">{formatAddress(address)}</p>
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
                    {/* Set Default Button */}
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
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
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                      title="Delete address"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


