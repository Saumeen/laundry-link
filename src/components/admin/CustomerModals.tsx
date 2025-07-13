"use client";

import { useState, useEffect, useCallback } from "react";

interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  walletBalance: number;
  createdAt: string;
  updatedAt: string;
  addresses: Address[];
  _count: {
    orders: number;
  };
}

interface Address {
  id: number;
  label: string;
  addressLine1: string;
  city: string;
  isDefault: boolean;
}

interface EditCustomerModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerId: number, updates: any) => Promise<void>;
}

interface CustomerDetailsModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onEditAddress: (addressId: number, updates: any) => Promise<void>;
  onDeleteAddress: (addressId: number) => Promise<void>;
}

interface ResetPasswordModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onResetPassword: (customerId: number, newPassword?: string) => Promise<void>;
}

// Edit Customer Modal
export function EditCustomerModal({ customer, isOpen, onClose, onSave }: EditCustomerModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || '',
        isActive: customer.isActive,
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setLoading(true);
    setMessage('');

    try {
      await onSave(customer.id, formData);
      setMessage('Customer updated successfully!');
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 1500);
    } catch (error) {
      setMessage('Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Customer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.includes('successfully') 
              ? 'bg-green-100 text-green-700 border border-green-400' 
              : 'bg-red-100 text-red-700 border border-red-400'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active Account
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Customer Details Modal
export function CustomerDetailsModal({ customer, isOpen, onClose, onEditAddress, onDeleteAddress }: CustomerDetailsModalProps) {
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [addressUpdates, setAddressUpdates] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleEditAddress = async (addressId: number) => {
    setLoading(true);
    setMessage('');

    try {
      await onEditAddress(addressId, addressUpdates);
      setMessage('Address updated successfully!');
      setEditingAddress(null);
      setAddressUpdates({});
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setLoading(true);
    setMessage('');

    try {
      await onDeleteAddress(addressId);
      setMessage('Address deleted successfully!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Customer Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.includes('successfully') 
              ? 'bg-green-100 text-green-700 border border-green-400' 
              : 'bg-red-100 text-red-700 border border-red-400'
          }`}>
            {message}
          </div>
        )}

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p className="font-medium">{customer.firstName} {customer.lastName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-medium">{customer.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone:</span>
                <p className="font-medium">{customer.phone || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  customer.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Wallet Balance:</span>
                <p className="font-medium text-green-600">${customer.walletBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Account Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Customer ID:</span>
                <p className="font-medium">#{customer.id}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Total Orders:</span>
                <p className="font-medium">{customer._count.orders}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Total Addresses:</span>
                <p className="font-medium">{customer.addresses.length}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Joined:</span>
                <p className="font-medium">{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Last Updated:</span>
                <p className="font-medium">{new Date(customer.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Addresses</h3>
          {customer.addresses.length === 0 ? (
            <p className="text-gray-500">No addresses found</p>
          ) : (
            <div className="space-y-4">
              {customer.addresses.map((address) => (
                <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{address.label}</h4>
                      {address.isDefault && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {editingAddress === address.id ? (
                        <>
                          <button
                            onClick={() => handleEditAddress(address.id)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingAddress(null);
                              setAddressUpdates({});
                            }}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingAddress(address.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          {!address.isDefault && (
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {editingAddress === address.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Label"
                        value={addressUpdates.label || address.label}
                        onChange={(e) => setAddressUpdates({ ...addressUpdates, label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Address"
                        value={addressUpdates.addressLine1 || address.addressLine1}
                        onChange={(e) => setAddressUpdates({ ...addressUpdates, addressLine1: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={addressUpdates.city || address.city}
                        onChange={(e) => setAddressUpdates({ ...addressUpdates, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <p>{address.addressLine1}</p>
                      <p>{address.city}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Reset Password Modal
export function ResetPasswordModal({ customer, isOpen, onClose, onResetPassword }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    if (!autoGenerate) {
      if (newPassword.length < 6) {
        setMessage('Password must be at least 6 characters long');
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    setMessage('');

    try {
      await onResetPassword(customer.id, autoGenerate ? undefined : newPassword);
      setMessage('Password reset successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 1500);
    } catch (error) {
      setMessage('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Reset Password</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">
            Reset password for <strong>{customer.firstName} {customer.lastName}</strong> ({customer.email})
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.includes('successfully') 
              ? 'bg-green-100 text-green-700 border border-green-400' 
              : 'bg-red-100 text-red-700 border border-red-400'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoGenerate"
              checked={autoGenerate}
              onChange={(e) => setAutoGenerate(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoGenerate" className="ml-2 block text-sm text-gray-900">
              Auto-generate password (customer will receive activation email)
            </label>
          </div>

          {!autoGenerate && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 