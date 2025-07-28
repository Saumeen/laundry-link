'use client';

import { Service } from '@/types/schedule';
import { Address } from '@/types/schedule';

interface OrderSummaryProps {
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null;
  selectedAddress: Address | undefined;
  services: Service[];
  selectedServices: string[];
  pickupDate: string;
  deliveryDate: string;
  pickupTimeSlot: string;
  deliveryTimeSlot: string;
  specialInstructions: string;
  onSpecialInstructionsChange: (value: string) => void;
  isExpressService?: boolean;
}

export default function OrderSummary({
  customerData,
  selectedAddress,
  services,
  selectedServices,
  pickupDate,
  deliveryDate,
  pickupTimeSlot,
  deliveryTimeSlot,
  specialInstructions,
  onSpecialInstructionsChange,
  isExpressService = false,
}: OrderSummaryProps) {
  // Get time slot display text
  const getTimeSlotDisplay = (slotId: string) => {
    // Parse the slot ID format: "09-00-12-00" -> "09:00 - 12:00"
    if (slotId && slotId.includes('-')) {
      const parts = slotId.split('-');
      if (parts.length === 4) {
        const startHour = parts[0];
        const startMinute = parts[1];
        const endHour = parts[2];
        const endMinute = parts[3];
        return `${startHour}:${startMinute} - ${endHour}:${endMinute}`;
      }
    }
    return slotId || 'Not selected';
  };

  return (
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold text-gray-900'>Confirm Details</h2>
      <p className='text-gray-600'>Review your order before confirming</p>

      {/* Customer Information */}
      {customerData && (
        <div className='bg-gray-50 rounded-lg p-4'>
          <h3 className='font-medium text-gray-900 mb-3'>
            Customer Information
          </h3>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-gray-600'>Name:</span>{' '}
              {customerData.firstName} {customerData.lastName}
            </div>
            <div>
              <span className='text-gray-600'>Email:</span> {customerData.email}
            </div>
            <div>
              <span className='text-gray-600'>Phone:</span>{' '}
              {selectedAddress?.contactNumber || customerData.phone}
            </div>
          </div>
        </div>
      )}

      {/* Address Information */}
      {selectedAddress && (
        <div className='bg-gray-50 rounded-lg p-4'>
          <h3 className='font-medium text-gray-900 mb-3'>Pickup Address</h3>
          <div className='text-sm'>
            <div className='mb-1'>
              <span className='text-gray-600'>Address:</span>{' '}
              {selectedAddress.label}
            </div>
            {selectedAddress.locationType && (
              <div className='mb-1'>
                <span className='text-gray-600'>Type:</span>{' '}
                {selectedAddress.locationType.charAt(0).toUpperCase() +
                  selectedAddress.locationType.slice(1)}
              </div>
            )}
            {selectedAddress.contactNumber && (
              <div>
                <span className='text-gray-600'>Contact:</span>{' '}
                {selectedAddress.contactNumber}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time Information */}
      <div className='bg-gray-50 rounded-lg p-4'>
        <h3 className='font-medium text-gray-900 mb-3'>Schedule</h3>
        {isExpressService ? (
          <div className='space-y-2 text-sm'>
            <div className='flex items-center space-x-2'>
              <span className='text-green-600 font-semibold'>
                🚀 Express Service
              </span>
            </div>
            <div className='text-green-700 font-medium'>
              Delivery in 6 hours
            </div>
            <div className='grid grid-cols-2 gap-4 text-gray-600'>
              <div>
                <span className='text-gray-600'>Pickup:</span>{' '}
                {new Date().toLocaleString('en-US', {
                  timeZone: 'Asia/Bahrain',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </div>
              <div>
                <span className='text-gray-600'>Delivery:</span>{' '}
                {new Date(Date.now() + 6 * 60 * 60 * 1000).toLocaleString(
                  'en-US',
                  {
                    timeZone: 'Asia/Bahrain',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-gray-600'>Pickup:</span> {pickupDate} at{' '}
              {getTimeSlotDisplay(pickupTimeSlot)}
            </div>
            <div>
              <span className='text-gray-600'>Delivery:</span> {deliveryDate} at{' '}
              {getTimeSlotDisplay(deliveryTimeSlot)}
            </div>
          </div>
        )}
      </div>

      {/* Selected Services */}
      {selectedServices.length > 0 && (
        <div className='bg-gray-50 rounded-lg p-4'>
          <h3 className='font-medium text-gray-900 mb-3'>Selected Services</h3>
          <div className='space-y-2'>
            {selectedServices.map(serviceId => {
              const service = services.find(s => s.id.toString() === serviceId);
              return (
                <div
                  key={serviceId}
                  className='flex items-center space-x-3 text-sm'
                >
                  <span className='text-lg'>{service?.icon}</span>
                  <div>
                    <div className='font-medium'>
                      {service?.displayName || serviceId}
                    </div>
                    <div className='text-gray-600'>{service?.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Special Instructions */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Special Instructions (Optional)
        </label>
        <textarea
          value={specialInstructions}
          onChange={e => onSpecialInstructionsChange(e.target.value)}
          rows={3}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholder='Any special instructions for pickup or delivery...'
        />
      </div>
    </div>
  );
}
