// src/app/admin/page.tsx - Enhanced Admin Panel
'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { OrderStatus } from '@prisma/client';

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  walletBalance: number;
}

interface Address {
  id: number;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  area?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  isDefault: boolean;
}

interface InvoiceItem {
  id: number;
  orderServiceMappingId: number;
  quantity: number;
  pricePerItem: number;
  total?: number;
  service?: {
    id: number;
    name: string;
  };
  notes?: string;
}

interface OrderServiceMapping {
  id: number;
  serviceId: number;
  quantity: number;
  price: number;
  service: {
    id: number;
    name: string;
    description?: string;
  };
}

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  status: string;
  items: string[];
  invoiceTotal: number;
  pickupTime: string;
  serviceType: string;
  specialInstructions: string;
  paymentStatus: string;
  createdAt: string;
  customer?: Customer;
  addresses?: Address[];
  invoiceItems?: InvoiceItem[];
  orderServiceMappings?: OrderServiceMapping[];
  processingNotes?: string;
  totalWeight?: number;
  totalPieces?: number;
}

export default function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [processingData, setProcessingData] = useState({
    totalPieces: '',
    totalWeight: '',
    processingNotes: '',
  });
  const [newInvoiceItem, setNewInvoiceItem] = useState({
    orderServiceMappingId: 0,
    quantity: 1,
    unitPrice: 0,
    notes: '',
  });
  const [navigationLoading, setNavigationLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders-detailed');
      const data = await response.json() as Order[];
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId: orderId, 
          status: newStatus 
        }),
      });

      if (response.ok) {
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        alert('Order status updated successfully!');
      } else {
        alert('Failed to update order status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const updateProcessingData = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch('/api/admin/update-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          totalPieces: parseInt(processingData.totalPieces) || 0,
          totalWeight: parseFloat(processingData.totalWeight) || 0,
          processingNotes: processingData.processingNotes,
        }),
      });

      if (response.ok) {
        alert('Processing data updated successfully!');
        fetchOrders();
        // Update selected order
        const updatedOrder = { 
          ...selectedOrder, 
          totalPieces: parseInt(processingData.totalPieces) || 0,
          totalWeight: parseFloat(processingData.totalWeight) || 0,
          processingNotes: processingData.processingNotes 
        };
        setSelectedOrder(updatedOrder);
      } else {
        alert('Failed to update processing data.');
      }
    } catch (error) {
      console.error('Error updating processing data:', error);
      alert('Failed to update processing data.');
    }
  };

  const addInvoiceItem = async () => {
    if (!selectedOrder || !newInvoiceItem.orderServiceMappingId || newInvoiceItem.quantity <= 0) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!selectedOrder.orderServiceMappings || selectedOrder.orderServiceMappings.length === 0) {
      alert('No services available for this order.');
      return;
    }

    try {
      const response = await fetch('/api/admin/add-invoice-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          invoiceItems: [{
            orderServiceMappingId: newInvoiceItem.orderServiceMappingId,
            quantity: newInvoiceItem.quantity,
            pricePerItem: newInvoiceItem.unitPrice,
            notes: newInvoiceItem.notes,
          }],
        }),
      });

      if (response.ok) {
        alert('Invoice item added successfully!');
        fetchOrders();
        // Reset form
        setNewInvoiceItem({
          orderServiceMappingId: 0,
          quantity: 1,
          unitPrice: 0,
          notes: '',
        });
        // Refresh selected order
        const updatedOrders = await fetch('/api/admin/orders-detailed');
        const ordersData = await updatedOrders.json() as Order[];
        const updatedOrder = ordersData.find((o: Order) => o.id === selectedOrder.id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      } else {
        alert('Failed to add invoice item.');
      }
    } catch (error) {
      alert('Failed to add invoice item.');
    }
  };

  const openOrderDetails = async (order: Order) => {
    try {
      // Fetch detailed order information including customer and addresses
      const response = await fetch(`/api/admin/order-details/${order.id}`);
      if (response.ok) {
        const detailedOrder = await response.json() as Order;
        setSelectedOrder(detailedOrder);
        setProcessingData({
          totalPieces: detailedOrder.totalPieces?.toString() || '',
          totalWeight: detailedOrder.totalWeight?.toString() || '',
          processingNotes: detailedOrder.processingNotes || '',
        });
        setShowOrderDetails(true);
      } else {
        alert('Failed to fetch order details.');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to fetch order details.');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case OrderStatus.ORDER_PLACED: return 'bg-blue-100 text-blue-800';
      case OrderStatus.CONFIRMED: return 'bg-purple-100 text-purple-800';
      case OrderStatus.PICKUP_ASSIGNED: return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.PICKUP_IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PICKUP_COMPLETED: return 'bg-green-100 text-green-800';
      case OrderStatus.PICKUP_FAILED: return 'bg-red-100 text-red-800';
      case OrderStatus.RECEIVED_AT_FACILITY: return 'bg-cyan-100 text-cyan-800';
      case OrderStatus.PROCESSING_STARTED: return 'bg-orange-100 text-orange-800';
      case OrderStatus.PROCESSING_COMPLETED: return 'bg-lime-100 text-lime-800';
      case OrderStatus.QUALITY_CHECK: return 'bg-pink-100 text-pink-800';
      case OrderStatus.READY_FOR_DELIVERY: return 'bg-emerald-100 text-emerald-800';
      case OrderStatus.DELIVERY_ASSIGNED: return 'bg-teal-100 text-teal-800';
      case OrderStatus.DELIVERY_IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
      case OrderStatus.DELIVERY_FAILED: return 'bg-red-100 text-red-800';
      case OrderStatus.CANCELLED: return 'bg-gray-100 text-gray-800';
      case OrderStatus.REFUNDED: return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <AdminHeader
        title="Order Management"
        subtitle="Manage all orders, statuses, and invoices"
        showBackButton={true}
        backUrl="/"
      />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel - Order Management</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No orders found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pickup Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : `Customer ID: ${order.customerId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.orderServiceMappings?.map(mapping => mapping.service.name).join(', ') || 'No services'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.invoiceTotal} BHD
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.pickupTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        <button
                          onClick={async () => {
                            setNavigationLoading(true);
                            await openOrderDetails(order);
                            setNavigationLoading(false);
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          View Details
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={OrderStatus.ORDER_PLACED}>Order Placed</option>
                          <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                          <option value={OrderStatus.PICKUP_ASSIGNED}>Pickup Assigned</option>
                          <option value={OrderStatus.PICKUP_IN_PROGRESS}>Pickup In Progress</option>
                          <option value={OrderStatus.PICKUP_COMPLETED}>Pickup Completed</option>
                          <option value={OrderStatus.PICKUP_FAILED}>Pickup Failed</option>
                          <option value={OrderStatus.RECEIVED_AT_FACILITY}>Received at Facility</option>
                          <option value={OrderStatus.PROCESSING_STARTED}>Processing Started</option>
                          <option value={OrderStatus.PROCESSING_COMPLETED}>Processing Completed</option>
                          <option value={OrderStatus.QUALITY_CHECK}>Quality Check</option>
                          <option value={OrderStatus.READY_FOR_DELIVERY}>Ready for Delivery</option>
                          <option value={OrderStatus.DELIVERY_ASSIGNED}>Delivery Assigned</option>
                          <option value={OrderStatus.DELIVERY_IN_PROGRESS}>Delivery In Progress</option>
                          <option value={OrderStatus.DELIVERED}>Delivered</option>
                          <option value={OrderStatus.DELIVERY_FAILED}>Delivery Failed</option>
                          <option value={OrderStatus.CANCELLED}>Cancelled</option>
                          <option value={OrderStatus.REFUNDED}>Refunded</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {navigationLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <span className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Order Details - {selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Customer Information</h4>
                  {selectedOrder.customer ? (
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                      <p><span className="font-medium">Email:</span> {selectedOrder.customer.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedOrder.customer.phone}</p>
                      <p><span className="font-medium">Wallet Balance:</span> {selectedOrder.customer.walletBalance.toFixed(3)} BD</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Customer information not available</p>
                  )}
                </div>

                {/* Order Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Order Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Services:</span> {selectedOrder.orderServiceMappings?.map(mapping => `${mapping.service.name} (${mapping.quantity})`).join(', ') || 'No services'}</p>
                    <p><span className="font-medium">Total Amount:</span> {selectedOrder.invoiceTotal} BD</p>
                    <p><span className="font-medium">Payment Status:</span> {selectedOrder.paymentStatus}</p>
                    <p><span className="font-medium">Pickup Time:</span> {new Date(selectedOrder.pickupTime).toLocaleString()}</p>
                    <p><span className="font-medium">Created:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Addresses */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Customer Addresses</h4>
                  {selectedOrder.addresses && selectedOrder.addresses.length > 0 ? (
                    <div className="space-y-3">
                      {selectedOrder.addresses.map((address) => (
                        <div key={address.id} className="border-l-4 border-blue-500 pl-3">
                          <p className="font-medium">{address.label} {address.isDefault && '(Default)'}</p>
                          <p className="text-sm text-gray-600">
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}{address.area && `, ${address.area}`}
                          </p>
                          {address.building && (
                            <p className="text-sm text-gray-600">
                              Building: {address.building}
                              {address.floor && `, Floor: ${address.floor}`}
                              {address.apartment && `, Apt: ${address.apartment}`}
                            </p>
                          )}
                          {address.landmark && (
                            <p className="text-sm text-gray-600">Near: {address.landmark}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No saved addresses</p>
                  )}
                </div>

                {/* Special Instructions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Special Instructions</h4>
                  <p className="text-gray-600">
                    {selectedOrder.specialInstructions || 'No special instructions provided'}
                  </p>
                </div>

                {/* Processing Data */}
                <div className="bg-blue-50 p-4 rounded-lg lg:col-span-2">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Processing Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Pieces</label>
                      <input
                        type="number"
                        value={processingData.totalPieces}
                        onChange={(e) => setProcessingData({...processingData, totalPieces: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Number of pieces"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={processingData.totalWeight}
                        onChange={(e) => setProcessingData({...processingData, totalWeight: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Weight in kg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Processing Notes</label>
                      <input
                        type="text"
                        value={processingData.processingNotes}
                        onChange={(e) => setProcessingData({...processingData, processingNotes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Processing notes"
                      />
                    </div>
                  </div>
                  <button
                    onClick={updateProcessingData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Update Processing Data
                  </button>
                </div>

                {/* Invoice Items */}
                <div className="bg-green-50 p-4 rounded-lg lg:col-span-2">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Invoice Items</h4>
                  
                  {/* Existing Invoice Items */}
                  {selectedOrder.invoiceItems && selectedOrder.invoiceItems.length > 0 ? (
                    <div className="mb-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedOrder.invoiceItems.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.service?.name || 'Unknown Service'}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.quantity}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.pricePerItem.toFixed(3)} BD</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.total?.toFixed(3) || (item.quantity * item.pricePerItem).toFixed(3)} BD</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.notes || '-'}</td>
                                
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-4">No invoice items added yet</p>
                  )}

                  {/* Add New Invoice Item */}
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-gray-800 mb-3">Add New Invoice Item</h5>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <select
                          value={newInvoiceItem.orderServiceMappingId}
                          onChange={(e) => setNewInvoiceItem({...newInvoiceItem, orderServiceMappingId: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value={0}>Select Service</option>
                          {selectedOrder.orderServiceMappings?.map((mapping) => (
                            <option key={mapping.id} value={mapping.id}>
                              {mapping.service.name} - {mapping?.price?.toFixed(3)} BD
                            </option>
                          )) || <option value={0} disabled>No services available</option>}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          value={newInvoiceItem.quantity}
                          onChange={(e) => setNewInvoiceItem({...newInvoiceItem, quantity: parseInt(e.target.value) || 1})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Quantity"
                          min="1"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.1"
                          value={newInvoiceItem.unitPrice}
                          onChange={(e) => setNewInvoiceItem({...newInvoiceItem, unitPrice: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Unit price (BD)"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={newInvoiceItem.notes}
                          onChange={(e) => setNewInvoiceItem({...newInvoiceItem, notes: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Notes (optional)"
                        />
                      </div>
                      <div>
                        <button
                          onClick={addInvoiceItem}
                          className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"
                        >
                          Add Item
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Total: {(newInvoiceItem.quantity * newInvoiceItem.unitPrice).toFixed(3)} BD
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

