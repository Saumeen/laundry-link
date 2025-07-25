'use client';

import React, { useState } from 'react';
import { formatUTCForDisplay } from '@/lib/utils/timezone';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
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
  invoiceTotal?: number;
  minimumOrderApplied?: boolean;
  specialInstructions?: string;
}

interface InvoiceTabProps {
  order: Order;
  onRefresh: () => void;
}

export default function InvoiceTab({ order }: InvoiceTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const calculateSubtotal = () => {
    if (!order.orderServiceMappings) return 0;
    return order.orderServiceMappings.reduce((total, mapping) => {
      // Calculate from order items if available, otherwise fall back to service mapping
      if (mapping.orderItems && mapping.orderItems.length > 0) {
        const itemsTotal = mapping.orderItems.reduce((itemTotal, item) => {
          return itemTotal + item.totalPrice;
        }, 0);
        return total + itemsTotal;
      } else {
        return 0;
      }
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const total = order.invoiceTotal || subtotal;
  const discount = subtotal - total;

  const handleGenerateInvoice = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/admin/generate-invoice-pdf/${order.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${order.orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendInvoice = async () => {
    try {
      const response = await fetch(`/api/admin/send-invoice/${order.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Invoice sent successfully!');
      } else {
        alert('Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Error sending invoice');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Invoice Details
        </h3>
        <div className='flex space-x-2'>
          <button
            onClick={handleGenerateInvoice}
            disabled={isGenerating}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            onClick={handleSendInvoice}
            className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
          >
            Send to Customer
          </button>
        </div>
      </div>

      {/* Invoice Header */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <h4 className='text-lg font-semibold text-gray-900 mb-4'>Invoice Information</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Invoice Number:</span>
                <span className='font-medium'>INV-{order.orderNumber}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Order Number:</span>
                <span className='font-medium'>{order.orderNumber}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Issue Date:</span>
                <span className='font-medium'>{formatUTCForDisplay(order.createdAt)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Status:</span>
                <span className='font-medium'>{order.status}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className='text-lg font-semibold text-gray-900 mb-4'>Customer Information</h4>
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
              {order.address && (
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Address:</span>
                  <span className='font-medium text-right max-w-xs'>
                    {order.address.addressLine1}
                    {order.address.addressLine2 && `, ${order.address.addressLine2}`}
                    {order.address.city && `, ${order.address.city}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h4 className='text-lg font-semibold text-gray-900'>Invoice Items</h4>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Item
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Type & Notes
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
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {order.orderServiceMappings?.map((mapping) => {
                // If order items exist, display them individually
                if (mapping.orderItems && mapping.orderItems.length > 0) {
                  return mapping.orderItems.map((item) => (
                    <tr key={`${mapping.id}-${item.id}`}>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>
                          {item.itemName}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {mapping.service.displayName}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-900'>
                          {item.itemType}
                        </div>
                        {item.notes && (
                          <div className='text-xs text-gray-500 mt-1'>
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {item.quantity}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {item.pricePerItem.toFixed(3)} BD
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>
                          {item.totalPrice.toFixed(3)} BD
                        </div>
                      </td>
                    </tr>
                  ));
                } else {
                  // Fallback to service mapping if no order items
                  return (
                    <tr key={mapping.id}>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>
                          {mapping.service.displayName}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-900'>
                          {mapping.service.description}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {mapping.quantity} {mapping.service.unit}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {mapping.price.toFixed(3)} BD
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>
                          {(mapping.quantity * mapping.price).toFixed(3)} BD
                        </div>
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Summary */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <div className='flex justify-end'>
          <div className='w-full max-w-md'>
            <div className='space-y-3'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>Subtotal:</span>
                <span className='font-medium'>{subtotal.toFixed(3)} BD</span>
              </div>
              {discount > 0 && (
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Discount:</span>
                  <span className='font-medium text-green-600'>-{discount.toFixed(3)} BD</span>
                </div>
              )}
              {order.minimumOrderApplied && (
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Minimum Order Applied:</span>
                  <span className='font-medium text-blue-600'>Yes</span>
                </div>
              )}
              <div className='border-t border-gray-200 pt-3'>
                <div className='flex justify-between text-lg font-bold'>
                  <span>Total:</span>
                  <span className='text-blue-600'>{total.toFixed(3)} BD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <h4 className='font-semibold text-yellow-900 mb-2'>Special Instructions</h4>
          <p className='text-yellow-800'>{order.specialInstructions}</p>
        </div>
      )}

      {/* Payment Information */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h4 className='text-lg font-semibold text-gray-900 mb-4'>Payment Information</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Payment Status:</span>
                <span className='font-medium'>Pending</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Payment Method:</span>
                <span className='font-medium'>Not specified</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Due Date:</span>
                <span className='font-medium'>Upon delivery</span>
              </div>
            </div>
          </div>
          <div>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Invoice Generated:</span>
                <span className='font-medium'>No</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Sent to Customer:</span>
                <span className='font-medium'>No</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Last Updated:</span>
                <span className='font-medium'>{formatUTCForDisplay(order.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 