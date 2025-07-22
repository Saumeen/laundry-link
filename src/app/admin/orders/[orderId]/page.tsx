"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminHeader from "@/components/admin/AdminHeader";
import { UserRole, DriverAssignment } from "@/types/global";
import { OrderStatus } from "@prisma/client";

import { useToast, ToastProvider } from "@/components/ui/Toast";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Link from "next/link";
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import { parseJsonResponse } from '@/lib/api';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Package,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Download,
  Printer,
  ExternalLink
} from 'lucide-react';

// Google Maps configuration
const libraries: ("places")[] = ["places"];

// Default center for Bahrain
const defaultCenter = {
  lat: 26.0667,
  lng: 50.5577
};

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  pickupTime: string;
  deliveryTime: string;
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
    orderItems: OrderItem[];
  }>;
  driverAssignments?: DriverAssignment[];
  specialInstructions?: string;
  invoiceTotal?: number;
  minimumOrderApplied?: boolean;
  orderProcessing?: any;
}

interface OrderItem {
  id: number;
  orderServiceMappingId: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
  notes?: string;
  orderServiceMapping?: {
    service: {
      displayName: string;
    };
  };
}

// Helper function to calculate order item total
const calculateOrderItemTotal = (item: OrderItem): number => {
  return item.quantity * item.pricePerItem;
};



interface Service {
  id: number;
  name: string;
  displayName: string;
  price: number;
  unit: string;
  description?: string;
  pricingType?: string;
  pricingUnit?: string;
  turnaround?: string;
  category?: string;
  features?: string[];
  sortOrder?: number;
}

interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  lastLoginAt?: string;
  createdAt: string;
}

// API Response interfaces
interface OrderResponse {
  order: Order;
}

interface ErrorResponse {
  error: string;
}

interface DriversResponse {
  drivers: Driver[];
}

interface DriverAssignmentsResponse {
  assignments: DriverAssignment[];
}

interface OrderItemsResponse {
  orderItems: OrderItem[];
}

type TabType = 'overview' | 'edit' | 'assignments' | 'services' | 'order-items' | 'invoice' | 'history';

// Tab Button Component
const TabButton = React.memo(({ 
  isActive, 
  onClick, 
  children, 
  count 
}: { 
  isActive: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`}
  >
    {children}
    {count !== undefined && (
      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
        isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
      }`}>
        {count}
      </span>
    )}
  </button>
));

