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
  const calculateServiceTotal = (mapping: OrderServiceMapping) => {
    return mapping.quantity * mapping.price;
  };

  const getTotalItems = (mapping: OrderServiceMapping) => {
    return mapping.orderItems?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
  };

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
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <h4 className='text-lg font-semibold text-gray-900 mb-1'>
                    {mapping.service.displayName}
                  </h4>
                  <p className='text-sm text-gray-600 mb-2'>
                    {mapping.service.description}
                  </p>
                  <div className='flex items-center space-x-4 text-sm text-gray-500'>
                    <span>Service ID: {mapping.service.id}</span>
                    <span>Unit: {mapping.service.unit}</span>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {calculateServiceTotal(mapping).toFixed(3)} BD
                  </div>
                  <div className='text-sm text-gray-500'>
                    {mapping.quantity} × {mapping.price.toFixed(3)} BD
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100'>
                <div className='text-center'>
                  <div className='text-sm text-gray-600'>Quantity</div>
                  <div className='text-lg font-semibold text-gray-900'>
                    {mapping.quantity}
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-sm text-gray-600'>Unit Price</div>
                  <div className='text-lg font-semibold text-gray-900'>
                    {mapping.price.toFixed(3)} BD
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-sm text-gray-600'>Total Items</div>
                  <div className='text-lg font-semibold text-gray-900'>
                    {getTotalItems(mapping)}
                  </div>
                </div>
              </div>

              {mapping.orderItems && mapping.orderItems.length > 0 && (
                <div className='mt-4 pt-4 border-t border-gray-100'>
                  <h5 className='font-medium text-gray-900 mb-3'>Order Items</h5>
                  <div className='space-y-2'>
                    {mapping.orderItems.map((item, index) => (
                      <div key={index} className='flex justify-between items-center text-sm'>
                        <span className='text-gray-600'>
                          {item.name || `Item ${item.id || index + 1}`}
                        </span>
                        <span className='font-medium'>
                          {item.quantity || 0} × {(item.unitPrice || 0).toFixed(3)} BD
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {order.orderServiceMappings && order.orderServiceMappings.length > 0 && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='font-semibold text-blue-900'>Order Summary</h4>
              <p className='text-sm text-blue-700'>
                Total services: {order.orderServiceMappings.length}
              </p>
            </div>
            <div className='text-right'>
              <div className='text-lg font-bold text-blue-900'>
                {order.orderServiceMappings
                  .reduce((total, mapping) => total + calculateServiceTotal(mapping), 0)
                  .toFixed(3)} BD
              </div>
              <div className='text-sm text-blue-700'>Total Amount</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 