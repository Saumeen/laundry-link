'use client';

import { useState, useEffect } from 'react';
import { customerApi } from '@/lib/api';
import PhoneInput from './PhoneInput';

interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  wallet?: {
    balance: number;
    currency: string;
  };
  createdAt?: string;
}

interface ApiResponse {
  success: boolean;
  customer?: Customer;
  error?: string;
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onProfileUpdated: (updatedCustomer: Customer) => void;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  customer,
  onProfileUpdated,
}: ProfileEditModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form data when customer data changes
  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        phone: customer.phone || '',
      });
    }
  }, [customer]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await customerApi.updateProfile(formData);
      const result = (await response.json()) as ApiResponse;

      if (response.ok && result.success && result.customer) {
        setSuccess('Profile updated successfully!');
        onProfileUpdated(result.customer);

        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold text-gray-900 flex items-center'>
              <span className='mr-3'>✏️</span>
              Edit Profile
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='px-6 py-6'>
          {/* Success Message */}
          {success && (
            <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
              <p className='text-green-700 text-sm'>{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-700 text-sm'>{error}</p>
            </div>
          )}

          {/* Email (Read-only) */}
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Email Address
            </label>
            <input
              type='email'
              value={customer?.email || ''}
              disabled
              className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Email cannot be changed
            </p>
          </div>

          {/* First Name */}
          <div className='mb-4'>
            <label
              htmlFor='firstName'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              First Name *
            </label>
            <input
              type='text'
              id='firstName'
              name='firstName'
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
              placeholder='Enter your first name'
            />
          </div>

          {/* Last Name */}
          <div className='mb-4'>
            <label
              htmlFor='lastName'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Last Name *
            </label>
            <input
              type='text'
              id='lastName'
              name='lastName'
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
              placeholder='Enter your last name'
            />
          </div>

          {/* Phone Number */}
          <div className='mb-6'>
            <PhoneInput
              value={formData.phone}
              onChange={value =>
                setFormData(prev => ({ ...prev, phone: value }))
              }
              placeholder='Enter your phone number'
              label='Phone Number'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Optional - for delivery notifications
            </p>
          </div>

          {/* Action Buttons */}
          <div className='flex space-x-3'>
            <button
              type='button'
              onClick={onClose}
              disabled={loading}
              className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={
                loading ||
                !formData.firstName.trim() ||
                !formData.lastName.trim()
              }
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
            >
              {loading ? (
                <>
                  <svg
                    className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