// Invoice Tab Component
function InvoiceTab({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const calculateSubtotal = useCallback(() => {
    let subtotal = 0;
    
    // Add order items costs
    if (order.orderServiceMappings) {
      order.orderServiceMappings.forEach(mapping => {
        if (mapping.orderItems) {
          mapping.orderItems.forEach(item => {
            subtotal += item.totalPrice;
          });
        }
      });
    }
    
    return subtotal;
  }, [order]);

  const handlePrintInvoice = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/generate-invoice-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      });

      if (response.ok) {
        // Get the PDF blob
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${order.orderNumber}.pdf`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showToast('PDF downloaded successfully!', 'success');
      } else {
        const errorData = await response.json() as ErrorResponse;
        showToast(errorData.error || 'Failed to download PDF', 'error');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showToast('Failed to download PDF', 'error');
    } finally {
      setLoading(false);
    }
  }, [order.id, order.orderNumber, showToast]);

  const subtotal = calculateSubtotal();
  const total = order.invoiceTotal || subtotal;

  return (
    <div className="space-y-6">
      {/* Invoice Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-4">
            {/* Logo placeholder */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">LL</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">INVOICE</h2>
              <p className="text-gray-600 font-medium">Laundry Link Services</p>
              <p className="text-sm text-gray-500">Professional Laundry & Dry Cleaning</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900 mb-1">
              Order #{order.orderNumber}
            </div>
            <div className="text-sm text-gray-600">
              Date: {formatDate(order.createdAt)}
            </div>
            <div className="text-sm text-gray-600">
              Due Date: {formatDate(order.deliveryTime)}
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Order Status</div>
              <div className="font-semibold text-gray-900">{order.status}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="font-bold text-lg text-blue-600">{total.toFixed(3)} BD</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Services</div>
              <div className="font-semibold text-gray-900">{order.orderServiceMappings?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Items</div>
              <div className="font-semibold text-gray-900">
                {order.orderServiceMappings?.reduce((total, mapping) => total + (mapping.orderItems?.length || 0), 0) || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Company and Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">From:</h3>
            <div className="text-gray-700">
              <p className="font-medium">Laundry Link Services</p>
              <p>123 Business Street</p>
              <p>Manama, Bahrain</p>
              <p>Phone: +973 1234 5678</p>
              <p>Email: info@laundrylink.bh</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
            <div className="text-gray-700">
              <p className="font-medium">{order.customer.firstName} {order.customer.lastName}</p>
              <p>{order.customer.email}</p>
              <p>{order.customer.phone}</p>
              {order.address && (
                <div className="mt-2">
                  <p>{order.address.addressLine1}</p>
                  {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                  <p>{order.address.city}</p>
                  {order.address.area && <p>Area: {order.address.area}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Order Details:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">{order.status}</span>
            </div>
            <div>
              <span className="text-gray-600">Pickup:</span>
              <span className="ml-2 font-medium">{formatDateTime(order.pickupTime)}</span>
            </div>
            <div>
              <span className="text-gray-600">Delivery:</span>
              <span className="ml-2 font-medium">{formatDateTime(order.deliveryTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services and Items */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Services & Items</h3>
        
        {/* Services */}
        {order.orderServiceMappings && order.orderServiceMappings.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Services</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.orderServiceMappings.map((mapping) => (
                    <tr key={mapping.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {mapping.service.displayName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {mapping.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {mapping.price.toFixed(3)} BD
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {(mapping.quantity * mapping.price).toFixed(3)} BD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Order Items */}
        {order.orderServiceMappings && order.orderServiceMappings.some(mapping => mapping.orderItems && mapping.orderItems.length > 0) && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Order Items</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.orderServiceMappings.map((mapping) =>
                    mapping.orderItems?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.itemName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                          {item.itemType}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.pricePerItem.toFixed(3)} BD
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.totalPrice.toFixed(3)} BD
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Special Instructions</h4>
            <p className="text-gray-700 text-sm">{order.specialInstructions}</p>
          </div>
        )}

        {/* Totals */}
        <div className="border-t pt-4">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{subtotal.toFixed(3)} BD</span>
              </div>
              {order.minimumOrderApplied && (
                <div className="flex justify-between py-2 text-sm text-gray-500">
                  <span>Minimum Order Applied:</span>
                  <span>Yes</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-gray-900">{total.toFixed(3)} BD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 no-print">
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={handlePrintInvoice}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Invoice
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {loading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .bg-white {
            background: white !important;
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
          .space-y-6 > * + * {
            margin-top: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

// Order History Tab Component
function OrderHistoryTab({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const { showToast } = useToast();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const getEventIcon = useCallback((type: string) => {
    switch (type) {
      case 'history':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'update':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      case 'driver_assignment':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      case 'processing':
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  }, []);

  const getEventColor = useCallback((type: string) => {
    switch (type) {
      case 'history':
        return 'border-blue-200 bg-blue-50';
      case 'update':
        return 'border-green-200 bg-green-50';
      case 'driver_assignment':
        return 'border-purple-200 bg-purple-50';
      case 'processing':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  }, []);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/order-history/${order.id}`);
      if (response.ok) {
        const data = await response.json() as any[];
        setTimeline(data);
      } else {
        showToast('Failed to fetch order history', 'error');
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
      showToast('Failed to fetch order history', 'error');
    } finally {
      setLoading(false);
    }
  }, [order.id, showToast]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      showToast('Please enter a note', 'error');
      return;
    }

    try {
      setAddingNote(true);
      const response = await fetch(`/api/admin/order-history/${order.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ADD_NOTE',
          description: newNote,
          metadata: { type: 'admin_note' }
        }),
      });

      if (response.ok) {
        showToast('Note added successfully', 'success');
        setNewNote('');
        fetchTimeline();
        onRefresh();
      } else {
        showToast('Failed to add note', 'error');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      showToast('Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading order history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Timeline</h3>
            <p className="text-sm text-gray-600">
              Complete history of all activities, status changes, and updates for this order.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {timeline.length}
            </div>
            <div className="text-xs text-gray-500">Total Events</div>
          </div>
        </div>
      </div>

      {/* Add Note Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Add Note</h4>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Add a note to the order history..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
          />
          <button
            onClick={handleAddNote}
            disabled={addingNote || !newNote.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingNote ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-6">Order Timeline</h4>
        
        {timeline.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No history events found for this order.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {timeline.map((event, index) => (
              <div key={event.id} className={`relative border-l-4 ${getEventColor(event.type)} pl-6 pb-6`}>
                {/* Timeline dot */}
                <div className="absolute left-0 top-0 transform -translate-x-1/2">
                  {getEventIcon(event.type)}
                </div>
                
                {/* Event content */}
                <div className="ml-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900 mb-1">
                        {event.description}
                      </h5>
                      
                      {/* Event details based on type */}
                      {event.type === 'update' && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                            {event.oldStatus} → {event.newStatus}
                          </span>
                          {event.notes && (
                            <span className="text-gray-500">Note: {event.notes}</span>
                          )}
                        </div>
                      )}
                      
                      {event.type === 'driver_assignment' && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded mr-2">
                            {event.metadata.assignmentType}
                          </span>
                          <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                            {event.metadata.status}
                          </span>
                          {event.metadata.estimatedTime && (
                            <span className="text-gray-500">
                              Est: {formatDateTime(event.metadata.estimatedTime)}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {event.type === 'processing' && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded mr-2">
                            {event.metadata.processingStatus}
                          </span>
                          {event.metadata.totalPieces && (
                            <span className="text-gray-500">
                              Pieces: {event.metadata.totalPieces}
                            </span>
                          )}
                          {event.metadata.totalWeight && (
                            <span className="text-gray-500 ml-2">
                              Weight: {event.metadata.totalWeight}kg
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Staff information */}
                      {event.staff && (
                        <div className="text-xs text-gray-500">
                          By: {event.staff.firstName} {event.staff.lastName} ({event.staff.email})
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 ml-4">
                      {formatDateTime(event.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


function OrderEditPageContent() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  
  // Remove useToast from here since it will be used in child components
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [saving, setSaving] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  // Memoized tab click handlers
  const handleTabClick = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // Handle async params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setOrderId(resolvedParams.orderId as string);
    };
    getParams();
  }, [params]);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/order-details/${orderId}`);
      if (response.ok) {
        const data = await response.json() as OrderResponse;
        setOrder(data.order);
      } else {
        const errorData = await response.json() as ErrorResponse;
        setError(errorData.error || 'Failed to fetch order');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to fetch order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    if (session?.userType !== "admin") {
      router.push("/admin/login");
      return;
    }

    // Check if user has appropriate role to view orders
    const allowedRoles = ['SUPER_ADMIN', 'OPERATION_MANAGER', 'DRIVER', 'FACILITY_TEAM'];
    if (session?.role && !allowedRoles.includes(session.role as string)) {
      router.push("/admin/login");
      return;
    }

    fetchOrder();
  }, [status, session, router, fetchOrder]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const colors: { [key: string]: string } = {
      'Order Placed': 'bg-blue-100 text-blue-800',
      'Picked Up': 'bg-yellow-100 text-yellow-800',
      'In Process': 'bg-purple-100 text-purple-800',
      'Ready for Delivery': 'bg-green-100 text-green-800',
      [OrderStatus.DELIVERED]: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }, []);

  // Calculate total for the summary card
  const calculateTotal = useCallback(() => {
    if (!order) return 0;
    
    let subtotal = 0;
    
    // Add order items costs
    if (order.orderServiceMappings) {
      order.orderServiceMappings.forEach(mapping => {
        if (mapping.orderItems) {
          mapping.orderItems.forEach(item => {
            subtotal += item.totalPrice;
          });
        }
      });
    }
    
    return order.invoiceTotal || subtotal;
  }, [order]);

  const total = calculateTotal();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title="Loading Order..." />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title="Order Not Found" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The requested order could not be found.'}</p>
            <Link
              href="/admin/orders"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title={`Order #${order.orderNumber}`} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/orders"
                  className="text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Orders
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                  Order #{order.orderNumber}
                </h1>
              </div>
              <div className="mt-2 text-gray-600">
                Customer: {order.customer.firstName} {order.customer.lastName} | {order.customer.email}
              </div>
              <div className="text-sm text-gray-500">
                Created: {formatDate(order.createdAt)}
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
              {order.invoiceTotal && (
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {order.invoiceTotal.toFixed(3)} BD
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Order Status</div>
              <div className="font-semibold text-gray-900">{order.status}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="font-bold text-lg text-blue-600">{total.toFixed(3)} BD</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Services</div>
              <div className="font-semibold text-gray-900">{order.orderServiceMappings?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Items</div>
              <div className="font-semibold text-gray-900">
                {order.orderServiceMappings?.reduce((total, mapping) => total + (mapping.orderItems?.length || 0), 0) || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <TabButton
                isActive={activeTab === 'overview'}
                onClick={() => handleTabClick('overview')}
              >
                Overview
              </TabButton>
              <TabButton
                isActive={activeTab === 'edit'}
                onClick={() => handleTabClick('edit')}
              >
                Edit Order
              </TabButton>
              <TabButton
                isActive={activeTab === 'assignments'}
                onClick={() => handleTabClick('assignments')}
                count={order.driverAssignments?.length || 0}
              >
                Driver Assignments
              </TabButton>
              <TabButton
                isActive={activeTab === 'services'}
                onClick={() => handleTabClick('services')}
                count={order.orderServiceMappings?.length || 0}
              >
                Services Requested
              </TabButton>
              <TabButton
                isActive={activeTab === 'order-items'}
                onClick={() => handleTabClick('order-items')}
                count={order.orderServiceMappings?.reduce((total, mapping) => total + (mapping.orderItems?.length || 0), 0) || 0}
              >
                Order Items
              </TabButton>
              <TabButton
                isActive={activeTab === 'invoice'}
                onClick={() => handleTabClick('invoice')}
              >
                Invoice
              </TabButton>
              <TabButton
                isActive={activeTab === 'history'}
                onClick={() => handleTabClick('history')}
              >
                Order History
              </TabButton>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <OrderOverviewTab order={order} onRefresh={fetchOrder} />
            )}
            {activeTab === 'edit' && (
              <OrderEditTab order={order} onUpdate={fetchOrder} />
            )}
            {activeTab === 'assignments' && (
              <DriverAssignmentsTab order={order} onRefresh={fetchOrder} />
            )}
            {activeTab === 'services' && (
              <ServicesRequestedTab order={order} onRefresh={fetchOrder} />
            )}
            {activeTab === 'order-items' && (
              <OrderItemsTab order={order} onRefresh={fetchOrder} />
            )}
            {activeTab === 'invoice' && (
              <InvoiceTab order={order} onRefresh={fetchOrder} />
            )}
            {activeTab === 'history' && (
              <OrderHistoryTab order={order} onRefresh={fetchOrder} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OrderOverviewTab({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Order Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pickup Time:</span>
              <span className="font-medium">{formatDate(order.pickupTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Time:</span>
              <span className="font-medium">{formatDate(order.deliveryTime)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{order.customer.firstName} {order.customer.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{order.customer.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{order.customer.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      {order.address && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Delivery Address</h3>
          <div className="space-y-2">
            <p className="text-gray-700 font-medium">{order.address.label}</p>
            <p className="text-gray-700">{order.address.addressLine1}</p>
            {order.address.addressLine2 && (
              <p className="text-gray-700">{order.address.addressLine2}</p>
            )}
            <p className="text-gray-700">{order.address.city}</p>
            {order.address.area && (
              <p className="text-gray-600 text-sm">Area: {order.address.area}</p>
            )}
            {order.address.building && (
              <p className="text-gray-600 text-sm">Building: {order.address.building}</p>
            )}
            {order.address.floor && (
              <p className="text-gray-600 text-sm">Floor/Room: {order.address.floor}</p>
            )}
            {order.address.apartment && (
              <p className="text-gray-600 text-sm">Apartment/Office: {order.address.apartment}</p>
            )}
            {order.address.contactNumber && (
              <p className="text-gray-600 text-sm">Contact: {order.address.contactNumber}</p>
            )}
            {order.address.locationType && (
              <p className="text-gray-600 text-sm">Type: {order.address.locationType}</p>
            )}
          </div>
        </div>
      )}

      {/* Services Requested */}
      {order.orderServiceMappings && order.orderServiceMappings.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Services Requested</h3>
          <div className="space-y-2">
            {order.orderServiceMappings.map((mapping) => (
              <div key={mapping.id} className="flex justify-between items-center">
                <span className="text-gray-700">{mapping.service.displayName}</span>
                <span className="text-gray-600 text-sm">
                  {mapping.quantity} x {mapping.price.toFixed(3)} BD
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
          <p className="text-gray-700">{order.specialInstructions}</p>
        </div>
      )}
    </div>
  );
}

// Edit Tab Component
function OrderEditTab({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState(order.status);
  const [pickupTime, setPickupTime] = useState(order.pickupTime ? new Date(order.pickupTime).toISOString().slice(0, 16) : '');
  const [deliveryTime, setDeliveryTime] = useState(order.deliveryTime ? new Date(order.deliveryTime).toISOString().slice(0, 16) : '');
  const [specialInstructions, setSpecialInstructions] = useState(order.specialInstructions || '');
  
  // Address state variables
  const [addressLabel, setAddressLabel] = useState(order.address?.label || '');
  const [addressLine1, setAddressLine1] = useState(order.address?.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(order.address?.addressLine2 || '');
  const [city, setCity] = useState(order.address?.city || '');
  const [area, setArea] = useState(order.address?.area || '');
  const [building, setBuilding] = useState(order.address?.building || '');
  const [floor, setFloor] = useState(order.address?.floor || '');
  const [apartment, setApartment] = useState(order.address?.apartment || '');
  const [contactNumber, setContactNumber] = useState(order.address?.contactNumber || '');
  const [locationType, setLocationType] = useState(order.address?.locationType || 'flat');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/update-order/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          pickupTime,
          deliveryTime,
          specialInstructions,
          // Address fields
          addressLabel,
          addressLine1,
          addressLine2,
          city,
          area,
          building,
          floor,
          apartment,
          contactNumber,
          locationType,
        }),
      });

      if (response.ok) {
        onUpdate();
        showToast('Order updated successfully', 'success');
      } else {
        const errorData = await response.json() as ErrorResponse;
        setError(errorData.error || 'Failed to update order');
      }
    } catch (error) {
      // Handle error silently
      setError('Failed to update order');
    } finally {
      setLoading(false);
    }
  }, [
    order.id, 
    status, 
    pickupTime, 
    deliveryTime, 
    specialInstructions,
    addressLabel,
    addressLine1,
    addressLine2,
    city,
    area,
    building,
    floor,
    apartment,
    contactNumber,
    locationType,
    onUpdate, 
    showToast
  ]);

  return (
    <div className="max-w-4xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Order Details</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Order Information Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Order Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ORDER_PLACED">Order Placed</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PICKUP_ASSIGNED">Pickup Assigned</option>
                <option value="PICKUP_IN_PROGRESS">Pickup In Progress</option>
                <option value="PICKUP_COMPLETED">Pickup Completed</option>
                <option value="PICKUP_FAILED">Pickup Failed</option>
                <option value="RECEIVED_AT_FACILITY">Received at Facility</option>
                <option value="PROCESSING_STARTED">Processing Started</option>
                <option value="PROCESSING_COMPLETED">Processing Completed</option>
                <option value="QUALITY_CHECK">Quality Check</option>
                <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
                <option value="DELIVERY_ASSIGNED">Delivery Assigned</option>
                <option value="DELIVERY_IN_PROGRESS">Delivery In Progress</option>
                <option value="DELIVERED">Delivered</option>
                <option value="DELIVERY_FAILED">Delivery Failed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions for this order..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Date & Time
              </label>
              <input
                type="datetime-local"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date & Time
              </label>
              <input
                type="datetime-local"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Delivery Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Label
              </label>
              <input
                type="text"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Home, Office, Hotel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Type
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="home">Home</option>
                <option value="flat">Flat/Apartment</option>
                <option value="office">Office</option>
                <option value="hotel">Hotel</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Street address, building name, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Apartment, suite, unit, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area/Road
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Area or road name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Building
              </label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Building name or number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor/Room
              </label>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Floor or room number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apartment/Office
              </label>
              <input
                type="text"
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Apartment or office number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contact number for delivery"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Order'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Driver Assignments Tab Component
function DriverAssignmentsTab({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverAssignments, setDriverAssignments] = useState<DriverAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickupAssignmentLoading, setPickupAssignmentLoading] = useState(false);
  const [deliveryAssignmentLoading, setDeliveryAssignmentLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  
  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<number | null>(null);

  // Form states for new assignments
  const [selectedPickupDriver, setSelectedPickupDriver] = useState<number | ''>('');
  const [selectedDeliveryDriver, setSelectedDeliveryDriver] = useState<number | ''>('');
  const [pickupEstimatedTime, setPickupEstimatedTime] = useState('');
  const [deliveryEstimatedTime, setDeliveryEstimatedTime] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Edit states
  const [editingAssignment, setEditingAssignment] = useState<number | null>(null);
  const [editDriverId, setEditDriverId] = useState<number | ''>('');
  const [editEstimatedTime, setEditEstimatedTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTimeError, setEditTimeError] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);

  // Validation states
  const [pickupTimeError, setPickupTimeError] = useState<string>('');
  const [deliveryTimeError, setDeliveryTimeError] = useState<string>('');
  const [pickupTimeWarning, setPickupTimeWarning] = useState<string>('');

  // Google Maps state
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Get pickup location coordinates
  const getPickupLocation = useMemo(() => {
    if (order.address?.latitude && order.address?.longitude) {
      return {
        lat: order.address.latitude,
        lng: order.address.longitude
      };
    }
    return defaultCenter;
  }, [order.address]);

  // Generate Google Maps link for pickup location
  const getGoogleMapsLink = useCallback(() => {
    if (order.address?.latitude && order.address?.longitude) {
      return `https://www.google.com/maps?q=${order.address.latitude},${order.address.longitude}`;
    }
    // Fallback to address search if no coordinates
    const address = order.address?.addressLine1 || '';
    return `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
  }, [order.address]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadDrivers(), loadDriverAssignments()]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [order.id]);



  // Check pickup time against customer's requested time
  const checkPickupTimeWarning = useCallback((assignedTime: string) => {
    if (!assignedTime || !order.pickupTime) return '';
    
    const assignedDate = new Date(assignedTime);
    const requestedDate = new Date(order.pickupTime);
    
    // Check if the assigned time is different from the requested time
    const timeDifference = Math.abs(assignedDate.getTime() - requestedDate.getTime());
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    
    if (hoursDifference > 1) { // More than 1 hour difference
      const requestedTimeStr = requestedDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `Warning: Customer requested pickup at ${requestedTimeStr}. Please confirm this change with the customer.`;
    }
    
    return '';
  }, [order.pickupTime]);

  const loadDrivers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      if (response.ok) {
        const data = await response.json() as DriversResponse;
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  }, []);

  const loadDriverAssignments = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/driver-assignments?orderId=${order.id}`);
      if (response.ok) {
        const data = await response.json() as DriverAssignmentsResponse;
        setDriverAssignments(data.assignments || []);
        
        // Set existing assignments
        const pickupAssignment = data.assignments?.find((a: DriverAssignment) => a.assignmentType === 'pickup');
        const deliveryAssignment = data.assignments?.find((a: DriverAssignment) => a.assignmentType === 'delivery');
        
        if (pickupAssignment) {
          setSelectedPickupDriver(pickupAssignment.driverId);
          setPickupEstimatedTime(pickupAssignment.estimatedTime ? new Date(pickupAssignment.estimatedTime).toISOString().slice(0, 16) : '');
          setPickupNotes(pickupAssignment.notes || '');
          
          // Check for warning if existing pickup time differs from customer's requested time
          if (pickupAssignment.estimatedTime) {
            const estimatedTimeStr = typeof pickupAssignment.estimatedTime === 'string' 
              ? pickupAssignment.estimatedTime 
              : pickupAssignment.estimatedTime.toISOString();
            const warning = checkPickupTimeWarning(estimatedTimeStr);
            setPickupTimeWarning(warning);
          }
        }
        
        if (deliveryAssignment) {
          setSelectedDeliveryDriver(deliveryAssignment.driverId);
          setDeliveryEstimatedTime(deliveryAssignment.estimatedTime ? new Date(deliveryAssignment.estimatedTime).toISOString().slice(0, 16) : '');
          setDeliveryNotes(deliveryAssignment.notes || '');
        }
      }
    } catch (error) {
      console.error('Error loading driver assignments:', error);
    }
  }, [order.id, checkPickupTimeWarning]);

  // Date validation function
  const validateDateTime = useCallback((dateTimeString: string, assignmentType: 'pickup' | 'delivery'): string => {
    if (!dateTimeString) return '';
    
    const selectedDate = new Date(dateTimeString);
    const now = new Date();
    
    // Check if date is in the past
    if (selectedDate < now) {
      return `${assignmentType === 'pickup' ? 'Pickup' : 'Delivery'} time cannot be in the past`;
    }
    
    // For delivery, ensure it's after pickup time if pickup time is set
    if (assignmentType === 'delivery' && pickupEstimatedTime) {
      const pickupDate = new Date(pickupEstimatedTime);
      if (selectedDate <= pickupDate) {
        return 'Delivery time must be after pickup time';
      }
    }
    
    // For pickup, ensure delivery time is after pickup if delivery time is set
    if (assignmentType === 'pickup' && deliveryEstimatedTime) {
      const deliveryDate = new Date(deliveryEstimatedTime);
      if (selectedDate >= deliveryDate) {
        return 'Pickup time must be before delivery time';
      }
    }
    
    return '';
  }, [pickupEstimatedTime, deliveryEstimatedTime]);

  // Edit validation function
  const validateEditDateTime = useCallback((dateTimeString: string, assignmentType: 'pickup' | 'delivery'): string => {
    if (!dateTimeString) return '';
    
    const selectedDate = new Date(dateTimeString);
    const now = new Date();
    
    // Check if date is in the past
    if (selectedDate < now) {
      return `${assignmentType === 'pickup' ? 'Pickup' : 'Delivery'} time cannot be in the past`;
    }
    
    // For delivery, ensure it's after pickup time if pickup time is set
    if (assignmentType === 'delivery') {
      const pickupAssignment = driverAssignments.find(a => a.assignmentType === 'pickup' && a.id !== editingAssignment);
      if (pickupAssignment?.estimatedTime) {
        const pickupDate = new Date(pickupAssignment.estimatedTime);
        if (selectedDate <= pickupDate) {
          return 'Delivery time must be after pickup time';
        }
      }
    }
    
    // For pickup, ensure delivery time is after pickup if delivery time is set
    if (assignmentType === 'pickup') {
      const deliveryAssignment = driverAssignments.find(a => a.assignmentType === 'delivery' && a.id !== editingAssignment);
      if (deliveryAssignment?.estimatedTime) {
        const deliveryDate = new Date(deliveryAssignment.estimatedTime);
        if (selectedDate >= deliveryDate) {
          return 'Pickup time must be before delivery time';
        }
      }
    }
    
    return '';
  }, [driverAssignments, editingAssignment]);

  const assignDriver = useCallback(async (assignmentType: 'pickup' | 'delivery') => {
    const driverId = assignmentType === 'pickup' ? selectedPickupDriver : selectedDeliveryDriver;
    const estimatedTime = assignmentType === 'pickup' ? pickupEstimatedTime : deliveryEstimatedTime;
    const notes = assignmentType === 'pickup' ? pickupNotes : deliveryNotes;
    
    if (!driverId) {
      showToast(`Please select a driver for ${assignmentType}`, 'error');
      return;
    }

    // Validate date time
    const timeError = validateDateTime(estimatedTime, assignmentType);
    if (timeError) {
      if (assignmentType === 'pickup') {
        setPickupTimeError(timeError);
      } else {
        setDeliveryTimeError(timeError);
      }
      return;
    }

    // Clear any previous errors
    setPickupTimeError('');
    setDeliveryTimeError('');
    setPickupTimeWarning(''); // Clear warning when assigning
    
    // Set the appropriate loading state
    if (assignmentType === 'pickup') {
      setPickupAssignmentLoading(true);
    } else {
      setDeliveryAssignmentLoading(true);
    }

    try {
      const response = await fetch('/api/admin/driver-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          driverId: parseInt(driverId.toString()),
          assignmentType,
          estimatedTime: estimatedTime || undefined,
          notes: notes || undefined,
        }),
      });
      
      if (response.ok) {
        await loadDriverAssignments();
        // Refresh order data to get updated status
        onRefresh();
        showToast(`Driver assigned for ${assignmentType} successfully`, 'success');
      } else {
        const error = await response.json() as ErrorResponse;
        showToast(error.error || `Failed to assign driver for ${assignmentType}`, 'error');
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      showToast(`Failed to assign driver for ${assignmentType}`, 'error');
    } finally {
      // Clear the appropriate loading state
      if (assignmentType === 'pickup') {
        setPickupAssignmentLoading(false);
      } else {
        setDeliveryAssignmentLoading(false);
      }
    }
  }, [selectedPickupDriver, selectedDeliveryDriver, pickupEstimatedTime, deliveryEstimatedTime, pickupNotes, deliveryNotes, validateDateTime, order.id, loadDriverAssignments, onRefresh, showToast]);

  const startEditing = useCallback((assignment: DriverAssignment) => {
    setEditingAssignment(assignment.id);
    setEditDriverId(assignment.driverId);
    setEditEstimatedTime(assignment.estimatedTime ? new Date(assignment.estimatedTime).toISOString().slice(0, 16) : '');
    setEditNotes(assignment.notes || '');
    setEditTimeError('');
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingAssignment(null);
    setEditDriverId('');
    setEditEstimatedTime('');
    setEditNotes('');
    setEditTimeError('');
  }, []);

  const updateAssignment = useCallback(async () => {
    if (!editingAssignment || !editDriverId) {
      showToast('Please select a driver', 'error');
      return;
    }

    const assignment = driverAssignments.find(a => a.id === editingAssignment);
    if (!assignment) return;

    // Validate date time
    const timeError = validateEditDateTime(editEstimatedTime, assignment.assignmentType);
    if (timeError) {
      setEditTimeError(timeError);
      return;
    }

    setEditLoading(true);
    try {
      const response = await fetch(`/api/admin/driver-assignments?id=${editingAssignment}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estimatedTime: editEstimatedTime || undefined,
          notes: editNotes || undefined,
        }),
      });
      
      if (response.ok) {
        await loadDriverAssignments();
        // Refresh order data to get updated status
        onRefresh();
        cancelEditing();
        showToast('Assignment updated successfully', 'success');
      } else {
        const error = await response.json() as ErrorResponse;
        showToast(error.error || 'Failed to update assignment', 'error');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      showToast('Failed to update assignment', 'error');
    } finally {
      setEditLoading(false);
    }
  }, [editingAssignment, editDriverId, driverAssignments, validateEditDateTime, editEstimatedTime, editNotes, loadDriverAssignments, onRefresh, cancelEditing, showToast]);

  const handleDeleteClick = useCallback((assignmentId: number) => {
    setAssignmentToDelete(assignmentId);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!assignmentToDelete) return;

    setDeleteLoading(assignmentToDelete);
    try {
      const response = await fetch(`/api/admin/driver-assignments?id=${assignmentToDelete}&action=delete`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadDriverAssignments();
        // Refresh order data to get updated status
        onRefresh();
        showToast('Assignment deleted successfully', 'success');
      } else {
        const error = await response.json() as ErrorResponse;
        showToast(error.error || 'Failed to delete assignment', 'error');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      showToast('Failed to delete assignment', 'error');
    } finally {
      setDeleteLoading(null);
      setAssignmentToDelete(null);
      setShowDeleteModal(false);
    }
  }, [assignmentToDelete, loadDriverAssignments, onRefresh, showToast]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setAssignmentToDelete(null);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Driver Assignments</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Driver Assignments</h3>
      
      {/* Current Assignments */}
      {driverAssignments.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Current Assignments</h4>
          <div className="space-y-3">
            {driverAssignments.map((assignment) => {
              const driver = drivers.find(d => d.id === assignment.driverId);
              const isEditing = editingAssignment === assignment.id;
              
              if (isEditing) {
                return (
                  <div key={assignment.id} className="bg-white p-4 rounded border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">
                        Edit {assignment.assignmentType.charAt(0).toUpperCase() + assignment.assignmentType.slice(1)} Assignment
                      </h5>
                      <button
                        onClick={cancelEditing}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                        <select
                          value={editDriverId}
                          onChange={(e) => setEditDriverId(e.target.value ? parseInt(e.target.value) : '')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select driver</option>
                          {drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.firstName} {d.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
                        <input
                          type="datetime-local"
                          value={editEstimatedTime}
                          onChange={(e) => {
                            setEditEstimatedTime(e.target.value);
                            setEditTimeError('');
                          }}
                          min={new Date().toISOString().slice(0, 16)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            editTimeError ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {editTimeError && (
                          <p className="text-red-600 text-sm mt-1">{editTimeError}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Any special instructions..."
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={updateAssignment}
                          disabled={editLoading || !editDriverId}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {editLoading ? 'Updating...' : 'Update Assignment'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={assignment.id} className="bg-white p-4 rounded border shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          assignment.assignmentType === 'pickup' ? 'bg-blue-500' : 'bg-green-500'
                        }`}></div>
                        <h5 className="font-medium text-gray-900">
                          {assignment.assignmentType.charAt(0).toUpperCase() + assignment.assignmentType.slice(1)} Driver
                        </h5>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          assignment.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                          assignment.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          assignment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          assignment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          assignment.status === 'RESCHEDULED' ? 'bg-purple-100 text-purple-800' :
                          assignment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm text-gray-700">
                            {driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown Driver'}
                          </span>
                        </div>
                        
                        {assignment.estimatedTime && (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-gray-600">
                              Estimated: {new Date(assignment.estimatedTime).toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        {assignment.notes && (
                          <div className="flex items-start space-x-2">
                            <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-600">{assignment.notes}</span>
                          </div>
                        )}
                        
                        {/* Location Map for existing assignments */}
                        {isLoaded && !loadError && (
                          <div className="mt-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">Location</span>
                            </div>
                            <div className="relative w-full h-32 border border-gray-200 rounded-lg overflow-hidden">
                              <GoogleMap
                                mapContainerClassName="w-full h-full"
                                center={getPickupLocation}
                                zoom={order.address?.latitude && order.address?.longitude ? 15 : 12}
                                options={{
                                  zoomControl: false,
                                  streetViewControl: false,
                                  mapTypeControl: false,
                                  fullscreenControl: false,
                                }}
                              >
                                {order.address?.latitude && order.address?.longitude && (
                                  <Marker position={getPickupLocation} />
                                )}
                              </GoogleMap>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-xs text-gray-500 truncate flex-1">
                                {order.address?.addressLine1 || 'Address not available'}
                              </div>
                              <a
                                href={getGoogleMapsLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs ml-2"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Open</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => startEditing(assignment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit assignment"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(assignment.id)}
                        disabled={deleteLoading === assignment.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        title="Delete assignment"
                      >
                        {deleteLoading === assignment.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Assignment Forms */}
      {(() => {
        const hasPickupAssignment = driverAssignments.some(a => a.assignmentType === 'pickup');
        const hasDeliveryAssignment = driverAssignments.some(a => a.assignmentType === 'delivery');
        
        // If both assignments exist, show a message
        if (hasPickupAssignment && hasDeliveryAssignment) {
          return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 font-medium">All driver assignments are complete!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Both pickup and delivery drivers have been assigned. You can edit or delete assignments above if needed.
              </p>
            </div>
          );
        }
        
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Add New Assignments</h4>
              <div className="text-sm text-gray-500">
                {hasPickupAssignment && hasDeliveryAssignment ? 'All assigned' : 
                 hasPickupAssignment ? 'Pickup assigned' : 
                 hasDeliveryAssignment ? 'Delivery assigned' : 'No assignments yet'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pickup Assignment */}
              {!hasPickupAssignment && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h4 className="font-medium text-gray-900">Assign Pickup Driver</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                      <select
                        value={selectedPickupDriver}
                        onChange={(e) => setSelectedPickupDriver(e.target.value ? parseInt(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select driver</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
                      <input
                        type="datetime-local"
                        value={pickupEstimatedTime}
                        onChange={(e) => {
                          setPickupEstimatedTime(e.target.value);
                          setPickupTimeError(''); // Clear error when user changes the value
                          // Check for warning when time changes
                          const warning = checkPickupTimeWarning(e.target.value);
                          setPickupTimeWarning(warning);
                        }}
                        min={new Date().toISOString().slice(0, 16)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          pickupTimeError ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {pickupTimeError && (
                        <p className="text-red-600 text-sm mt-1">{pickupTimeError}</p>
                      )}
                      {pickupTimeWarning && (
                        <p className="text-amber-600 text-sm mt-1 bg-amber-50 p-2 rounded border border-amber-200">
                          ⚠️ {pickupTimeWarning}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={pickupNotes}
                        onChange={(e) => setPickupNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any special instructions..."
                      />
                    </div>
                    
                    {/* Pickup Location Map */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pickup Location
                        <span className="text-xs text-gray-500 ml-1">
                          {order.address?.latitude && order.address?.longitude ? '(Exact coordinates)' : '(Address search)'}
                        </span>
                      </label>
                      
                      {loadError && (
                        <div className="text-red-600 text-sm mb-2">
                          Error loading map. Please check your Google Maps API key.
                        </div>
                      )}
                      
                      {!isLoaded ? (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">Loading map...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="relative w-full h-48 border border-gray-300 rounded-lg overflow-hidden">
                            <GoogleMap
                              mapContainerClassName="w-full h-full"
                              center={getPickupLocation}
                              zoom={order.address?.latitude && order.address?.longitude ? 16 : 12}
                              options={{
                                zoomControl: true,
                                streetViewControl: false,
                                mapTypeControl: false,
                                fullscreenControl: false,
                              }}
                            >
                              {order.address?.latitude && order.address?.longitude && (
                                <Marker position={getPickupLocation} />
                              )}
                            </GoogleMap>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              {order.address?.addressLine1 || 'Address not available'}
                            </div>
                            <a
                              href={getGoogleMapsLink()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Open in Maps</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => assignDriver('pickup')}
                      disabled={pickupAssignmentLoading || !selectedPickupDriver}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {pickupAssignmentLoading ? 'Assigning...' : 'Assign Pickup Driver'}
                    </button>
                  </div>
                </div>
              )}

              {/* Delivery Assignment */}
              {!hasDeliveryAssignment && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h4 className="font-medium text-gray-900">Assign Delivery Driver</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                      <select
                        value={selectedDeliveryDriver}
                        onChange={(e) => setSelectedDeliveryDriver(e.target.value ? parseInt(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select driver</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
                      <input
                        type="datetime-local"
                        value={deliveryEstimatedTime}
                        onChange={(e) => {
                          setDeliveryEstimatedTime(e.target.value);
                          setDeliveryTimeError(''); // Clear error when user changes the value
                        }}
                        min={pickupEstimatedTime || new Date().toISOString().slice(0, 16)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          deliveryTimeError ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {deliveryTimeError && (
                        <p className="text-red-600 text-sm mt-1">{deliveryTimeError}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any special instructions..."
                      />
                    </div>
                    
                    {/* Delivery Location Map (same as pickup location) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Location
                        <span className="text-xs text-gray-500 ml-1">
                          {order.address?.latitude && order.address?.longitude ? '(Exact coordinates)' : '(Address search)'}
                        </span>
                      </label>
                      
                      {loadError && (
                        <div className="text-red-600 text-sm mb-2">
                          Error loading map. Please check your Google Maps API key.
                        </div>
                      )}
                      
                      {!isLoaded ? (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">Loading map...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="relative w-full h-48 border border-gray-300 rounded-lg overflow-hidden">
                            <GoogleMap
                              mapContainerClassName="w-full h-full"
                              center={getPickupLocation}
                              zoom={order.address?.latitude && order.address?.longitude ? 16 : 12}
                              options={{
                                zoomControl: true,
                                streetViewControl: false,
                                mapTypeControl: false,
                                fullscreenControl: false,
                              }}
                            >
                              {order.address?.latitude && order.address?.longitude && (
                                <Marker position={getPickupLocation} />
                              )}
                            </GoogleMap>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              {order.address?.addressLine1 || 'Address not available'}
                            </div>
                            <a
                              href={getGoogleMapsLink()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Open in Maps</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => assignDriver('delivery')}
                      disabled={deliveryAssignmentLoading || !selectedDeliveryDriver}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {deliveryAssignmentLoading ? 'Assigning...' : 'Assign Delivery Driver'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        title="Delete Assignment"
        message="Are you sure you want to delete this driver assignment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}

// Services Requested Tab Component
function ServicesRequestedTab({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const { showToast } = useToast();
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [addServiceLoading, setAddServiceLoading] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    serviceId: 0,
    quantity: 1,
    price: 0
  });

  // Fetch all available services
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const services = await response.json() as Service[];
          setAllServices(services);
        } else {
          showToast('Failed to fetch services', 'error');
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        showToast('Failed to fetch services', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [showToast]);

  // Get services that are already added to the order
  const getAddedServiceIds = () => {
    return order.orderServiceMappings?.map(mapping => mapping.serviceId) || [];
  };

  // Get services that are not yet added to the order
  const getAvailableServices = () => {
    const addedServiceIds = getAddedServiceIds();
    return allServices.filter(service => !addedServiceIds.includes(service.id));
  };

  // Handle adding a new service to the order
  const handleAddService = async () => {
    if (!newServiceData.serviceId || newServiceData.quantity <= 0 || newServiceData.price <= 0) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setAddServiceLoading(true);
    try {
      const response = await fetch('/api/admin/add-order-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          serviceId: newServiceData.serviceId,
          quantity: newServiceData.quantity,
          price: newServiceData.price,
        }),
      });

      if (response.ok) {
        showToast('Service added to order successfully', 'success');
        setShowAddServiceModal(false);
        setNewServiceData({ serviceId: 0, quantity: 1, price: 0 });
        onRefresh(); // Refresh the order data
      } else {
        const errorData = await response.json() as ErrorResponse;
        showToast(errorData.error || 'Failed to add service to order', 'error');
      }
    } catch (error) {
      console.error('Error adding service to order:', error);
      showToast('Failed to add service to order', 'error');
    } finally {
      setAddServiceLoading(false);
    }
  };

  // Auto-populate price when service changes
  const handleServiceChange = (serviceId: number) => {
    const selectedService = allServices.find(service => service.id === serviceId);
    setNewServiceData({
      serviceId,
      quantity: 1,
      price: selectedService?.price || 0
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Order Services</h3>
        <button
          onClick={() => setShowAddServiceModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Service</span>
        </button>
      </div>
      
      {/* Current Services */}
      {order.orderServiceMappings && order.orderServiceMappings.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Services in Order</h4>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.orderServiceMappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900">
                        {mapping.service.displayName}
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Requested
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {mapping.service.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {mapping.price.toFixed(3)} BD
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No services added to this order yet.</p>
        </div>
      )}

      {/* Available Services */}
      {!loading && getAvailableServices().length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Available Services to Add</h4>
            <p className="text-xs text-gray-500 mt-1">Click "Add Service" button above to add any of these services to the order</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {getAvailableServices().map((service) => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{service.displayName}</h5>
                  <span className="text-sm font-semibold text-blue-600">
                    {service.price.toFixed(3)} BD
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{service.unit}</span>
                  <span>{service.turnaround}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Service to Order</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                <select
                  value={newServiceData.serviceId}
                  onChange={(e) => handleServiceChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Select a service</option>
                  {getAvailableServices().map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.displayName} - {service.price.toFixed(3)} BD
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={newServiceData.quantity}
                  onChange={(e) => setNewServiceData({...newServiceData, quantity: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price per Unit (BD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={newServiceData.price}
                  onChange={(e) => setNewServiceData({...newServiceData, price: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {newServiceData.quantity > 0 && newServiceData.price > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="text-lg font-bold text-blue-600">
                    {(newServiceData.quantity * newServiceData.price).toFixed(3)} BD
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={addServiceLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={addServiceLoading || !newServiceData.serviceId || newServiceData.quantity <= 0 || newServiceData.price <= 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {addServiceLoading ? 'Adding...' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Order Items Tab Component
function OrderItemsTab({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'add-item'>('overview');
  const [servicePricing, setServicePricing] = useState<{
    serviceId: number;
    categories: Array<{
      id: number;
      name: string;
      displayName: string;
      items: Array<{
        id: number;
        name: string;
        displayName: string;
        price: number;
        isDefault: boolean;
        sortOrder: number;
      }>;
    }>;
  } | null>(null);
  
  // Form states for new order item
  const [newItemData, setNewItemData] = useState({
    orderServiceMappingId: 0,
    itemName: '',
    itemType: 'clothing',
    quantity: 1,
    pricePerItem: 0,
    notes: ''
  });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItemData, setEditItemData] = useState<OrderItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Processing state
  const [processing, setProcessing] = useState(order.orderProcessing || null);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const [processingItemDetail, setProcessingItemDetail] = useState<any>(null);
  const [processingForm, setProcessingForm] = useState({
    processedQuantity: '',
    status: 'PENDING',
    processingNotes: ''
  });
  const [markReadyLoading, setMarkReadyLoading] = useState(false);

  // Reset form when order changes
  useEffect(() => {
    // Extract order items from nested structure
    const allOrderItems = order.orderServiceMappings?.flatMap(mapping => 
      mapping.orderItems || []
    ) || [];
    setOrderItems(allOrderItems);
    
    if (order.orderServiceMappings?.length > 0) {
      setNewItemData(prev => ({
        ...prev,
        orderServiceMappingId: order.orderServiceMappings[0].id
      }));
    }
  }, [order.orderServiceMappings]);

  const fetchServicePricing = async (serviceId: number) => {
    try {
      const response = await fetch(`/api/admin/service-pricing?serviceId=${serviceId}`);
      if (response.ok) {
        const data = await response.json() as { success: boolean; data?: any };
        setServicePricing(data.data || null);
      }
    } catch (error) {
      console.error('Error fetching service pricing:', error);
    }
  };

  // Reset item name when service changes and fetch service pricing
  useEffect(() => {
    setNewItemData(prev => ({
      ...prev,
      itemName: '',
      pricePerItem: 0
    }));
    
    // Fetch pricing for the selected service
    if (newItemData.orderServiceMappingId && order) {
      const selectedService = order.orderServiceMappings.find(
        mapping => mapping.id === newItemData.orderServiceMappingId
      );
      if (selectedService) {
        fetchServicePricing(selectedService.service.id);
      }
    }
  }, [newItemData.orderServiceMappingId, order]);

  // Auto-populate price when service or item changes
  useEffect(() => {
    if (newItemData.itemName && newItemData.orderServiceMappingId && order && servicePricing) {
      const selectedService = order.orderServiceMappings.find(
        mapping => mapping.id === newItemData.orderServiceMappingId
      );
      
      if (selectedService) {
        // Find the pricing item that matches the selected item name
        const pricingItem = servicePricing.categories
          .flatMap(category => category.items)
          .find(item => 
            item.displayName.toLowerCase() === newItemData.itemName.toLowerCase() ||
            item.name.toLowerCase() === newItemData.itemName.toLowerCase()
          );
        
        if (pricingItem) {
          setNewItemData(prev => ({
            ...prev,
            pricePerItem: pricingItem.price
          }));
        } else {
          // If no exact match found, use the service's default price
          setNewItemData(prev => ({
            ...prev,
            pricePerItem: selectedService.service.price || 0
          }));
        }
      }
    }
  }, [newItemData.itemName, newItemData.orderServiceMappingId, servicePricing, order]);

  const handleAddOrderItem = async (e?: React.MouseEvent) => {
    // Prevent default form submission if this is called from a form
    if (e) {
      e.preventDefault();
    }
    
    // Prevent duplicate submissions
    if (loading) {
      return;
    }
    
    if (!newItemData.itemName || !newItemData.orderServiceMappingId || newItemData.quantity <= 0) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/add-order-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          orderServiceMappingId: newItemData.orderServiceMappingId,
          itemName: newItemData.itemName,
          itemType: newItemData.itemType,
          quantity: newItemData.quantity,
          pricePerItem: newItemData.pricePerItem,
          notes: newItemData.notes,
        }),
      });

      if (response.ok) {
        const data = await response.json() as OrderItemsResponse;
        setOrderItems(data.orderItems);
        // Reset form
        setNewItemData({
          orderServiceMappingId: order.orderServiceMappings?.[0]?.id || 0,
          itemName: '',
          itemType: 'clothing',
          quantity: 1,
          pricePerItem: 0,
          notes: ''
        });
        onRefresh(); // Refresh the order data
        showToast('Order item added successfully', 'success');
      } else {
        const errorData = await response.json() as ErrorResponse;
        showToast(errorData.error || 'Failed to add order item', 'error');
      }
    } catch (error) {
      console.error('Error adding order item:', error);
      showToast('Failed to add order item', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get service name for display
  const getServiceName = useCallback((orderServiceMappingId: number) => {
    const mapping = order.orderServiceMappings?.find(m => m.id === orderServiceMappingId);
    return mapping?.service.displayName || 'Unknown Service';
  }, [order.orderServiceMappings]);

  // Edit item handlers
  const openEditModal = (item: OrderItem) => {
    setEditItemData(item);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditItemData(null);
  };
  const handleEditItemChange = (field: keyof OrderItem, value: any) => {
    if (!editItemData) return;
    setEditItemData({ ...editItemData, [field]: value });
  };
  const handleEditItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItemData) return;
    setEditLoading(true);
    try {
      const response = await fetch('/api/admin/update-order-item', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItemId: editItemData.id,
          itemName: editItemData.itemName,
          itemType: editItemData.itemType,
          quantity: editItemData.quantity,
          pricePerItem: editItemData.pricePerItem,
          notes: editItemData.notes,
        }),
      });
      if (response.ok) {
        showToast('Order item updated successfully', 'success');
        closeEditModal();
        onRefresh();
      } else {
        const errorData: any = await response.json();
        showToast(errorData.error || 'Failed to update order item', 'error');
      }
    } catch (error) {
      showToast('Failed to update order item', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Fetch processing info on refresh
  useEffect(() => {
    setProcessing(order.orderProcessing || null);
  }, [order.orderProcessing]);

  // Find processing detail for an item
  const getProcessingDetail = (itemId: number) => {
    if (!processing?.processingItems) return null;
    return processing.processingItems
      .flatMap((pi: any) => pi.processingItemDetails)
      .find((detail: any) => detail.orderItem.id === itemId);
  };

  // Status helpers
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1" />;
      case 'IN_PROGRESS':
        return <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1" />;
      case 'ISSUE_REPORTED':
        return <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1" />;
      case 'PENDING':
        return <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mr-1" />;
      default:
        return <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mr-1" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'ISSUE_REPORTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const isAllItemsCompleted = () => {
    if (!processing?.processingItems) return false;
    return processing.processingItems.every((pi: any) =>
              pi.processingItemDetails.every((detail: any) => detail.status === 'COMPLETED')
    );
  };

  // Start processing handler
  const handleStartProcessing = async () => {
    setProcessingLoading(true);
    try {
      const response = await fetch('/api/admin/processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          totalPieces: null,
          totalWeight: null,
          processingNotes: 'Processing started by admin'
        })
      });
      if (response.ok) {
        showToast('Processing started!', 'success');
        onRefresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast((errorData as any).error || 'Failed to start processing', 'error');
      }
    } catch (error) {
      showToast('Failed to start processing', 'error');
    } finally {
      setProcessingLoading(false);
    }
  };

  // Open processing modal for an item
  const openProcessingModal = (detail: any) => {
    setProcessingItemDetail(detail);
    setProcessingForm({
      processedQuantity: detail.processedQuantity?.toString() || '',
      status: detail.status,
      processingNotes: detail.processingNotes || ''
    });
    setProcessingModalOpen(true);
  };
  const closeProcessingModal = () => {
    setProcessingModalOpen(false);
    setProcessingItemDetail(null);
  };
  const handleProcessingFormChange = (field: string, value: any) => {
    setProcessingForm({ ...processingForm, [field]: value });
  };
  const handleProcessingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingItemDetail) return;
    setProcessingLoading(true);
    try {
      const response = await fetch(`/api/admin/processing?orderId=${order.id}&action=updateItem`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processingItemDetailId: processingItemDetail.id,
          processedQuantity: parseInt(processingForm.processedQuantity) || 0,
          status: processingForm.status,
          processingNotes: processingForm.processingNotes,
          updateParentStatus: true
        })
      });
      if (response.ok) {
        showToast('Item processing updated!', 'success');
        closeProcessingModal();
        onRefresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast((errorData as any).error || 'Failed to update item processing', 'error');
      }
    } catch (error) {
      showToast('Failed to update item processing', 'error');
    } finally {
      setProcessingLoading(false);
    }
  };

  // Mark as ready for delivery
  const handleMarkReady = async () => {
    setMarkReadyLoading(true);
    try {
      const response = await fetch(`/api/admin/processing?orderId=${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processingStatus: OrderStatus.READY_FOR_DELIVERY,
          processingNotes: processing?.processingNotes || 'Order completed and ready for delivery'
        })
      });
      if (response.ok) {
        showToast('Order marked as ready for delivery!', 'success');
        onRefresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast((errorData as any).error || 'Failed to mark as ready', 'error');
      }
    } catch (error) {
      showToast('Failed to mark as ready', 'error');
    } finally {
      setMarkReadyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'items'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Items ({orderItems.length})
            </button>
            <button
              onClick={() => setActiveTab('add-item')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'add-item'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Add Item
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Order Information</h3>
                  <p className="text-sm text-gray-600">
                    Order #{order.orderNumber}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Order Status</h3>
                  <p className="text-sm text-gray-600">{order.status}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Order Items Summary</h3>
                <p className="text-sm text-gray-600">
                  {orderItems.length > 0 
                    ? `This order has ${orderItems.length} item(s) added. Use the Items tab to view details or Add Item tab to add more items.`
                    : "No items have been added to this order yet. Use the Add Item tab to start adding items."
                  }
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use the <strong>Items</strong> tab to view all order items</li>
                  <li>• Use the <strong>Add Item</strong> tab to add new items to the order</li>
                  <li>• Items are tracked across all roles for unified order management</li>
                </ul>
              </div>
            </div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              {/* Processing controls */}
              {!processing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-blue-800 font-medium">Processing has not started for this order.</span>
                  <button
                    onClick={handleStartProcessing}
                    disabled={processingLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processingLoading ? 'Starting...' : 'Start Processing'}
                  </button>
                </div>
              )}
              {processing && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-green-800 font-medium">
                    Processing Status: <span className="font-bold">{processing.processingStatus || 'In Progress'}</span>
                  </span>
                  {isAllItemsCompleted() && processing.processingStatus !== OrderStatus.READY_FOR_DELIVERY && (
                    <button
                      onClick={handleMarkReady}
                      disabled={markReadyLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {markReadyLoading ? 'Marking...' : 'Mark as Ready for Delivery'}
                    </button>
                  )}
                </div>
              )}
              {/* ... existing table ... */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price/Item
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processing
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderItems.map((item) => {
                      const detail = getProcessingDetail(item.id);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {getServiceName(item.orderServiceMappingId)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.itemName}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {item.itemType}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm text-gray-900 font-medium">
                              {item.quantity}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-sm text-gray-900">
                              {item.pricePerItem.toFixed(3)} BD
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {calculateOrderItemTotal(item).toFixed(3)} BD
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-600 max-w-xs">
                              {item.notes ? (
                                <div className="group relative">
                                  <div className="truncate cursor-help" title={item.notes}>
                                    {item.notes}
                                  </div>
                                  <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 max-w-xs break-words">
                                    {item.notes}
                                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {processing && detail ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(detail.status)}`}>{getStatusIcon(detail.status)}{detail.status.replace('_', ' ')}</span>
                                <span className="text-xs text-gray-600">Processed: {detail.processedQuantity}/{detail.quantity}</span>
                                <button
                                  onClick={() => openProcessingModal(detail)}
                                  className="text-blue-600 hover:text-blue-800 text-xs border border-blue-200 rounded px-2 py-1 mt-1"
                                  disabled={processingLoading}
                                >
                                  Update
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">{processing ? 'Not started' : '-'}</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-blue-600 hover:text-blue-800 text-xs border border-blue-200 rounded px-2 py-1 ml-2"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                        {orderItems.reduce((sum, item) => sum + calculateOrderItemTotal(item), 0).toFixed(3)} BD
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {/* Processing Modal */}
              {processingModalOpen && processingItemDetail && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">Update Item Processing</h3>
                    <form onSubmit={handleProcessingSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Processed Quantity</label>
                        <input
                          type="number"
                          min={0}
                          max={processingItemDetail.quantity}
                          value={processingForm.processedQuantity}
                          onChange={e => handleProcessingFormChange('processedQuantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Total: {processingItemDetail.quantity}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                          value={processingForm.status}
                          onChange={e => handleProcessingFormChange('status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                                              <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ISSUE_REPORTED">Issue Reported</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Processing Notes</label>
                        <textarea
                          value={processingForm.processingNotes}
                          onChange={e => handleProcessingFormChange('processingNotes', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          type="button"
                          onClick={closeProcessingModal}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          disabled={processingLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          disabled={processingLoading}
                        >
                          {processingLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              {/* ... existing edit modal ... */}
            </div>
          )}

          {/* Add Item Tab */}
          {activeTab === 'add-item' && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Items</h3>
                    <p className="text-sm text-gray-600">
                      Add individual items to this order. Select a service and choose from available pricing items.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {order.orderServiceMappings?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500">Services Available</div>
                  </div>
                </div>
              </div>

              {/* Service Selection */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">1. Select Service</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.orderServiceMappings?.map((mapping) => (
                    <button
                      key={mapping.id}
                      onClick={() => setNewItemData({...newItemData, orderServiceMappingId: mapping.id})}
                      className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                        newItemData.orderServiceMappingId === mapping.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{mapping.service.displayName}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {mapping.service.unit === 'piece' ? 'Per Item' : 'Per KG'}
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        Base Price: BD {mapping.service.price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Item Selection - Only show if service is selected */}
              {newItemData.orderServiceMappingId > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">2. Select Item</h4>
                  
                  {!servicePricing || servicePricing.serviceId !== order.orderServiceMappings?.find(m => m.id === newItemData.orderServiceMappingId)?.service.id ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading pricing options...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Quick Selection Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {servicePricing.categories.flatMap(category => 
                          category.items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => setNewItemData({
                                ...newItemData, 
                                itemName: item.displayName,
                                pricePerItem: item.price
                              })}
                              className={`p-3 border rounded-lg text-left transition-all duration-200 ${
                                newItemData.itemName === item.displayName
                                  ? 'border-green-500 bg-green-50 shadow-md'
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }`}
                            >
                              <div className="font-medium text-gray-900">{item.displayName}</div>
                              <div className="text-sm text-gray-500">{category.displayName}</div>
                              <div className="text-lg font-semibold text-green-600 mt-1">
                                BD {item.price.toFixed(2)}
                              </div>
                              {item.isDefault && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                                  Default
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Custom Item Input */}
                      <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Or enter custom item name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter custom item name..."
                          value={newItemData.itemName}
                          onChange={(e) => setNewItemData({...newItemData, itemName: e.target.value})}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Item Details - Only show if item is selected */}
              {newItemData.itemName && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">3. Item Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setNewItemData({...newItemData, quantity: Math.max(1, newItemData.quantity - 1)})}
                          className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={newItemData.quantity}
                          onChange={(e) => setNewItemData({...newItemData, quantity: parseInt(e.target.value) || 1})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => setNewItemData({...newItemData, quantity: newItemData.quantity + 1})}
                          className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price per Item (BD)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newItemData.pricePerItem}
                          onChange={(e) => setNewItemData({...newItemData, pricePerItem: parseFloat(e.target.value) || 0})}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {newItemData.pricePerItem > 0 && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                              Set
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Button */}
              {newItemData.itemName && newItemData.quantity > 0 && newItemData.pricePerItem > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <button
                    onClick={handleAddOrderItem}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Adding Item...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Item to Order
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Item Modal */}
      {editModalOpen && editItemData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Order Item</h3>
            <form onSubmit={handleEditItemSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={editItemData.itemName}
                  onChange={e => handleEditItemChange('itemName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                <select
                  value={editItemData.itemType}
                  onChange={e => handleEditItemChange('itemType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="clothing">Clothing</option>
                  <option value="bedding">Bedding & Linens</option>
                  <option value="accessories">Accessories</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={editItemData.quantity}
                  onChange={e => handleEditItemChange('quantity', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Item (BD)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={editItemData.pricePerItem}
                  onChange={e => handleEditItemChange('pricePerItem', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editItemData.notes || ''}
                  onChange={e => handleEditItemChange('notes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 

export default function OrderEditPage() {
  return (
    <ToastProvider>
      <OrderEditPageContent />
    </ToastProvider>
  );
} 