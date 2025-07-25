'use client';

import React from 'react';

interface OrderServiceMapping {
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
}

interface Order {
  orderServiceMappings: OrderServiceMapping[];
}

interface ServicesTabProps {
  order: Order;
  onRefresh: () => void;
}

export default function ServicesTab({ order }: ServicesTabProps) {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Services Requested
        </h3>
        <span className='text-sm text-gray-500'>
          {order.orderServiceMappings?.length || 0} services
        </span>
      </div>

      {!order.orderServiceMappings || order.orderServiceMappings.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-gray-400 mb-2'>
            <svg className='mx-auto h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
            </svg>
          </div>
          <p className='text-gray-500'>No services requested for this order</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {order.orderServiceMappings.map((mapping) => (
            <div key={mapping.id} className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
              <div className='flex items-start'>
                <div className='flex-1'>
                  <h4 className='text-lg font-semibold text-gray-900 mb-1'>
                    {mapping.service.displayName}
                  </h4>
                  <p className='text-sm text-gray-600'>
                    {mapping.service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 