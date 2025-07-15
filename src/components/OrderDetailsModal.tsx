'use client';

import { useState, useEffect } from 'react';

interface OrderItem {
  id: number;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface OrderDetails {
  id: number;
  orderNumber: string;
  status: string;
  invoiceTotal: number;
  pickupTime: string;
  deliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  customerNotes?: string;
  customerPhone?: string;
  customerAddress?: string;
  specialInstructions?: string;
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
  pickupAddress?: {
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
  deliveryAddress?: {
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
  invoiceItems?: OrderItem[];
  items?: OrderItem[];
  processingDetails?: {
    washType?: string;
    dryType?: string;
    specialInstructions?: string;
    fabricType?: string;
    stainTreatment?: string;
  };
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

const STATUS_CONFIG = {
  'Order Placed': { 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: '📝',
    bgColor: 'bg-blue-100'
  },
  'Picked Up': { 
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: '🚚',
    bgColor: 'bg-yellow-100'
  },
  'In Process': { 
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: '⚙️',
    bgColor: 'bg-purple-100'
  },
  'Ready for Delivery': { 
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: '✅',
    bgColor: 'bg-green-100'
  },
  'Delivered': { 
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: '🎉',
    bgColor: 'bg-gray-100'
  },
} as const;

export default function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('OrderDetailsModal props:', { isOpen, orderId });

  useEffect(() => {
    console.log('OrderDetailsModal useEffect triggered:', { isOpen, orderId });
    if (isOpen && orderId) {
      console.log('Fetching order details...');
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching order details for order ID:', orderId);
      const response = await fetch(`/api/orders/${orderId}`);
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to fetch order details: ${response.status} ${errorText}`);
      }
      
      const data = await response.json() as { order: OrderDetails };
      console.log('Order details received:', data);
      setOrderDetails(data.order);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Not specified';
    
    // If address is a string, return it directly
    if (typeof address === 'string') {
      return address;
    }
    
    // If address is an object, format it
    let formatted = address.addressLine1 || '';
    if (address.addressLine2) formatted += `, ${address.addressLine2}`;
    if (address.building) formatted += `, Building ${address.building}`;
    if (address.floor) formatted += `, Floor ${address.floor}`;
    if (address.apartment) formatted += `, Apt ${address.apartment}`;
    if (address.area) formatted += `, ${address.area}`;
    if (address.city) formatted += `, ${address.city}`;
    
    return formatted || 'Address not available';
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: '❓',
      bgColor: 'bg-gray-100'
    };
  };

  if (!orderId) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="mx-auto max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Order Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-2xl text-gray-500">×</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <span className="ml-3 text-gray-600">Loading order details...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg mb-2">⚠️</div>
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchOrderDetails}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {orderDetails && !loading && (
              <div className="space-y-8">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">#{orderDetails?.orderNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Order #{orderDetails?.orderNumber || 'N/A'}</h2>
                        <p className="text-gray-600">Customer: {orderDetails?.customerPhone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">{orderDetails?.invoiceTotal?.toFixed(3) || '0.000'} BD</p>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusConfig(orderDetails?.status || '').color}`}>
                        {orderDetails?.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order Details */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">📋</span>
                      Order Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="font-medium">{orderDetails?.createdAt ? formatDate(orderDetails.createdAt) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{orderDetails?.updatedAt ? formatDate(orderDetails.updatedAt) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer Phone:</span>
                        <span className="font-medium">{orderDetails?.customerPhone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer Address:</span>
                        <span className="font-medium">{orderDetails?.customerAddress || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup Time:</span>
                        <span className="font-medium">{orderDetails?.pickupTime ? formatDate(orderDetails.pickupTime) : 'N/A'}</span>
                      </div>
                      {orderDetails?.deliveryTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Time:</span>
                          <span className="font-medium">{formatDate(orderDetails.deliveryTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Processing Details */}
                  {orderDetails.processingDetails && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">⚙️</span>
                        Processing Details
                      </h3>
                      <div className="space-y-3">
                        {orderDetails?.processingDetails?.washType && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Wash Type:</span>
                            <span className="font-medium">{orderDetails.processingDetails.washType}</span>
                          </div>
                        )}
                        {orderDetails?.processingDetails?.dryType && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Dry Type:</span>
                            <span className="font-medium">{orderDetails.processingDetails.dryType}</span>
                          </div>
                        )}
                        {orderDetails?.processingDetails?.fabricType && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fabric Type:</span>
                            <span className="font-medium">{orderDetails.processingDetails.fabricType}</span>
                          </div>
                        )}
                        {orderDetails?.processingDetails?.stainTreatment && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Stain Treatment:</span>
                            <span className="font-medium">{orderDetails.processingDetails.stainTreatment}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Addresses */}
                {(orderDetails?.pickupAddress || orderDetails?.deliveryAddress) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pickup Address */}
                    {orderDetails?.pickupAddress && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <span className="mr-2">🚚</span>
                          Pickup Address
                        </h3>
                        <div className="space-y-2">
                          <p className="font-medium text-gray-900">{orderDetails?.pickupAddress?.label || 'N/A'}</p>
                          <p className="text-gray-600">{formatAddress(orderDetails?.pickupAddress)}</p>
                          {orderDetails?.pickupAddress?.contactNumber && (
                            <p className="text-gray-600">📞 {orderDetails.pickupAddress.contactNumber}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delivery Address */}
                    {orderDetails?.deliveryAddress && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <span className="mr-2">🏠</span>
                          Delivery Address
                        </h3>
                        <div className="space-y-2">
                          <p className="font-medium text-gray-900">{orderDetails?.deliveryAddress?.label || 'N/A'}</p>
                          <p className="text-gray-600">{formatAddress(orderDetails?.deliveryAddress)}</p>
                          {orderDetails?.deliveryAddress?.contactNumber && (
                            <p className="text-gray-600">📞 {orderDetails.deliveryAddress.contactNumber}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Notes */}
                {orderDetails?.customerNotes && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">📝</span>
                      Customer Notes
                    </h3>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{orderDetails.customerNotes}</p>
                  </div>
                )}

                {/* Special Instructions */}
                {orderDetails?.processingDetails?.specialInstructions && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">⚠️</span>
                      Special Instructions
                    </h3>
                    <p className="text-gray-700 bg-yellow-50 rounded-lg p-4">{orderDetails.processingDetails.specialInstructions}</p>
                  </div>
                )}

                {/* Order Items */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">👕</span>
                    Order Items
                  </h3>
                  <div className="space-y-4">
                    {orderDetails?.items?.map((item, index) => (
                      <div key={item?.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item?.serviceName || 'N/A'}</p>
                          {item?.notes && (
                            <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Qty: {item?.quantity || 0}</p>
                          <p className="text-sm text-gray-600">@{item?.unitPrice?.toFixed(3) || '0.000'} BD</p>
                          <p className="font-semibold text-gray-900">{item?.totalPrice?.toFixed(3) || '0.000'} BD</p>
                        </div>
                      </div>
                    ))}
                    {(!orderDetails?.items || orderDetails.items.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No items found for this order</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-gray-900">{orderDetails?.invoiceTotal?.toFixed(3) || '0.000'} BD</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 