'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import { MapPin, ExternalLink } from 'lucide-react';
import { formatUTCForDisplay, getCurrentBahrainDate, convertUTCToBahrainDateTimeLocal, convertBahrainDateTimeToUTC } from '@/lib/utils/timezone';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// Constants
const defaultCenter = {
  lat: 26.0667,
  lng: 50.5577,
};

const libraries: 'places'[] = ['places'];

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  pickupTime: string;
  deliveryTime: string;
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
  driverAssignments?: DriverAssignment[];
}

interface DriverAssignment {
  id: number;
  orderId: number;
  driverId: number;
  assignmentType: 'pickup' | 'delivery';
  status: string;
  estimatedTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

interface DriverAssignmentsTabProps {
  order: Order;
  onRefresh: () => void;
}

export default function DriverAssignmentsTab({ order, onRefresh }: DriverAssignmentsTabProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverAssignments, setDriverAssignments] = useState<DriverAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickupAssignmentLoading, setPickupAssignmentLoading] = useState(false);
  const [deliveryAssignmentLoading, setDeliveryAssignmentLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<number | null>(null);

  // Reassignment modal state
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [assignmentToReassign, setAssignmentToReassign] = useState<DriverAssignment | null>(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [selectedReassignDriver, setSelectedReassignDriver] = useState<number | ''>('');
  const [reassignEstimatedTime, setReassignEstimatedTime] = useState('');
  const [reassignNotes, setReassignNotes] = useState('');

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
  const [deliveryTimeWarning, setDeliveryTimeWarning] = useState<string>('');

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
        lng: order.address.longitude,
      };
    }
    return defaultCenter;
  }, [order.address]);

  // Generate Google Maps link for pickup location
  const getGoogleMapsLink = useCallback(() => {
    if (order.address?.latitude && order.address?.longitude) {
      return `https://www.google.com/maps?q=${order.address.latitude},${order.address.longitude}`;
    }
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
  const checkPickupTimeWarning = useCallback(
    (assignedTime: string) => {
      if (!assignedTime || !order.pickupTime) return '';

      const assignedDate = new Date(assignedTime);
      const requestedDate = new Date(order.pickupTime);

      const timeDifference = Math.abs(
        assignedDate.getTime() - requestedDate.getTime()
      );
      const hoursDifference = timeDifference / (1000 * 60 * 60);

      if (hoursDifference > 1) {
        const requestedTimeStr = formatUTCForDisplay(order.pickupTime);
        return `Warning: Customer requested pickup at ${requestedTimeStr}. Please confirm this change with the customer.`;
      }

      return '';
    },
    [order.pickupTime]
  );

  const loadDrivers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      if (response.ok) {
        const data = await response.json() as { success: boolean; data: Driver[] };
        if (data.success) {
          setDrivers(data.data || []);
        } else {
          console.error('Failed to load drivers: API returned error');
        }
      } else {
        console.error('Failed to load drivers:', response.status);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  }, []);

  const loadDriverAssignments = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/driver-assignments?orderId=${order.id}`);
      if (response.ok) {
        const data = await response.json() as { success: boolean; assignments?: DriverAssignment[] };
        console.log('Driver assignments API response:', data); // Debug log
        if (data.success) {
          setDriverAssignments(data.assignments || []);
          console.log('Driver assignments set:', data.assignments?.length || 0); // Debug log

          // Set existing assignments
          const pickupAssignment = data.assignments?.find(
            (a: DriverAssignment) => a.assignmentType === 'pickup'
          );
          const deliveryAssignment = data.assignments?.find(
            (a: DriverAssignment) => a.assignmentType === 'delivery'
          );

          if (pickupAssignment) {
            setSelectedPickupDriver(pickupAssignment.driverId);
            setPickupEstimatedTime(
              pickupAssignment.estimatedTime
                ? convertUTCToBahrainDateTimeLocal(pickupAssignment.estimatedTime)
                : ''
            );
            setPickupNotes(pickupAssignment.notes || '');

            if (pickupAssignment.estimatedTime) {
              const warning = checkPickupTimeWarning(pickupAssignment.estimatedTime);
              setPickupTimeWarning(warning);
            }
          }

          if (deliveryAssignment) {
            setSelectedDeliveryDriver(deliveryAssignment.driverId);
            setDeliveryEstimatedTime(
              deliveryAssignment.estimatedTime
                ? convertUTCToBahrainDateTimeLocal(deliveryAssignment.estimatedTime)
                : ''
            );
            setDeliveryNotes(deliveryAssignment.notes || '');
          }
        } else {
          console.error('Failed to load driver assignments: API returned error');
        }
      } else {
        console.error('Failed to load driver assignments:', response.status);
      }
    } catch (error) {
      console.error('Error loading driver assignments:', error);
    }
  }, [order.id, checkPickupTimeWarning]);

  // Date validation function
  const validateDateTime = useCallback(
    (dateTimeString: string, assignmentType: 'pickup' | 'delivery'): string => {
      if (!dateTimeString) return '';

      const selectedDate = new Date(dateTimeString);
      const now = new Date();

      if (selectedDate < now) {
        return `${assignmentType === 'pickup' ? 'Pickup' : 'Delivery'} time cannot be in the past`;
      }

      if (assignmentType === 'delivery' && pickupEstimatedTime) {
        const pickupDate = new Date(pickupEstimatedTime);
        if (selectedDate <= pickupDate) {
          return 'Delivery time must be after pickup time';
        }
      }

      if (assignmentType === 'pickup' && deliveryEstimatedTime) {
        const deliveryDate = new Date(deliveryEstimatedTime);
        if (selectedDate >= deliveryDate) {
          return 'Pickup time must be before delivery time';
        }
      }

      return '';
    },
    [pickupEstimatedTime, deliveryEstimatedTime]
  );

  const assignDriver = useCallback(
    async (assignmentType: 'pickup' | 'delivery') => {
      const driverId =
        assignmentType === 'pickup'
          ? selectedPickupDriver
          : selectedDeliveryDriver;
      const estimatedTime =
        assignmentType === 'pickup'
          ? convertBahrainDateTimeToUTC(pickupEstimatedTime)
          : convertBahrainDateTimeToUTC(deliveryEstimatedTime);
      const notes = assignmentType === 'pickup' ? pickupNotes : deliveryNotes;

      if (!driverId) {
        // You can add toast notification here
        return;
      }

      const timeError = validateDateTime(estimatedTime, assignmentType);
      if (timeError) {
        if (assignmentType === 'pickup') {
          setPickupTimeWarning(timeError);
        } else {
          setDeliveryTimeWarning(timeError);
        }
        return;
      }

      setPickupTimeWarning('');
      setDeliveryTimeWarning('');

      if (assignmentType === 'pickup') {
        setPickupAssignmentLoading(true);
      } else {
        setDeliveryAssignmentLoading(true);
      }

      try {
        const response = await fetch('/api/admin/operations/actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.id,
            action:
              assignmentType === 'pickup'
                ? 'assign_pickup_driver'
                : 'assign_delivery_driver',
            driverId: parseInt(driverId.toString()),
            estimatedTime: estimatedTime,
            notes: notes || undefined,
          }),
        });

        if (response.ok) {
          await loadDriverAssignments();
          onRefresh();
        } else {
          const error = await response.json();
          console.error('Failed to assign driver:', error);
        }
      } catch (error) {
        console.error('Error assigning driver:', error);
      } finally {
        if (assignmentType === 'pickup') {
          setPickupAssignmentLoading(false);
        } else {
          setDeliveryAssignmentLoading(false);
        }
      }
    },
    [
      selectedPickupDriver,
      selectedDeliveryDriver,
      pickupEstimatedTime,
      deliveryEstimatedTime,
      pickupNotes,
      deliveryNotes,
      validateDateTime,
      order.id,
      loadDriverAssignments,
      onRefresh,
    ]
  );

  const handleDeleteClick = useCallback((assignmentId: number) => {
    setAssignmentToDelete(assignmentId);
    setShowDeleteModal(true);
  }, []);

  const handleReassignClick = useCallback((assignment: DriverAssignment) => {
    setAssignmentToReassign(assignment);
    setSelectedReassignDriver('');
    setReassignEstimatedTime(assignment.estimatedTime ? convertUTCToBahrainDateTimeLocal(assignment.estimatedTime) : '');
    setReassignNotes(assignment.notes || '');
    setShowReassignModal(true);
  }, []);

  const handleReassign = useCallback(async () => {
    if (!assignmentToReassign || !selectedReassignDriver) {
      return;
    }

    setReassignLoading(true);
    try {
      const response = await fetch('/api/admin/driver-assignments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: assignmentToReassign.id,
          newDriverId: parseInt(selectedReassignDriver.toString()),
          estimatedTime: convertBahrainDateTimeToUTC(reassignEstimatedTime),
          notes: reassignNotes || undefined,
        }),
      });

      if (response.ok) {
        await loadDriverAssignments();
        onRefresh();
        setShowReassignModal(false);
        setAssignmentToReassign(null);
      } else {
        const error = await response.json();
        console.error('Failed to reassign driver:', error);
        // You can add toast notification here
      }
    } catch (error) {
      console.error('Error reassigning driver:', error);
    } finally {
      setReassignLoading(false);
    }
  }, [assignmentToReassign, selectedReassignDriver, reassignEstimatedTime, reassignNotes, loadDriverAssignments, onRefresh]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!assignmentToDelete) return;

    setDeleteLoading(assignmentToDelete);
    try {
      const response = await fetch(
        `/api/admin/driver-assignments?id=${assignmentToDelete}&action=delete`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        await loadDriverAssignments();
        onRefresh();
      } else {
        const error = await response.json();
        console.error('Failed to delete assignment:', error);
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
    } finally {
      setDeleteLoading(null);
      setAssignmentToDelete(null);
      setShowDeleteModal(false);
    }
  }, [assignmentToDelete, loadDriverAssignments, onRefresh]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setAssignmentToDelete(null);
  }, []);

  if (loading) {
    return (
      <div className='space-y-6'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Driver Assignments
        </h3>
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <h3 className='text-lg font-semibold text-gray-900'>
        Driver Assignments
      </h3>

      {/* Current Assignments */}
      {driverAssignments.length > 0 && (
        <div className='bg-gray-50 rounded-lg p-4'>
          <h4 className='font-medium text-gray-900 mb-3'>
            Current Assignments
          </h4>
          <div className='space-y-3'>
            {driverAssignments.map(assignment => {
              const driver = drivers.find(d => d.id === assignment.driverId);
              return (
                <div
                  key={assignment.id}
                  className='bg-white p-4 rounded border shadow-sm'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2 mb-2'>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            assignment.assignmentType === 'pickup'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                          }`}
                        ></div>
                        <h5 className='font-medium text-gray-900'>
                          {assignment.assignmentType.charAt(0).toUpperCase() +
                            assignment.assignmentType.slice(1)}{' '}
                          Driver
                        </h5>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            assignment.status === 'ASSIGNED'
                              ? 'bg-blue-100 text-blue-800'
                              : assignment.status === 'IN_PROGRESS'
                                ? 'bg-yellow-100 text-yellow-800'
                                : assignment.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : assignment.status === 'FAILED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {assignment.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className='space-y-1'>
                        <div className='flex items-center space-x-2'>
                          <svg
                            className='w-4 h-4 text-gray-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                            />
                          </svg>
                          <span className='text-sm text-gray-700'>
                            {driver
                              ? `${driver.firstName} ${driver.lastName}`
                              : 'Unknown Driver'}
                          </span>
                        </div>

                        {assignment.estimatedTime && (
                          <div className='flex items-center space-x-2'>
                            <svg
                              className='w-4 h-4 text-gray-400'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                              />
                            </svg>
                            <span className='text-sm text-gray-600'>
                              Estimated:{' '}
                              {assignment.estimatedTime ? formatUTCForDisplay(assignment.estimatedTime) : 'Not set'}
                            </span>
                          </div>
                        )}

                        {assignment.notes && (
                          <div className='flex items-start space-x-2'>
                            <svg
                              className='w-4 h-4 text-gray-400 mt-0.5'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                              />
                            </svg>
                            <span className='text-sm text-gray-600'>
                              {assignment.notes}
                            </span>
                          </div>
                        )}

                        {/* Location Map */}
                        {isLoaded && !loadError && (
                          <div className='mt-3'>
                            <div className='flex items-center space-x-2 mb-2'>
                              <MapPin className='w-4 h-4 text-gray-400' />
                              <span className='text-sm font-medium text-gray-700'>
                                Location
                              </span>
                            </div>
                            <div className='relative w-full h-32 border border-gray-200 rounded-lg overflow-hidden'>
                              <GoogleMap
                                mapContainerClassName='w-full h-full'
                                center={getPickupLocation}
                                zoom={
                                  order.address?.latitude &&
                                  order.address?.longitude
                                    ? 15
                                    : 12
                                }
                                options={{
                                  zoomControl: false,
                                  streetViewControl: false,
                                  mapTypeControl: false,
                                  fullscreenControl: false,
                                }}
                              >
                                {order.address?.latitude &&
                                  order.address?.longitude && (
                                    <Marker position={getPickupLocation} />
                                  )}
                              </GoogleMap>
                            </div>
                            <div className='flex items-center justify-between mt-2'>
                              <div className='text-xs text-gray-500 truncate flex-1'>
                                {order.address?.addressLine1 ||
                                  'Address not available'}
                              </div>
                              <a
                                href={getGoogleMapsLink()}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs ml-2'
                              >
                                <ExternalLink className='w-3 h-3' />
                                <span>Open</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex space-x-2 ml-4'>
                      {/* Reassign button for failed assignments */}
                      {assignment.status === 'FAILED' && (
                        <button
                          onClick={() => handleReassignClick(assignment)}
                          className='p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors'
                          title='Reassign to new driver'
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                            />
                          </svg>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteClick(assignment.id)}
                        disabled={deleteLoading === assignment.id}
                        className='p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50'
                        title='Delete assignment'
                      >
                        {deleteLoading === assignment.id ? (
                          <svg
                            className='w-4 h-4 animate-spin'
                            fill='none'
                            viewBox='0 0 24 24'
                          >
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                            ></circle>
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            ></path>
                          </svg>
                        ) : (
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
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
        const hasPickupAssignment = driverAssignments.some(
          a => a.assignmentType === 'pickup'
        );
        const hasDeliveryAssignment = driverAssignments.some(
          a => a.assignmentType === 'delivery'
        );

        const hasFailedAssignments = driverAssignments.some(a => a.status === 'FAILED');
        
        if (hasPickupAssignment && hasDeliveryAssignment) {
          return (
            <div className='space-y-4'>
              {hasFailedAssignments && (
                <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                  <div className='flex items-center space-x-2'>
                    <svg
                      className='w-5 h-5 text-orange-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                      />
                    </svg>
                    <span className='text-orange-800 font-medium'>
                      Failed Assignments Detected
                    </span>
                  </div>
                  <p className='text-orange-700 text-sm mt-1'>
                    Some assignments have failed. You can reassign them to new drivers using the reassign button above.
                  </p>
                </div>
              )}
              
              <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                <div className='flex items-center space-x-2'>
                  <svg
                    className='w-5 h-5 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <span className='text-green-800 font-medium'>
                    All driver assignments are complete!
                  </span>
                </div>
                <p className='text-green-700 text-sm mt-1'>
                  Both pickup and delivery drivers have been assigned. You can
                  edit or delete assignments above if needed.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h4 className='text-lg font-medium text-gray-900'>
                Add New Assignments
              </h4>
              <div className='text-sm text-gray-500'>
                {hasPickupAssignment && hasDeliveryAssignment
                  ? 'All assigned'
                  : hasPickupAssignment
                    ? 'Pickup assigned'
                    : hasDeliveryAssignment
                      ? 'Delivery assigned'
                      : 'No assignments yet'}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Pickup Assignment */}
              {!hasPickupAssignment && (
                <div className='bg-white border border-gray-200 rounded-lg p-4'>
                  <div className='flex items-center space-x-2 mb-4'>
                    <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                    <h4 className='font-medium text-gray-900'>
                      Assign Pickup Driver
                    </h4>
                  </div>
                  <div className='space-y-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Driver
                      </label>
                      <select
                        value={selectedPickupDriver}
                        onChange={e =>
                          setSelectedPickupDriver(
                            e.target.value ? parseInt(e.target.value) : ''
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value=''>Select driver</option>
                        {drivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Estimated Pickup Time
                      </label>
                      <input
                        type="datetime-local"
                        value={pickupEstimatedTime}
                        onChange={(e) => {
                          setPickupEstimatedTime(e.target.value);
                          setPickupTimeError('');
                          const warning = checkPickupTimeWarning(convertBahrainDateTimeToUTC(e.target.value));
                          setPickupTimeWarning(warning);
                        }}
                        min={getCurrentBahrainDate()}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                      {pickupTimeError && (
                        <p className="mt-1 text-sm text-red-600">{pickupTimeError}</p>
                      )}
                      {pickupTimeWarning && (
                        <p className="mt-1 text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                          ⚠️ {pickupTimeWarning}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Notes
                      </label>
                      <textarea
                        value={pickupNotes}
                        onChange={e => setPickupNotes(e.target.value)}
                        rows={2}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder='Any special instructions...'
                      />
                    </div>

                    <button
                      onClick={() => assignDriver('pickup')}
                      disabled={pickupAssignmentLoading || !selectedPickupDriver}
                      className='w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                    >
                      {pickupAssignmentLoading
                        ? 'Assigning...'
                        : 'Assign Pickup Driver'}
                    </button>
                  </div>
                </div>
              )}

              {/* Delivery Assignment */}
              {!hasDeliveryAssignment && (
                <div className='bg-white border border-gray-200 rounded-lg p-4'>
                  <div className='flex items-center space-x-2 mb-4'>
                    <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                    <h4 className='font-medium text-gray-900'>
                      Assign Delivery Driver
                    </h4>
                  </div>
                  <div className='space-y-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Driver
                      </label>
                      <select
                        value={selectedDeliveryDriver}
                        onChange={e =>
                          setSelectedDeliveryDriver(
                            e.target.value ? parseInt(e.target.value) : ''
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value=''>Select driver</option>
                        {drivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Estimated Delivery Time
                      </label>
                      <input
                        type="datetime-local"
                        value={deliveryEstimatedTime}
                        onChange={(e) => {
                          setDeliveryEstimatedTime(e.target.value);
                          setDeliveryTimeError('');
                        }}
                        min={getCurrentBahrainDate()}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                      {deliveryTimeError && (
                        <p className="mt-1 text-sm text-red-600">{deliveryTimeError}</p>
                      )}
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Notes
                      </label>
                      <textarea
                        value={deliveryNotes}
                        onChange={e => setDeliveryNotes(e.target.value)}
                        rows={2}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder='Any special instructions...'
                      />
                    </div>

                    <button
                      onClick={() => assignDriver('delivery')}
                      disabled={deliveryAssignmentLoading || !selectedDeliveryDriver}
                      className='w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                    >
                      {deliveryAssignmentLoading
                        ? 'Assigning...'
                        : 'Assign Delivery Driver'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Reassignment Modal */}
      {showReassignModal && assignmentToReassign && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Reassign Driver
              </h3>
              <button
                onClick={() => setShowReassignModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            
            <div className='space-y-4'>
              <div>
                <p className='text-sm text-gray-600 mb-3'>
                  Reassigning {assignmentToReassign.assignmentType} assignment to a new driver.
                </p>
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  New Driver
                </label>
                <select
                  value={selectedReassignDriver}
                  onChange={e => setSelectedReassignDriver(e.target.value ? parseInt(e.target.value) : '')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select new driver</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.firstName} {driver.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Estimated Time
                </label>
                <input
                  type="datetime-local"
                  value={reassignEstimatedTime}
                  onChange={(e) => setReassignEstimatedTime(e.target.value)}
                  min={getCurrentBahrainDate()}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Notes
                </label>
                <textarea
                  value={reassignNotes}
                  onChange={e => setReassignNotes(e.target.value)}
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Add notes about the reassignment...'
                />
              </div>
            </div>
            
            <div className='flex space-x-3 mt-6'>
              <button
                onClick={() => setShowReassignModal(false)}
                className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={reassignLoading || !selectedReassignDriver}
                className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors'
              >
                {reassignLoading ? 'Reassigning...' : 'Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        title='Delete Assignment'
        message='Are you sure you want to delete this driver assignment? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
        confirmButtonClass='bg-red-600 hover:bg-red-700'
      />
    </div>
  );
} 