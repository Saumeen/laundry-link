'use client';

import { useState, useEffect } from 'react';
import { calculateInvoiceItemTotal } from "@/lib/calculations";

interface InvoiceItem {
  id: number;
  itemType: string;
  serviceType: string;
  quantity: number;
  pricePerItem: number;
}

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
  contactNumber?: string;
  locationType?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

interface OrderDetails {
  id: number;
  orderNumber: string;
  status: string;
  pickupTime: string;
  serviceType: string;
  createdAt: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  specialInstructions?: string;
  minimumOrderApplied: boolean;
  invoiceTotal: number;
  invoiceItems: InvoiceItem[];
  address?: Address;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

export default function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/customer/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json() as { order: OrderDetails };
        setOrderDetails(data.order);
      } else {
        const errorData = await response.json() as { error?: string };
        setError(errorData.error || 'Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Order Placed': 'bg-blue-100 text-blue-800',
      'Picked Up': 'bg-yellow-100 text-yellow-800',
      'In Process': 'bg-purple-100 text-purple-800',
      'Ready for Delivery': 'bg-green-100 text-green-800',
      'Delivered': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getServiceTypeLabel = (serviceType: string) => {
    const serviceTypes: { [key: string]: string } = {
      'wash_and_fold': 'Wash & Fold',
      'dry_clean': 'Dry Clean',
      'iron_only': 'Iron Only',
      'express': 'Express Service',
    };
    return serviceTypes[serviceType] || serviceType;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchOrderDetails}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {orderDetails && !loading && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Order #{orderDetails.orderNumber}
                    </h3>
                    <p className="text-gray-600">
                      Placed on {formatDate(orderDetails.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(orderDetails.status)}`}>
                      {orderDetails.status}
                    </span>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {orderDetails?.invoiceTotal?.toFixed(3)} BD
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Type:</span>
                      <span className="font-medium">{getServiceTypeLabel(orderDetails.serviceType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pickup Time:</span>
                      <span className="font-medium">{formatDate(orderDetails.pickupTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">{orderDetails.status}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{orderDetails.customerFirstName} {orderDetails.customerLastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{orderDetails.customerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{orderDetails.customerPhone}</span>
                    </div>
                    {orderDetails.address?.contactNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address Phone:</span>
                        <span className="font-medium">{orderDetails.address.contactNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Delivery Address</h4>
                {orderDetails.address ? (
                  <div className="space-y-2">
                    <p className="text-gray-700 font-medium">{orderDetails.address.label}</p>
                    <p className="text-gray-700">{orderDetails.address.address || orderDetails.address.addressLine1}</p>
                    {orderDetails.address.addressLine2 && (
                      <p className="text-gray-700">{orderDetails.address.addressLine2}</p>
                    )}
                    <p className="text-gray-700">{orderDetails.address.city}</p>
                    {orderDetails.address.contactNumber && (
                      <p className="text-gray-600 text-sm">Contact: {orderDetails.address.contactNumber}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-700">{orderDetails.customerAddress}</p>
                )}
              </div>

              {/* Invoice Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Order Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-medium text-gray-700">Item Type</th>
                        <th className="text-left py-2 font-medium text-gray-700">Service</th>
                        <th className="text-center py-2 font-medium text-gray-700">Quantity</th>
                        <th className="text-right py-2 font-medium text-gray-700">Price/Item</th>
                        <th className="text-right py-2 font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.invoiceItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-3 text-gray-900">{item.itemType}</td>
                          <td className="py-3 text-gray-900">{getServiceTypeLabel(item.serviceType)}</td>
                          <td className="py-3 text-center text-gray-900">{item.quantity}</td>
                          <td className="py-3 text-right text-gray-900">{item.pricePerItem.toFixed(3)} BD</td>
                          <td className="py-3 text-right font-medium text-gray-900">{calculateInvoiceItemTotal(item).toFixed(3)} BD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Special Instructions */}
              {orderDetails.specialInstructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Special Instructions</h4>
                  <p className="text-gray-700">{orderDetails.specialInstructions}</p>
                </div>
              )}

              {/* Total Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{orderDetails.invoiceItems.reduce((sum, item) => sum + calculateInvoiceItemTotal(item), 0).toFixed(3)} BD</span>
                  </div>
                  {orderDetails.minimumOrderApplied && (
                    <div className="flex justify-between text-sm text-yellow-700">
                      <span>Minimum Order Fee:</span>
                      <span className="font-medium">4.000 BD</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total Amount:</span>
                    <span>{orderDetails.invoiceItems.reduce((sum, item) => sum + calculateInvoiceItemTotal(item), 0).toFixed(3)} BD</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
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