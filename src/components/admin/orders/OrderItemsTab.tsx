'use client';

import React, { useState } from 'react';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  processingStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

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
  orderItems: OrderItem[];
}

interface Order {
  orderServiceMappings: OrderServiceMapping[];
}

interface OrderItemsTabProps {
  order: Order;
  onRefresh: () => void;
}

export default function OrderItemsTab({ order }: OrderItemsTabProps) {
  const [selectedService, setSelectedService] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get all order items from all services
  const allOrderItems = order.orderServiceMappings?.flatMap(mapping => 
    mapping.orderItems?.map(item => ({
      ...item,
      serviceName: mapping.service.displayName,
      serviceId: mapping.service.id
    })) || []
  ) || [];

  // Filter items based on selected service and search term
  const filteredItems = allOrderItems.filter(item => {
    const matchesService = selectedService === 'all' || item.serviceId.toString() === selectedService;
    const matchesSearch = (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.serviceName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesService && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    if (!status) return 'Not Set';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const totalItems = allOrderItems.length;
  const totalValue = allOrderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const getItemName = (item: OrderItem) => {
    return item.name || `Item ${item.id}`;
  };

  const getItemQuantity = (item: OrderItem) => {
    return item.quantity || 0;
  };

  const getItemUnitPrice = (item: OrderItem) => {
    return item.unitPrice || 0;
  };

  const getItemTotalPrice = (item: OrderItem) => {
    return item.totalPrice || 0;
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Order Items
        </h3>
        <span className='text-sm text-gray-500'>
          {totalItems} items
        </span>
      </div>

      {/* Filters */}
      <div className='bg-gray-50 rounded-lg p-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Filter by Service
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Services</option>
              {order.orderServiceMappings?.map(mapping => (
                <option key={mapping.id} value={mapping.service.id}>
                  {mapping.service.displayName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Search Items
            </label>
            <input
              type='text'
              placeholder='Search by item name or service...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <div className='text-sm text-gray-600'>Total Items</div>
          <div className='text-2xl font-bold text-gray-900'>{totalItems}</div>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <div className='text-sm text-gray-600'>Total Value</div>
          <div className='text-2xl font-bold text-blue-600'>{totalValue.toFixed(3)} BD</div>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <div className='text-sm text-gray-600'>Services</div>
          <div className='text-2xl font-bold text-gray-900'>
            {order.orderServiceMappings?.length || 0}
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-gray-400 mb-2'>
            <svg className='mx-auto h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
            </svg>
          </div>
          <p className='text-gray-500'>No items found matching your criteria</p>
        </div>
      ) : (
        <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Item Details
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Service
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Quantity
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Unit Price
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Total
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredItems.map((item) => (
                  <tr key={item.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {getItemName(item)}
                        </div>
                        <div className='text-sm text-gray-500'>
                          ID: {item.id}
                        </div>
                        {item.notes && (
                          <div className='text-xs text-gray-400 mt-1'>
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {item.serviceName || 'Unknown Service'}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {getItemQuantity(item)}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {getItemUnitPrice(item).toFixed(3)} BD
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        {getItemTotalPrice(item).toFixed(3)} BD
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.processingStatus || '')}`}>
                        {getStatusDisplayName(item.processingStatus || '')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {filteredItems.length > 0 && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='font-semibold text-blue-900'>Filtered Results</h4>
              <p className='text-sm text-blue-700'>
                Showing {filteredItems.length} of {totalItems} items
              </p>
            </div>
            <div className='text-right'>
              <div className='text-lg font-bold text-blue-900'>
                {filteredItems.reduce((sum, item) => sum + getItemTotalPrice(item), 0).toFixed(3)} BD
              </div>
              <div className='text-sm text-blue-700'>Filtered Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 