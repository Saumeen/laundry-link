'use client';

import React, { useCallback } from 'react';
import { 
  formatUTCForDisplay, 
  formatUTCForDateDisplay, 
  formatUTCForTimeDisplay 
} from '@/lib/utils/timezone';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  pickupTime: string;
  deliveryTime: string;
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

interface OrderOverviewTabProps {
  order: Order;
  onRefresh: () => void;
}

export default function OrderOverviewTab({ order }: OrderOverviewTabProps) {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <div className='space-y-6'>
      {/* Order Information */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-gray-50 rounded-lg p-4'>
          <h3 className='font-semibold text-gray-900 mb-3'>
            Order Information
          </h3>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Order Number:</span>
              <span className='font-medium'>{order.orderNumber}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Status:</span>
              <span className='font-medium'>{order.status}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Pickup Date:</span>
              <span className='font-medium'>
                {formatUTCForDateDisplay(order.pickupTime, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Pickup Time:</span>
              <span className='font-medium'>
                {order.pickupTimeSlot || formatUTCForTimeDisplay(order.pickupTime)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Delivery Date:</span>
              <span className='font-medium'>
                {formatUTCForDateDisplay(order.deliveryTime, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Delivery Time:</span>
              <span className='font-medium'>
                {order.deliveryTimeSlot || formatUTCForTimeDisplay(order.deliveryTime)}
              </span>
            </div>
          </div>
        </div>

        <div className='bg-gray-50 rounded-lg p-4'>
          <h3 className='font-semibold text-gray-900 mb-3'>
            Customer Information
          </h3>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Name:</span>
              <span className='font-medium'>
                {order.customer.firstName} {order.customer.lastName}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Email:</span>
              <span className='font-medium'>{order.customer.email}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Phone:</span>
              <span className='font-medium'>{order.customer.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      {order.address && (
        <div className='bg-gray-50 rounded-lg p-4'>
          <h3 className='font-semibold text-gray-900 mb-3'>Delivery Address</h3>
          <div className='space-y-2'>
            <p className='text-gray-700 font-medium'>{order.address.label}</p>
            <p className='text-gray-700'>{order.address.addressLine1}</p>
            {order.address.addressLine2 && (
              <p className='text-gray-700'>{order.address.addressLine2}</p>
            )}
            <p className='text-gray-700'>{order.address.city}</p>
            {order.address.area && (
              <p className='text-gray-600 text-sm'>
                Area: {order.address.area}
              </p>
            )}
            {order.address.building && (
              <p className='text-gray-600 text-sm'>
                Building: {order.address.building}
              </p>
            )}
            {order.address.floor && (
              <p className='text-gray-600 text-sm'>
                Floor/Room: {order.address.floor}
              </p>
            )}
            {order.address.apartment && (
              <p className='text-gray-600 text-sm'>
                Apartment/Office: {order.address.apartment}
              </p>
            )}
            {order.address.contactNumber && (
              <p className='text-gray-600 text-sm'>
                Contact: {order.address.contactNumber}
              </p>
            )}
            {order.address.locationType && (
              <p className='text-gray-600 text-sm'>
                Type: {order.address.locationType}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Services Requested */}
      {order.orderServiceMappings && order.orderServiceMappings.length > 0 && (
        <div className='bg-gray-50 rounded-lg p-4'>
          <h3 className='font-semibold text-gray-900 mb-3'>
            Services Requested
          </h3>
          <div className='space-y-2'>
            {order.orderServiceMappings.map(mapping => (
              <div
                key={mapping.id}
                className='flex justify-between items-center'
              >
                <span className='text-gray-700'>
                  {mapping.service.displayName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <h3 className='font-semibold text-gray-900 mb-2'>
            Special Instructions
          </h3>
          <p className='text-gray-700'>{order.specialInstructions}</p>
        </div>
      )}
    </div>
  );
} 