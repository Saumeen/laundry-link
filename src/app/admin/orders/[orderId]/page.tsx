"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminHeader from "@/components/admin/AdminHeader";
import { UserRole, DriverAssignment } from "@/types/global";
import { calculateInvoiceItemTotal } from "@/lib/calculations";
import { useToast, ToastProvider } from "@/components/ui/Toast";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Link from "next/link";

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
    city: string;
    contactNumber?: string;
    locationType?: string;
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
  }>;
  invoiceItems: InvoiceItem[];
  driverAssignments?: DriverAssignment[];
  specialInstructions?: string;
  invoiceTotal?: number;
  minimumOrderApplied?: boolean;
}

interface InvoiceItem {
  id: number;
  orderServiceMappingId: number;
  quantity: number;
  pricePerItem: number;
  notes?: string;
  orderServiceMapping?: {
    service: {
      displayName: string;
    };
  };
}

interface Service {
  id: number;
  name: string;
  displayName: string;
  price: number;
  unit: string;
  description?: string;
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

interface InvoiceItemsResponse {
  invoiceItems: InvoiceItem[];
}

type TabType = 'overview' | 'edit' | 'assignments' | 'services' | 'invoice';

// Tab Button Component
const TabButton = ({ 
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
);

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

  const orderId = params.orderId as string;

  // Determine the correct back URL based on user role
  const getBackUrl = useCallback(() => {
    if (!session?.role) return '/admin/orders';
    
    const role = session.role as UserRole;
    switch (role) {
      case 'SUPER_ADMIN':
        return '/admin/super-admin';
      case 'OPERATION_MANAGER':
        return '/admin/operation-manager';
      case 'DRIVER':
        return '/admin/driver';
      case 'FACILITY_TEAM':
        return '/admin/facility-team';
      default:
        return '/admin/orders';
    }
  }, [session?.role]);

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

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <TabButton
                isActive={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </TabButton>
              <TabButton
                isActive={activeTab === 'edit'}
                onClick={() => setActiveTab('edit')}
              >
                Edit Order
              </TabButton>
              <TabButton
                isActive={activeTab === 'assignments'}
                onClick={() => setActiveTab('assignments')}
                count={order.driverAssignments?.length || 0}
              >
                Driver Assignments
              </TabButton>
              <TabButton
                isActive={activeTab === 'services'}
                onClick={() => setActiveTab('services')}
                count={order.orderServiceMappings?.length || 0}
              >
                Services Requested
              </TabButton>
              <TabButton
                isActive={activeTab === 'invoice'}
                onClick={() => setActiveTab('invoice')}
                count={order.invoiceItems?.length || 0}
              >
                Invoice Items
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
            {activeTab === 'invoice' && (
              <InvoiceItemsTab order={order} onRefresh={fetchOrder} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OrderOverviewTab({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            <p className="text-gray-700">{order.address.city}</p>
            {order.address.contactNumber && (
              <p className="text-gray-600 text-sm">Contact: {order.address.contactNumber}</p>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
      console.error('Error updating order:', error);
      setError('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Edit Order Details</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Order Placed">Order Placed</option>
            <option value="Picked Up">Picked Up</option>
            <option value="In Process">In Process</option>
            <option value="Ready for Delivery">Ready for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Instructions
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special instructions for this order..."
          />
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
  }, [order.id]);

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
  }, [selectedPickupDriver, selectedDeliveryDriver, pickupEstimatedTime, deliveryEstimatedTime, pickupNotes, deliveryNotes, validateDateTime, order.id, loadDriverAssignments, showToast]);

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
  }, [editingAssignment, editDriverId, driverAssignments, validateEditDateTime, editEstimatedTime, editNotes, loadDriverAssignments, cancelEditing, showToast]);

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
  }, [assignmentToDelete, loadDriverAssignments, showToast]);

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
                          assignment.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
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
                        }}
                        min={new Date().toISOString().slice(0, 16)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          pickupTimeError ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {pickupTimeError && (
                        <p className="text-red-600 text-sm mt-1">{pickupTimeError}</p>
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
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Services Requested by Customer</h3>
      
      {order.orderServiceMappings && order.orderServiceMappings.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.orderServiceMappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {mapping.service.displayName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {mapping.service.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {mapping.quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {mapping.price.toFixed(3)} BD
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {(mapping.quantity * mapping.price).toFixed(3)} BD
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No services requested for this order.</p>
        </div>
      )}
    </div>
  );
}

// Invoice Items Tab Component
function InvoiceItemsTab({ order, onRefresh }: { order: Order; onRefresh: () => void }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>(order.invoiceItems || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  
  // Form states for new invoice item
  const [newInvoiceItem, setNewInvoiceItem] = useState({
    orderServiceMappingId: '',
    quantity: 1,
    pricePerItem: 0,
    notes: '',
  });
  
  // Form states for editing
  const [editInvoiceItem, setEditInvoiceItem] = useState({
    orderServiceMappingId: '',
    quantity: 1,
    pricePerItem: 0,
    notes: '',
  });

  // Validation states
  const [errors, setErrors] = useState<{
    orderServiceMappingId?: string;
    quantity?: string;
    pricePerItem?: string;
    notes?: string;
  }>({});

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Reset form when order changes
  useEffect(() => {
    setInvoiceItems(order.invoiceItems || []);
  }, [order.invoiceItems]);

  const validateForm = (data: typeof newInvoiceItem) => {
    const newErrors: typeof errors = {};
    
    if (!data.orderServiceMappingId) {
      newErrors.orderServiceMappingId = 'Please select a service';
    }
    
    if (!data.quantity || data.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!data.pricePerItem || data.pricePerItem <= 0) {
      newErrors.pricePerItem = 'Price per item must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetNewForm = () => {
    setNewInvoiceItem({
      orderServiceMappingId: '',
      quantity: 1,
      pricePerItem: 0,
      notes: '',
    });
    setErrors({});
  };

  const resetEditForm = () => {
    setEditInvoiceItem({
      orderServiceMappingId: '',
      quantity: 1,
      pricePerItem: 0,
      notes: '',
    });
    setErrors({});
  };

  const handleAddInvoiceItem = async () => {
    if (!validateForm(newInvoiceItem)) {
      return;
    }

    setLoading(true);
    try {
      // Prepare all invoice items: existing ones plus the new one
      const allInvoiceItems = [
        ...invoiceItems.map(item => ({
          id: item.id,
          orderServiceMappingId: item.orderServiceMappingId,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          notes: item.notes,
        })),
        {
          orderServiceMappingId: parseInt(newInvoiceItem.orderServiceMappingId),
          quantity: newInvoiceItem.quantity,
          pricePerItem: newInvoiceItem.pricePerItem,
          notes: newInvoiceItem.notes,
        }
      ];

      const response = await fetch('/api/admin/add-invoice-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          invoiceItems: allInvoiceItems,
        }),
      });

      if (response.ok) {
        const data = await response.json() as InvoiceItemsResponse;
        setInvoiceItems(data.invoiceItems);
        resetNewForm();
        setShowAddForm(false);
        onRefresh(); // Refresh the order data
        showToast('Invoice item added successfully', 'success');
      } else {
        const errorData = await response.json() as ErrorResponse;
        showToast(errorData.error || 'Failed to add invoice item', 'error');
      }
    } catch (error) {
      console.error('Error adding invoice item:', error);
      showToast('Failed to add invoice item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (item: InvoiceItem) => {
    setEditingItem(item.id);
    setEditInvoiceItem({
      orderServiceMappingId: item.orderServiceMappingId.toString(),
      quantity: item.quantity,
      pricePerItem: item.pricePerItem,
      notes: item.notes || '',
    });
    setErrors({});
  };

  const cancelEditing = () => {
    setEditingItem(null);
    resetEditForm();
  };

  const handleUpdateInvoiceItem = async () => {
    if (!editingItem || !validateForm(editInvoiceItem)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/add-invoice-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          invoiceItems: [{
            id: editingItem,
            orderServiceMappingId: parseInt(editInvoiceItem.orderServiceMappingId),
            quantity: editInvoiceItem.quantity,
            pricePerItem: editInvoiceItem.pricePerItem,
          }],
        }),
      });

      if (response.ok) {
        const data = await response.json() as InvoiceItemsResponse;
        setInvoiceItems(data.invoiceItems);
        cancelEditing();
        onRefresh(); // Refresh the order data
        showToast('Invoice item updated successfully', 'success');
      } else {
        const errorData = await response.json() as ErrorResponse;
        showToast(errorData.error || 'Failed to update invoice item', 'error');
      }
    } catch (error) {
      console.error('Error updating invoice item:', error);
      showToast('Failed to update invoice item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (itemId: number) => {
    setItemToDelete(itemId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleteLoading(itemToDelete);
    try {
      // Get current invoice items excluding the one to delete
      const itemsToKeep = invoiceItems.filter(item => item.id !== itemToDelete);
      
      const response = await fetch('/api/admin/add-invoice-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          invoiceItems: itemsToKeep.map(item => ({
            id: item.id,
            orderServiceMappingId: item.orderServiceMappingId,
            quantity: item.quantity,
            pricePerItem: item.pricePerItem,
            notes: item.notes,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json() as InvoiceItemsResponse;
        setInvoiceItems(data.invoiceItems);
        onRefresh(); // Refresh the order data
        showToast('Invoice item deleted successfully', 'success');
      } else {
        const errorData = await response.json() as ErrorResponse;
        showToast(errorData.error || 'Failed to delete invoice item', 'error');
      }
    } catch (error) {
      console.error('Error deleting invoice item:', error);
      showToast('Failed to delete invoice item', 'error');
    } finally {
      setDeleteLoading(null);
      setItemToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // Get service name for display
  const getServiceName = (orderServiceMappingId: number) => {
    const mapping = order.orderServiceMappings?.find(m => m.id === orderServiceMappingId);
    return mapping?.service.displayName || 'Unknown Service';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>{showAddForm ? 'Cancel' : 'Add Invoice Item'}</span>
        </button>
      </div>

      {/* Add New Invoice Item Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Add New Invoice Item</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select
                value={newInvoiceItem.orderServiceMappingId}
                onChange={(e) => {
                  const selectedMappingId = e.target.value;
                  const selectedMapping = order.orderServiceMappings?.find(m => m.id.toString() === selectedMappingId);
                  
                  setNewInvoiceItem({ 
                    ...newInvoiceItem, 
                    orderServiceMappingId: selectedMappingId,
                    pricePerItem: selectedMapping ? selectedMapping.price : 0
                  });
                  setErrors({ ...errors, orderServiceMappingId: undefined });
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.orderServiceMappingId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Service</option>
                {order.orderServiceMappings?.map((mapping) => (
                  <option key={mapping.id} value={mapping.id}>
                    {mapping.service.displayName} - {mapping.price.toFixed(3)} BD
                  </option>
                ))}
              </select>
              {errors.orderServiceMappingId && (
                <p className="text-red-600 text-sm mt-1">{errors.orderServiceMappingId}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={newInvoiceItem.quantity}
                onChange={(e) => {
                  setNewInvoiceItem({ ...newInvoiceItem, quantity: parseInt(e.target.value) || 1 });
                  setErrors({ ...errors, quantity: undefined });
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.quantity && (
                <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Item (BD)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={newInvoiceItem.pricePerItem}
                onChange={(e) => {
                  setNewInvoiceItem({ ...newInvoiceItem, pricePerItem: parseFloat(e.target.value) || 0 });
                  setErrors({ ...errors, pricePerItem: undefined });
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.pricePerItem ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.pricePerItem && (
                <p className="text-red-600 text-sm mt-1">{errors.pricePerItem}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={newInvoiceItem.notes}
                onChange={(e) => {
                  setNewInvoiceItem({ ...newInvoiceItem, notes: e.target.value });
                  setErrors({ ...errors, notes: undefined });
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.notes ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.notes && (
                <p className="text-red-600 text-sm mt-1">{errors.notes}</p>
              )}
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleAddInvoiceItem}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Items Table */}
      {invoiceItems && invoiceItems.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Service
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Price/Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoiceItems.map((item) => {
                  const isEditing = editingItem === item.id;
                  
                  if (isEditing) {
                    return (
                      <tr key={item.id} className="bg-blue-50 hover:bg-blue-100 transition-colors">
                        <td className="px-4 py-4">
                          <select
                            value={editInvoiceItem.orderServiceMappingId}
                            onChange={(e) => {
                              const selectedMappingId = e.target.value;
                              const selectedMapping = order.orderServiceMappings?.find(m => m.id.toString() === selectedMappingId);
                              
                              setEditInvoiceItem({ 
                                ...editInvoiceItem, 
                                orderServiceMappingId: selectedMappingId,
                                pricePerItem: selectedMapping ? selectedMapping.price : 0
                              });
                              setErrors({ ...errors, orderServiceMappingId: undefined });
                            }}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                              errors.orderServiceMappingId ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select Service</option>
                            {order.orderServiceMappings?.map((mapping) => (
                              <option key={mapping.id} value={mapping.id}>
                                {mapping.service.displayName} - {mapping.price.toFixed(3)} BD
                              </option>
                            ))}
                          </select>
                          {errors.orderServiceMappingId && (
                            <p className="text-red-600 text-xs mt-1">{errors.orderServiceMappingId}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="number"
                            min="1"
                            value={editInvoiceItem.quantity}
                            onChange={(e) => {
                              setEditInvoiceItem({ ...editInvoiceItem, quantity: parseInt(e.target.value) || 1 });
                              setErrors({ ...errors, quantity: undefined });
                            }}
                            className={`w-16 px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center ${
                              errors.quantity ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.quantity && (
                            <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={editInvoiceItem.pricePerItem}
                            onChange={(e) => {
                              setEditInvoiceItem({ ...editInvoiceItem, pricePerItem: parseFloat(e.target.value) || 0 });
                              setErrors({ ...errors, pricePerItem: undefined });
                            }}
                            className={`w-20 px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right ${
                              errors.pricePerItem ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors.pricePerItem && (
                            <p className="text-red-600 text-xs mt-1">{errors.pricePerItem}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="text"
                            value={editInvoiceItem.notes}
                            onChange={(e) => {
                              setEditInvoiceItem({ ...editInvoiceItem, notes: e.target.value });
                              setErrors({ ...errors, notes: undefined });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Optional notes..."
                          />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {(editInvoiceItem.quantity * editInvoiceItem.pricePerItem).toFixed(3)} BD
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex space-x-1 justify-center">
                            <button
                              onClick={handleUpdateInvoiceItem}
                              disabled={loading}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {loading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getServiceName(item.orderServiceMappingId)}
                        </div>
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
                      <td className="px-4 py-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {calculateInvoiceItemTotal(item).toFixed(3)} BD
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex space-x-1 justify-center">
                          <button
                            onClick={() => startEditing(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item.id)}
                            disabled={deleteLoading === item.id}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                            title="Delete item"
                          >
                            {deleteLoading === item.id ? (
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No invoice items found for this order.</p>
          <p className="text-sm text-gray-400 mt-2">
            Invoice items are created when the order is processed and actual quantities are determined.
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        title="Delete Invoice Item"
        message="Are you sure you want to delete this invoice item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
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