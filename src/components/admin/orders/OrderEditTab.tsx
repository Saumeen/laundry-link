'use client';

import { useOrderEditStore } from '@/admin/stores/orderEditStore';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import StatusTransitionSelect from './StatusTransitionSelect';
import {
  convertBahrainToUTC,
  convertUTCToBahrainDateTimeLocal,
} from '@/lib/utils/timezone';
import React, { useCallback, useEffect, useState } from 'react';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  pickupTime: string;
  deliveryTime: string;
  pickupStartTime: string;
  pickupEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  pickupTimeSlot?: string;
  deliveryTimeSlot?: string;
  createdAt: string;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  address?: {
    id: number;
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    area?: string;
    building?: string;
    floor?: string;
    apartment?: string;
    contactNumber?: string;
    locationType?: string;
    latitude?: number;
    longitude?: number;
  };
  orderServiceMappings: Array<{
    id: number;
    serviceId: number;
    quantity: number;
    price: number;
    service: {
      id: number;
      name: string;
      displayName: string;
      description: string;
      price: number;
      unit: string;
    };
    orderItems: any[];
  }>;
  specialInstructions?: string;
}

interface OrderEditTabProps {
  order: Order;
  onUpdate: () => void;
}

export default function OrderEditTab({ order, onUpdate }: OrderEditTabProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(false);

  // Use Zustand store for form state
  const {
    status,
    specialInstructions,
    addressLabel,
    addressLine1,
    addressLine2,
    city,
    area,
    building,
    floor,
    apartment,
    contactNumber,
    locationType,
    setStatus,
    setSpecialInstructions,
    setAddressLabel,
    setAddressLine1,
    setAddressLine2,
    setCity,
    setArea,
    setBuilding,
    setFloor,
    setApartment,
    setContactNumber,
    setLocationType,
    initializeForm,
    getFormData,
  } = useOrderEditStore();

  // Local state for time slot pickers - completely separate from Zustand
  const [localPickupStartTime, setLocalPickupStartTime] = useState(
    order.pickupStartTime
      ? convertUTCToBahrainDateTimeLocal(order.pickupStartTime)
      : ''
  );
  const [localPickupEndTime, setLocalPickupEndTime] = useState(
    order.pickupEndTime
      ? convertUTCToBahrainDateTimeLocal(order.pickupEndTime)
      : ''
  );
  const [localDeliveryStartTime, setLocalDeliveryStartTime] = useState(
    order.deliveryStartTime
      ? convertUTCToBahrainDateTimeLocal(order.deliveryStartTime)
      : ''
  );
  const [localDeliveryEndTime, setLocalDeliveryEndTime] = useState(
    order.deliveryEndTime
      ? convertUTCToBahrainDateTimeLocal(order.deliveryEndTime)
      : ''
  );

  // Initialize form when component mounts
  useEffect(() => {
    initializeForm(order);
    setLocalPickupStartTime(
      order.pickupStartTime
        ? convertUTCToBahrainDateTimeLocal(order.pickupStartTime)
        : ''
    );
    setLocalPickupEndTime(
      order.pickupEndTime
        ? convertUTCToBahrainDateTimeLocal(order.pickupEndTime)
        : ''
    );
    setLocalDeliveryStartTime(
      order.deliveryStartTime
        ? convertUTCToBahrainDateTimeLocal(order.deliveryStartTime)
        : ''
    );
    setLocalDeliveryEndTime(
      order.deliveryEndTime
        ? convertUTCToBahrainDateTimeLocal(order.deliveryEndTime)
        : ''
    );
  }, [order, initializeForm]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  }, []);

  const handleConfirmUpdate = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Convert Bahrain time to UTC for API submission
    const convertToUTC = (bahrainDateTime: string) => {
      if (!bahrainDateTime) return '';
      const [date, time] = bahrainDateTime.split('T');
      return convertBahrainToUTC(date, time);
    };

    // Get current form data from Zustand store and add local time slot values
    const formData = {
      ...getFormData(),
      pickupStartTime: convertToUTC(localPickupStartTime),
      pickupEndTime: convertToUTC(localPickupEndTime),
      deliveryStartTime: convertToUTC(localDeliveryStartTime),
      deliveryEndTime: convertToUTC(localDeliveryEndTime),
      sendEmailNotification,
    };

    try {
      const response = await fetch(`/api/admin/update-order/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onUpdate();
        showToast('Order updated successfully', 'success');
        setShowConfirmModal(false);
      } else {
        setError('Failed to update order');
      }
    } catch (error) {
      setError('Failed to update order');
    } finally {
      setLoading(false);
    }
  }, [
    order.id,
    getFormData,
    localPickupStartTime,
    localPickupEndTime,
    localDeliveryStartTime,
    localDeliveryEndTime,
    sendEmailNotification,
    onUpdate,
  ]);

  return (
    <div className='max-w-4xl'>
      <h3 className='text-lg font-semibold text-gray-900 mb-6'>
        Edit Order Details
      </h3>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
            {error}
          </div>
        )}

        {/* Order Information Section */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <h4 className='font-medium text-gray-900 mb-4'>
            Edit Order Information
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Order Status
              </label>
              <StatusTransitionSelect
                currentStatus={order.status}
                value={status}
                onChange={setStatus}
                disabled={loading}
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Special Instructions
              </label>
              <textarea
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Any special instructions for this order...'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Pickup Time Slot
              </label>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>
                    Start Time
                  </label>
                  <input
                    type='datetime-local'
                    value={localPickupStartTime}
                    onChange={e => setLocalPickupStartTime(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>
                    End Time
                  </label>
                  <input
                    type='datetime-local'
                    value={localPickupEndTime}
                    onChange={e => setLocalPickupEndTime(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Delivery Time Slot
              </label>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>
                    Start Time
                  </label>
                  <input
                    type='datetime-local'
                    value={localDeliveryStartTime}
                    onChange={e => setLocalDeliveryStartTime(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>
                    End Time
                  </label>
                  <input
                    type='datetime-local'
                    value={localDeliveryEndTime}
                    onChange={e => setLocalDeliveryEndTime(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <h4 className='font-medium text-gray-900 mb-4'>Delivery Address</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Address Label
              </label>
              <input
                type='text'
                value={addressLabel}
                onChange={e => setAddressLabel(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='e.g., Home, Office, Hotel'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Location Type
              </label>
              <select
                value={locationType}
                onChange={e => setLocationType(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='home'>Home</option>
                <option value='flat'>Flat/Apartment</option>
                <option value='office'>Office</option>
                <option value='hotel'>Hotel</option>
              </select>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Address Line 1
              </label>
              <input
                type='text'
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Street address, building name, etc.'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Address Line 2
              </label>
              <input
                type='text'
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Apartment, suite, unit, etc.'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                City
              </label>
              <input
                type='text'
                value={city}
                onChange={e => setCity(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='City'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Area/Road
              </label>
              <input
                type='text'
                value={area}
                onChange={e => setArea(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Area or road name'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Building
              </label>
              <input
                type='text'
                value={building}
                onChange={e => setBuilding(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Building name or number'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Floor/Room
              </label>
              <input
                type='text'
                value={floor}
                onChange={e => setFloor(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Floor or room number'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Apartment/Office
              </label>
              <input
                type='text'
                value={apartment}
                onChange={e => setApartment(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Apartment or office number'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Contact Number
              </label>
              <input
                type='text'
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Contact number for delivery'
              />
            </div>
          </div>
        </div>

        <div className='flex justify-end space-x-3'>
          <button
            type='button'
            onClick={() => {
              // Reset form to original order data
              initializeForm(order);
              setLocalPickupStartTime(
                order.pickupStartTime
                  ? convertUTCToBahrainDateTimeLocal(order.pickupStartTime)
                  : ''
              );
              setLocalPickupEndTime(
                order.pickupEndTime
                  ? convertUTCToBahrainDateTimeLocal(order.pickupEndTime)
                  : ''
              );
              setLocalDeliveryStartTime(
                order.deliveryStartTime
                  ? convertUTCToBahrainDateTimeLocal(order.deliveryStartTime)
                  : ''
              );
              setLocalDeliveryEndTime(
                order.deliveryEndTime
                  ? convertUTCToBahrainDateTimeLocal(order.deliveryEndTime)
                  : ''
              );
              setError(null);
            }}
            className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={loading}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
          >
            {loading ? 'Updating...' : 'Update Order'}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title='Confirm Order Update'
        footer={
          <div className='flex justify-end space-x-3'>
            <button
              type='button'
              onClick={() => setShowConfirmModal(false)}
              className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleConfirmUpdate}
              disabled={loading}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
            >
              {loading ? 'Updating...' : 'Confirm Update'}
            </button>
          </div>
        }
      >
        <p className='text-gray-600 mb-4'>
          Are you sure you want to update this order? Please review your changes
          before proceeding.
        </p>

        <div className='mb-4'>
          <label className='flex items-center space-x-2'>
            <input
              type='checkbox'
              checked={sendEmailNotification}
              onChange={e => setSendEmailNotification(e.target.checked)}
              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            />
            <span className='text-sm font-medium text-gray-700'>
              Send email notification to customer
            </span>
          </label>
          <p className='text-xs text-gray-500 mt-1 ml-6'>
            Check this if you want to inform the customer about order changes
          </p>
        </div>
      </Modal>
    </div>
  );
}
