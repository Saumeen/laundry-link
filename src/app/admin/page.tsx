// src/app/admin/page.tsx - Enhanced Admin Panel
'use client';

import { useState, useEffect } from 'react';

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
  itemType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  status: string;
  items: string[];
  totalAmount: number;
  pickupTime: string;
  serviceType: string;
  specialInstructions: string;
  paymentStatus: string;
  createdAt: string;
  customer?: Customer;
  addresses?: Address[];
  invoiceItems?: InvoiceItem[];
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
    itemType: '',
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
    if (!selectedOrder || !newInvoiceItem.itemType || newInvoiceItem.quantity <= 0) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const totalPrice = newInvoiceItem.quantity * newInvoiceItem.unitPrice;
      
      const response = await fetch('/api/admin/add-invoice-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          itemType: newInvoiceItem.itemType,
          quantity: newInvoiceItem.quantity,
          unitPrice: newInvoiceItem.unitPrice,
          totalPrice: totalPrice,
          notes: newInvoiceItem.notes,
        }),
      });

      if (response.ok) {
        alert('Invoice item added successfully!');
        fetchOrders();
        // Reset form
        setNewInvoiceItem({
          itemType: '',
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
      console.error('Error adding invoice item:', error);
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
      case 'Order Placed': return 'bg-blue-100 text-blue-800';
      case 'Driver Assigned for Pickup': return 'bg-purple-100 text-purple-800';
      case 'Pickup Cancelled': return 'bg-red-100 text-red-800';
      case 'Pickup Rescheduled': return 'bg-orange-100 text-orange-800';
      case 'Picked Up': return 'bg-indigo-100 text-indigo-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      case 'Cleaning Complete': return 'bg-lime-100 text-lime-800';
      case 'Quality Check': return 'bg-pink-100 text-pink-800';
      case 'Invoice Generated': return 'bg-emerald-100 text-emerald-800';
      case 'Driver Assigned for Delivery': return 'bg-cyan-100 text-cyan-800';
      case 'Out for Delivery': return 'bg-green-100 text-green-800';
      case 'Delivered': return 'bg-teal-100 text-teal-800';
      case 'Order Returned Unprocessed': return 'bg-gray-100 text-gray-800';
      case 'Order Reprocess': return 'bg-amber-100 text-amber-800';
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
                        {order.serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.totalAmount} BHD
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
                          <option value="Order Placed">Order Placed</option>
                          <option value="Driver Assigned for Pickup">Driver Assigned for Pickup</option>
                          <option value="Pickup Cancelled">Pickup Cancelled</option>
                          <option value="Pickup Rescheduled">Pickup Rescheduled</option>
                          <option value="Picked Up">Picked Up</option>
                          <option value="Processing">Processing</option>
                          <option value="Cleaning Complete">Cleaning Complete</option>
                          <option value="Quality Check">Quality Check</option>
                          <option value="Invoice Generated">Invoice Generated</option>
                          <option value="Driver Assigned for Delivery">Driver Assigned for Delivery</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Order Returned Unprocessed">Order Returned Unprocessed</option>
                          <option value="Order Reprocess">Order Reprocess</option>
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
                    <p><span className="font-medium">Service Type:</span> {selectedOrder.serviceType.replace(/_/g, ' ')}</p>
                    <p><span className="font-medium">Total Amount:</span> {selectedOrder.totalAmount} BD</p>
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
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Type</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedOrder.invoiceItems.map((item) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.itemType}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.quantity}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.unitPrice.toFixed(3)} BD</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.totalPrice.toFixed(3)} BD</td>
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
                        <input
                          type="text"
                          value={newInvoiceItem.itemType}
                          onChange={(e) => setNewInvoiceItem({...newInvoiceItem, itemType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Item type (e.g., Shirt, Pants)"
                        />
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
                          step="0.001"
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

