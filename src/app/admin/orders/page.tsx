"use client";

import { useState, useEffect, useCallback, memo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminHeader from "@/components/admin/AdminHeader";
import { UserRole, DriverAssignment } from "@/types/global";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
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
  invoiceItems: InvoiceItem[];
  driverAssignments?: DriverAssignment[];
}

interface InvoiceItem {
  id: number;
  itemType: string;
  quantity: number | string;
  pricePerItem: number | string;
  totalPrice: number;
}

interface Service {
  id: number;
  name: string;
  displayName: string;
  price: number;
  unit: string;
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

// Tab component for the modal
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

const OrderModal = memo(({ 
  order, 
  isOpen, 
  onClose, 
  onUpdate
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (orderId: number, data: any) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'drivers' | 'invoice'>('details');
  const [status, setStatus] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverAssignments, setDriverAssignments] = useState<DriverAssignment[]>([]);
  const [selectedPickupDriver, setSelectedPickupDriver] = useState<number | ''>('');
  const [selectedDeliveryDriver, setSelectedDeliveryDriver] = useState<number | ''>('');
  const [pickupEstimatedTime, setPickupEstimatedTime] = useState('');
  const [deliveryEstimatedTime, setDeliveryEstimatedTime] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [timeValidationError, setTimeValidationError] = useState('');
  const [pickupValidationError, setPickupValidationError] = useState('');
  const [deliveryValidationError, setDeliveryValidationError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);



  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPickupTime(order.pickupTime ? new Date(order.pickupTime).toISOString().slice(0, 16) : '');
      setDeliveryTime(order.deliveryTime ? new Date(order.deliveryTime).toISOString().slice(0, 16) : '');
      setInvoiceItems(order.invoiceItems || []);
      
      // Load drivers and assignments
      loadDrivers();
      loadDriverAssignments();
    }
  }, [order]);

  // Validation helper functions
  const validateOrderTimes = useCallback(() => {
    if (pickupTime && deliveryTime) {
      const pickupDate = new Date(pickupTime);
      const deliveryDate = new Date(deliveryTime);
      
      if (deliveryDate <= pickupDate) {
        setTimeValidationError('Delivery time must be after pickup time');
        return false;
      }
    }
    setTimeValidationError('');
    return true;
  }, [pickupTime, deliveryTime]);

  const validateDriverAssignmentTimes = useCallback((assignmentType: 'pickup' | 'delivery') => {
    if (assignmentType === 'delivery' && deliveryEstimatedTime && pickupEstimatedTime) {
      const deliveryDate = new Date(deliveryEstimatedTime);
      const pickupDate = new Date(pickupEstimatedTime);
      
      if (deliveryDate <= pickupDate) {
        setDeliveryValidationError('Delivery time must be after pickup time');
        return 'Delivery time must be after pickup time';
      } else {
        setDeliveryValidationError('');
      }
    }

    if (assignmentType === 'pickup' && pickupEstimatedTime && deliveryEstimatedTime) {
      const pickupDate = new Date(pickupEstimatedTime);
      const deliveryDate = new Date(deliveryEstimatedTime);
      
      if (pickupDate >= deliveryDate) {
        setPickupValidationError('Pickup time must be before delivery time');
        return 'Pickup time must be before delivery time';
      } else {
        setPickupValidationError('');
      }
    }
    
    return '';
  }, [pickupEstimatedTime, deliveryEstimatedTime]);

  const loadDrivers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      if (response.ok) {
        const data = await response.json() as { drivers?: Driver[] };
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error('Error loading drivers:', error as Error);
    }
  }, []);

  const loadDriverAssignments = useCallback(async () => {
    if (!order) return;
    
    try {
      const response = await fetch(`/api/admin/driver-assignments?orderId=${order.id}`);
      if (response.ok) {
        const data = await response.json() as { assignments?: DriverAssignment[] };
        setDriverAssignments(data.assignments || []);
        
        // Set existing assignments
        const pickupAssignment = data.assignments?.find((a: DriverAssignment) => a.assignmentType === 'pickup');
        const deliveryAssignment = data.assignments?.find((a: DriverAssignment) => a.assignmentType === 'delivery');
        
        // Reset pickup assignment fields
        if (pickupAssignment) {
          setSelectedPickupDriver(pickupAssignment.driverId);
          setPickupEstimatedTime(pickupAssignment.estimatedTime ? new Date(pickupAssignment.estimatedTime).toISOString().slice(0, 16) : '');
          setPickupNotes(pickupAssignment.notes || '');
        } else {
          // Clear pickup fields if no assignment exists
          setSelectedPickupDriver('');
          setPickupEstimatedTime('');
          setPickupNotes('');
          setPickupValidationError('');
        }
        
        // Reset delivery assignment fields
        if (deliveryAssignment) {
          setSelectedDeliveryDriver(deliveryAssignment.driverId);
          setDeliveryEstimatedTime(deliveryAssignment.estimatedTime ? new Date(deliveryAssignment.estimatedTime).toISOString().slice(0, 16) : '');
          setDeliveryNotes(deliveryAssignment.notes || '');
        } else {
          // Clear delivery fields if no assignment exists
          setSelectedDeliveryDriver('');
          setDeliveryEstimatedTime('');
          setDeliveryNotes('');
          setDeliveryValidationError('');
        }
      }
    } catch (error) {
      console.error('Error loading driver assignments:', error);
    }
  }, [order]);

  // Force reload assignments when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadDriverAssignments();
    }
  }, [refreshTrigger, loadDriverAssignments]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    // Validate pickup and delivery times
    if (!validateOrderTimes()) {
      return;
    }

    setLoading(true);
    try {
      await onUpdate(order.id, {
        status,
        pickupTime,
        deliveryTime
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating order:', error);
      // You could add a toast notification here for better UX
    } finally {
      setLoading(false);
    }
  }, [order, status, pickupTime, deliveryTime, validateOrderTimes, onUpdate, onClose]);



  const assignDriver = useCallback(async (assignmentType: 'pickup' | 'delivery') => {
    if (!order) return;
    
    const driverId = assignmentType === 'pickup' ? selectedPickupDriver : selectedDeliveryDriver;
    const estimatedTime = assignmentType === 'pickup' ? pickupEstimatedTime : deliveryEstimatedTime;
    const notes = assignmentType === 'pickup' ? pickupNotes : deliveryNotes;
    
    if (!driverId) {
      alert(`Please select a driver for ${assignmentType}`);
      return;
    }

    // Validation for driver assignment times
    const validationError = validateDriverAssignmentTimes(assignmentType);
    if (validationError) {
      alert(validationError);
      return;
    }
    
    setAssignmentLoading(true);
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
        await loadDriverAssignments(); // Reload assignments
        alert(`Driver assigned for ${assignmentType} successfully`);
      } else {
        const error = await response.json() as { error?: string };
        alert(error.error || `Failed to assign driver for ${assignmentType}`);
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert(`Failed to assign driver for ${assignmentType}`);
    } finally {
      setAssignmentLoading(false);
    }
  }, [order, selectedPickupDriver, selectedDeliveryDriver, pickupEstimatedTime, deliveryEstimatedTime, pickupNotes, deliveryNotes, loadDriverAssignments]);

  const updateDriverAssignment = useCallback(async (assignmentId: number, data: any) => {
    setAssignmentLoading(true);
    try {
      const response = await fetch(`/api/admin/driver-assignments?id=${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        await loadDriverAssignments(); // Reload assignments
        alert('Driver assignment updated successfully');
      } else {
        const error = await response.json() as { error?: string };
        alert(error.error || 'Failed to update driver assignment');
      }
    } catch (error) {
      console.error('Error updating driver assignment:', error);
      alert('Failed to update driver assignment');
    } finally {
      setAssignmentLoading(false);
    }
  }, [loadDriverAssignments]);

  const cancelDriverAssignment = useCallback(async (assignmentId: number) => {
    if (!confirm('Are you sure you want to cancel this driver assignment?')) return;
    
    setAssignmentLoading(true);
    try {
      console.log('Cancelling assignment:', assignmentId);
      const response = await fetch(`/api/admin/driver-assignments?id=${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled'
        }),
      });
      
      if (response.ok) {
        console.log('Assignment cancelled successfully, reloading...');
        // Add a small delay to ensure the cancellation is processed
        setTimeout(async () => {
          await loadDriverAssignments(); // Reload assignments
          setRefreshTrigger(prev => prev + 1); // Force re-render
        }, 100);
        alert('Driver assignment cancelled successfully');
      } else {
        const error = await response.json() as { error?: string };
        console.error('Cancel failed:', error);
        alert(error.error || 'Failed to cancel driver assignment');
      }
    } catch (error) {
      console.error('Error cancelling driver assignment:', error);
      alert('Failed to cancel driver assignment');
    } finally {
      setAssignmentLoading(false);
    }
  }, [loadDriverAssignments]);

  const deleteDriverAssignment = useCallback(async (assignmentId: number) => {
    if (!confirm('Are you sure you want to permanently delete this driver assignment? This action cannot be undone.')) return;
    
    setAssignmentLoading(true);
    try {
      console.log('Deleting assignment:', assignmentId);
      const response = await fetch(`/api/admin/driver-assignments?id=${assignmentId}&action=delete`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        console.log('Assignment deleted successfully, reloading...');
        // Add a small delay to ensure the deletion is processed
        setTimeout(async () => {
          await loadDriverAssignments(); // Reload assignments
          setRefreshTrigger(prev => prev + 1); // Force re-render
        }, 100);
        alert('Driver assignment deleted successfully');
      } else {
        const error = await response.json() as { error?: string };
        console.error('Delete failed:', error);
        alert(error.error || 'Failed to delete driver assignment');
      }
    } catch (error) {
      console.error('Error deleting driver assignment:', error);
      alert('Failed to delete driver assignment');
    } finally {
      setAssignmentLoading(false);
    }
  }, [loadDriverAssignments]);

  // Invoice Items functions
  const updateInvoiceItem = useCallback((index: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      // Recalculate total price
      const quantity = parseFloat(updatedItems[index].quantity.toString()) || 0;
      const pricePerItem = parseFloat(updatedItems[index].pricePerItem.toString()) || 0;
      updatedItems[index].totalPrice = quantity * pricePerItem;
      
      return updatedItems;
    });
  }, []);

  const addInvoiceItem = useCallback(() => {
    const newItem: InvoiceItem = {
      id: Date.now(), // Temporary ID for new items
      itemType: '',
      quantity: 1,
      pricePerItem: 0,
      totalPrice: 0
    };
    setInvoiceItems(prevItems => [...prevItems, newItem]);
  }, []);

  const removeInvoiceItem = useCallback((index: number) => {
    if (confirm('Are you sure you want to remove this invoice item?')) {
      setInvoiceItems(prevItems => prevItems.filter((_, i) => i !== index));
    }
  }, []);

  const saveInvoiceItems = useCallback(async () => {
    if (!order) return;
    
    setInvoiceLoading(true);
    try {
      // Transform the data to match API expectations
      const transformedItems = invoiceItems.map(item => ({
        id: item.id,
        itemType: item.itemType,
        quantity: item.quantity,
        unitPrice: item.pricePerItem, // API expects unitPrice
        totalPrice: item.totalPrice,
        serviceType: 'laundry' // Default service type
      }));

      const response = await fetch(`/api/admin/add-invoice-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          invoiceItems: transformedItems
        }),
      });
      
      if (response.ok) {
        alert('Invoice items updated successfully');
        // Refresh the order data
        onUpdate(order.id, { refresh: true });
      } else {
        const error = await response.json() as { error?: string };
        alert(error.error || 'Failed to update invoice items');
      }
    } catch (error) {
      console.error('Error updating invoice items:', error);
      alert('Failed to update invoice items');
    } finally {
      setInvoiceLoading(false);
    }
  }, [order, onUpdate]);

  if (!isOpen || !order) return null;

  // Tab content components
  const OrderDetailsTab = () => (
    <div className="space-y-6">
      {/* Order Status */}
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
          <option value="Processing">Processing</option>
          <option value="Ready for Delivery">Ready for Delivery</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Pickup and Delivery Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pickup Time
          </label>
          <input
            type="datetime-local"
            value={pickupTime}
            onChange={(e) => {
              setPickupTime(e.target.value);
              setTimeout(() => validateOrderTimes(), 100);
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              timeValidationError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Time
          </label>
          <input
            type="datetime-local"
            value={deliveryTime}
            onChange={(e) => {
              setDeliveryTime(e.target.value);
              setTimeout(() => validateOrderTimes(), 100);
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              timeValidationError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
      </div>
      {timeValidationError && (
        <div className="text-red-600 text-sm mt-1">
          {timeValidationError}
        </div>
      )}


    </div>
  );

  const DriverAssignmentsTab = () => (
    <div className="space-y-6">
      {/* Current Assignments */}
      {driverAssignments.length > 0 && (
        <div className="mb-4 space-y-3">
          <h5 className="text-sm font-medium text-gray-700">Current Assignments</h5>
          {driverAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {assignment.assignmentType === 'pickup' ? 'Pickup' : 'Delivery'} Driver:
                    </span>
                    <span className="text-sm text-gray-700">
                      {assignment.driver.firstName} {assignment.driver.lastName}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      assignment.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                      assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      assignment.status === 'cancelled' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {assignment.status.replace('_', ' ')}
                    </span>
                  </div>
                  {assignment.estimatedTime && (
                    <div className="text-sm text-gray-600 mt-1">
                      Estimated: {new Date(assignment.estimatedTime).toLocaleString()}
                    </div>
                  )}
                  {assignment.notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      Notes: {assignment.notes}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {assignment.status !== 'cancelled' && assignment.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => updateDriverAssignment(assignment.id, { status: 'in_progress' })}
                      disabled={assignmentLoading || assignment.status !== 'assigned'}
                      className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Start
                    </button>
                  )}
                  {assignment.status !== 'cancelled' && assignment.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => updateDriverAssignment(assignment.id, { status: 'completed' as const })}
                      disabled={assignmentLoading || (assignment.status as string) === 'completed'}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Complete
                    </button>
                  )}
                  {assignment.status !== 'cancelled' && assignment.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => cancelDriverAssignment(assignment.id)}
                      disabled={assignmentLoading}
                      className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 disabled:opacity-50"
                      title="Cancel assignment (mark as cancelled)"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteDriverAssignment(assignment.id)}
                    disabled={assignmentLoading}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                    title="Permanently delete assignment"
                  >
                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Assignment Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pickup Assignment */}
        <div className="border rounded-md p-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Assign Pickup Driver</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Driver</label>
              <select
                value={selectedPickupDriver}
                onChange={(e) => setSelectedPickupDriver(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Driver</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.firstName} {driver.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Time</label>
              <input
                type="datetime-local"
                value={pickupEstimatedTime}
                onChange={(e) => {
                  setPickupEstimatedTime(e.target.value);
                  setTimeout(() => validateDriverAssignmentTimes('pickup'), 100);
                }}
                className={`w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  pickupValidationError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {pickupValidationError && (
                <div className="text-red-600 text-xs mt-1">
                  {pickupValidationError}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input
                type="text"
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
                placeholder="Optional notes..."
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => assignDriver('pickup')}
              disabled={assignmentLoading || !selectedPickupDriver || !!pickupValidationError}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {assignmentLoading ? 'Assigning...' : 'Assign Pickup Driver'}
            </button>
          </div>
        </div>

        {/* Delivery Assignment */}
        <div className="border rounded-md p-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Assign Delivery Driver</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Driver</label>
              <select
                value={selectedDeliveryDriver}
                onChange={(e) => setSelectedDeliveryDriver(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Driver</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.firstName} {driver.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Time</label>
              <input
                type="datetime-local"
                value={deliveryEstimatedTime}
                onChange={(e) => {
                  setDeliveryEstimatedTime(e.target.value);
                  setTimeout(() => validateDriverAssignmentTimes('delivery'), 100);
                }}
                className={`w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  deliveryValidationError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {deliveryValidationError && (
                <div className="text-red-600 text-xs mt-1">
                  {deliveryValidationError}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Optional notes..."
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => assignDriver('delivery')}
              disabled={assignmentLoading || !selectedDeliveryDriver || !!deliveryValidationError}
              className="w-full bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {assignmentLoading ? 'Assigning...' : 'Assign Delivery Driver'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const InvoiceItemsTab = () => {
    const totalAmount = invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    return (
      <div className="space-y-6">
        {/* Invoice Items List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h5 className="text-sm font-medium text-gray-700">Invoice Items</h5>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={saveInvoiceItems}
                disabled={invoiceLoading || invoiceItems.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {invoiceLoading ? 'Saving...' : 'Save Invoice Items'}
              </button>
              <button
                type="button"
                onClick={addInvoiceItem}
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Add Item
              </button>
            </div>
          </div>
          
          {invoiceItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No invoice items found. Click "Add Item" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {invoiceItems.map((item, index) => (
                <div key={index} className="border rounded-md p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    {/* Item Type */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Item Type</label>
                      <input
                        type="text"
                        value={item.itemType}
                        onChange={(e) => updateInvoiceItem(index, 'itemType', e.target.value)}
                        placeholder="e.g., Shirts, Pants, etc."
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Price Per Item */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Price/Item (BD)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.pricePerItem}
                        onChange={(e) => updateInvoiceItem(index, 'pricePerItem', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Total Price */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Total (BD)</label>
                      <div className="w-full px-2 py-1 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-900">
                        {item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeInvoiceItem(index)}
                        className="w-full bg-red-600 text-white px-2 py-1 rounded-md text-xs hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  

                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Total Amount */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">Total Amount:</span>
            <span className="text-lg font-bold text-blue-600">BD {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={onClose}>
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="mt-3">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Update Order #{order.orderNumber}
              </h3>
              <div className="text-sm text-gray-600 mt-1">
                Customer: {order.customer.firstName} {order.customer.lastName} | {order.customer.email}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Created: {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <TabButton
                isActive={activeTab === 'details'}
                onClick={() => setActiveTab('details')}
              >
                Order Details
              </TabButton>
              <TabButton
                isActive={activeTab === 'drivers'}
                onClick={() => setActiveTab('drivers')}
                count={driverAssignments.length}
              >
                Driver Assignments
              </TabButton>
              <TabButton
                isActive={activeTab === 'invoice'}
                onClick={() => setActiveTab('invoice')}
                count={invoiceItems.length}
              >
                Invoice Items
              </TabButton>
            </nav>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'details' && <OrderDetailsTab />}
              {activeTab === 'drivers' && <DriverAssignmentsTab />}
              {activeTab === 'invoice' && <InvoiceItemsTab />}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !!timeValidationError}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

OrderModal.displayName = 'OrderModal';

export default function OrdersManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState(false); // New sorting state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [orderStatusUpdatingId, setOrderStatusUpdatingId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<'orderNumber' | 'customerName' | 'status' | 'totalAmount' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Determine the correct back URL based on user role
  const getBackUrl = useCallback(() => {
    if (!session?.role) return '/admin';
    
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
        return '/admin';
    }
  }, [session?.role]);

  const fetchOrders = useCallback(async (isSorting = false) => {
    if (isSorting) {
      setSorting(true);
    }
    
    try {
      const params = new URLSearchParams({
        sortField,
        sortDirection,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      const response = await fetch(`/api/admin/orders-detailed?${params}`);
      if (response.ok) {
        const data = await response.json() as { orders: Order[]; total: number; totalPages: number };
        setOrders(data.orders);
        setTotalOrders(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      if (isSorting) {
        setSorting(false);
      }
    }
  }, [sortField, sortDirection, page, pageSize]);



  const updateOrder = useCallback(async (orderId: number, data: any) => {
    try {
      const response = await fetch(`/api/admin/update-order/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchOrders(); // Refresh orders
        return true;
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }, [fetchOrders]);



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

    fetchOrders();
  }, [status, session, router, fetchOrders]);


  const handleEditOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  }, []);

  // Helper functions for sorting - MUST be defined before any conditional returns
  const handleSort = useCallback((field: typeof sortField) => {
    if (sorting) return; // Prevent multiple simultaneous sorts
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Trigger fetch with sorting indicator
    fetchOrders(true);
  }, [sorting, sortField, sortDirection, fetchOrders]);
  
  const renderSortIcon = useCallback((field: typeof sortField) => {
    if (sortField !== field) {
      // Show default sort icon for unsorted columns
      return (
        <svg className="inline w-3 h-3 ml-1 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    // Show loading spinner when sorting
    if (sorting) {
      return (
        <svg className="inline w-3 h-3 ml-1 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    
    // Show direction arrows
    return sortDirection === 'asc' ? (
      <svg className="inline w-3 h-3 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="inline w-3 h-3 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  }, [sorting, sortField, sortDirection]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading Order Management...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch order data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 animate-fadeIn">
      {/* Header */}
      <AdminHeader
        title="Order Management"
        subtitle="View and manage customer orders"
        backUrl={getBackUrl()}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">


          {/* Sorting Indicator */}
          {sorting && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-md">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Sorting orders by {sortField.replace(/([A-Z])/g, ' $1').toLowerCase()} ({sortDirection === 'asc' ? 'ascending' : 'descending'})
                  </p>
                  <p className="text-sm text-blue-700">Please wait while we fetch the sorted data...</p>
                </div>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Table Header with Sort Info */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-medium text-gray-900">Orders</h3>
                  {!sorting && sortField && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Sorted by:</span>
                      <span className="font-medium text-blue-600">
                        {sortField.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <span className="text-gray-400">({sortDirection === 'asc' ? '↑' : '↓'})</span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {totalOrders} total orders
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors duration-200 ${
                      sorting ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'
                    }`} onClick={() => handleSort('orderNumber')}>
                      Order # {renderSortIcon('orderNumber')}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors duration-200 ${
                      sorting ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'
                    }`} onClick={() => handleSort('customerName')}>
                      Customer {renderSortIcon('customerName')}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors duration-200 ${
                      sorting ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'
                    }`} onClick={() => handleSort('status')}>
                      Status {renderSortIcon('status')}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors duration-200 ${
                      sorting ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'
                    }`} onClick={() => handleSort('totalAmount')}>
                      Amount {renderSortIcon('totalAmount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Drivers
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors duration-200 ${
                      sorting ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'
                    }`} onClick={() => handleSort('createdAt')}>
                      Date {renderSortIcon('createdAt')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`bg-white divide-y divide-gray-200 ${sorting ? 'opacity-75' : ''}`}>
                  {orders.map((order) => (
                    <tr key={order.id} className={`hover:bg-gray-50 ${sorting ? 'pointer-events-none' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer.firstName} {order.customer.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customer.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {orderStatusUpdatingId === order.id ? (
                          <div className="flex items-center justify-center h-8">
                            <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                          </div>
                        ) : (
                          <select
                            value={order.status}
                            onChange={async (e) => {
                              setOrderStatusUpdatingId(order.id);
                              try {
                                await updateOrder(order.id, { status: e.target.value });
                              } finally {
                                setOrderStatusUpdatingId(null);
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={orderStatusUpdatingId === order.id}
                          >
                            <option value="Order Placed">Order Placed</option>
                            <option value="Processing">Processing</option>
                            <option value="Ready for Delivery">Ready for Delivery</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        BD {order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.driverAssignments && order.driverAssignments.length > 0 ? (
                          <div className="space-y-1">
                            {order.driverAssignments.map((assignment) => (
                              <div key={assignment.id} className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  assignment.assignmentType === 'pickup' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {assignment.assignmentType === 'pickup' ? 'P' : 'D'}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {assignment.driver.firstName} {assignment.driver.lastName}
                                </span>
                                <span className={`px-1 py-0.5 text-xs rounded ${
                                  assignment.status === 'assigned' ? 'bg-gray-100 text-gray-800' :
                                  assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                  assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {assignment.status.replace('_', ' ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No drivers assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No orders found.</p>
            </div>
          )}

          {/* Enhanced Pagination controls */}
          <div className={`bg-white shadow rounded-lg p-4 mt-6 ${sorting ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              {/* Pagination Info */}
              <div className="flex items-center space-x-4 text-sm text-gray-700">
                <span>
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalOrders)} of {totalOrders} orders
                </span>
                <div className="flex items-center space-x-2">
                  <span>Show:</span>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    disabled={sorting}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span>per page</span>
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  {/* First Page */}
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1 || sorting}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200 text-sm"
                    title="First page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1 || sorting}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200 text-sm"
                    title="Previous page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const pages = [];
                      const maxVisiblePages = 5;
                      let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                      
                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }

                      // Add first page if not visible
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setPage(1)}
                            disabled={sorting}
                            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 text-sm"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis1" className="px-2 text-gray-500">...</span>
                          );
                        }
                      }

                      // Add visible pages
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setPage(i)}
                            disabled={sorting}
                            className={`px-3 py-2 border rounded-md transition-colors duration-200 text-sm ${
                              page === i
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }

                      // Add last page if not visible
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis2" className="px-2 text-gray-500">...</span>
                          );
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => setPage(totalPages)}
                            disabled={sorting}
                            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 text-sm"
                          >
                            {totalPages}
                          </button>
                        );
                      }

                      return pages;
                    })()}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || sorting}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200 text-sm"
                    title="Next page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages || sorting}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200 text-sm"
                    title="Last page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Jump to Page (for large datasets) */}
            {totalPages > 10 && (
              <div className="flex items-center justify-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">Jump to page:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const newPage = parseInt(e.target.value);
                    if (newPage >= 1 && newPage <= totalPages) {
                      setPage(newPage);
                    }
                  }}
                  disabled={sorting}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">of {totalPages}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Order Modal */}
      <OrderModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={updateOrder}
      />
    </div>
  );
} 