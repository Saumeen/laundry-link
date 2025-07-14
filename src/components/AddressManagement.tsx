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
    setMessage(''); // Clear any previous messages
  }, []);

  // Go back to listing view
  const goBackToList = useCallback(() => {
    setCurrentView('list');
    setEditingId(null);
    setMessage(''); // Clear any previous messages
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
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await customerApi.deleteAddress(addressId);
      await parseJsonResponse(response);
      setMessage('✅ Address deleted successfully!');
      await fetchAddresses();
    } catch (error) {
      setMessage('❌ Failed to delete address');
    }
  }, [fetchAddresses]);

  // Format address for display
  const formatAddress = useCallback((address: Address) => {
    const parts = [];
    
    if (address.addressLine1) parts.push(address.addressLine1);
    if (address.addressLine2) parts.push(address.addressLine2);
    if (address.building) parts.push(`Building: ${address.building}`);
    if (address.floor) parts.push(`Floor: ${address.floor}`);
    if (address.apartment) parts.push(`Apartment: ${address.apartment}`);
    if (address.city) parts.push(address.city);
    if (address.area) parts.push(address.area);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }, []);

  // Memoize computed values
  const hasAddresses = useMemo(() => addresses.length > 0, [addresses.length]);
  const defaultAddress = useMemo(() => addresses.find(addr => addr.isDefault), [addresses]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-6">Please log in to manage your addresses</p>
          <a 
            href="/registerlogin" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Form View - Only show the form, no address list
  if (currentView === 'form') {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Form Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h2>
            <p className="text-gray-600 mt-2">
              {editingId ? 'Update your address information' : 'Create a new delivery address'}
            </p>
          </div>
          <button
            onClick={goBackToList}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Addresses</span>
          </button>
        </div>

        {/* Address Selector Component */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <AddressSelector
            onAddressSelect={() => {}} // Not used in management view
            onAddressCreate={handleAddressCreate}
            showCreateNew={true}
            className="p-8"
          />
        </div>
      </div>
    );
  }

  // List View - Only show the address list
  return (
    <div className="max-w-4xl mx-auto">
      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Addresses</h2>
          <p className="text-gray-600 mt-2">Manage your delivery addresses</p>
        </div>
        <button
          onClick={showCreateForm}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add New Address</span>
        </button>
      </div>

      {/* Addresses List */}
      <div className="space-y-4">
        {!hasAddresses ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Get started by adding your first delivery address. This will make ordering much faster!
            </p>
            <button
              onClick={showCreateForm}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white border rounded-xl p-6 hover:shadow-lg transition-all duration-200 ${
                  address.isDefault 
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-25' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <h4 className="font-semibold text-gray-900 text-xl">{address.label}</h4>
                      <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600 capitalize font-medium">
                        {address.locationType || 'residential'}
                      </span>
                      {address.isDefault && (
                        <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-semibold">
                          Default Address
                        </span>
                      )}
                    </div>
                    
                    <div className="text-gray-600 space-y-2">
                      <p className="text-base leading-relaxed">{formatAddress(address)}</p>
                      {address.landmark && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Landmark:</span> {address.landmark}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-6">
                    {/* Set Default Button */}
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-green-600 hover:text-green-800 p-3 rounded-lg hover:bg-green-50 transition-colors"
                        title="Set as default address"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-800 p-3 rounded-lg hover:bg-red-50 transition-colors"
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


