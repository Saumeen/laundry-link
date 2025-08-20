'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDriverAuth } from '@/admin/hooks/useAdminAuth';
import { useDriverStore } from '@/admin/stores/driverStore';
import logger from '@/lib/logger';
import {
  getStatusBadgeColor,
  getStatusDisplayName,
} from '@/admin/utils/orderUtils';
import {
  formatUTCForTimeDisplay,
  formatUTCForDisplay,
} from '@/lib/utils/timezone';
import type { DriverAssignment } from '@/admin/api/driver';
import PhotoCapture from '@/components/PhotoCapture';
import { useToast } from '@/components/ui/Toast';

// Utility function to get location type description
const getLocationTypeDescription = (locationType: string): string => {
  switch (locationType.toLowerCase()) {
    case 'home':
      return 'Private Residence';
    case 'flat':
      return 'Apartment/Flat';
    case 'hotel':
      return 'Hotel/Accommodation';
    case 'office':
      return 'Office/Workplace';
    default:
      return 'Location';
  }
};

export default function DriverAssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const { user, isLoading, isAuthorized, logout } = useDriverAuth();
  const {
    assignments,
    loading,
    fetchAssignments,
    updateAssignmentStatus,
    uploadPhoto,
  } = useDriverStore();
  const { showToast } = useToast();

  const [assignment, setAssignment] = useState<DriverAssignment | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<string | null>(
    null
  );
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      fetchAssignments();
    }
  }, [isAuthorized, fetchAssignments]);

  useEffect(() => {
    if (assignments.length > 0 && assignmentId) {
      const foundAssignment = assignments.find(
        a => a.id && a.id.toString() === assignmentId
      );
      setAssignment(foundAssignment || null);
      if (foundAssignment?.notes) {
        setNotes(foundAssignment.notes);
      }
    }
  }, [assignments, assignmentId]);

  // Redirect to assignments list if assignment not found after loading
  useEffect(() => {
    if (!isLoading && !assignment && assignments.length > 0) {
      // Assignment not found - likely completed or failed, redirect to assignments list
      // Add a small delay to show a brief message
      const timer = setTimeout(() => {
        router.push('/admin/driver/assignments');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, assignment, assignments.length, router]);

  // Check if photo is required for a specific status
  const isPhotoRequired = (status: string) => {
    return ['COMPLETED', 'DROPPED_OFF', 'FAILED'].includes(status);
  };

  // Get photo type based on assignment type and status
  const getPhotoType = (assignmentType: string, status: string) => {
    if (status === 'COMPLETED') {
      return assignmentType === 'pickup'
        ? 'pickup_completed_photo'
        : 'delivery_completed_photo';
    } else if (status === 'DROPPED_OFF') {
      return assignmentType === 'pickup'
        ? 'pickup_dropped_off_photo'
        : 'delivery_dropped_off_photo';
    } else if (status === 'FAILED') {
      return assignmentType === 'pickup'
        ? 'pickup_failed_photo'
        : 'delivery_failed_photo';
    }
    return 'general_photo';
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!assignment) return;

    // Check if photo is required
    if (isPhotoRequired(newStatus)) {
      setPendingStatusUpdate(newStatus);
      setShowPhotoCapture(true);
      return;
    }

    // Proceed with status update without photo
    await performStatusUpdate(newStatus);
  };

  const performStatusUpdate = async (newStatus: string) => {
    if (!assignment) return;

    setStatusUpdateLoading(true);
    try {
      const result = await updateAssignmentStatus(
        assignment.id,
        newStatus,
        notes
      );

      if (result.success) {
        showToast(
          `Status updated to ${getStatusDisplayName(newStatus)} successfully!`,
          'success'
        );

        // Only redirect if the status is DROPPED_OFF (final status for pickup) or COMPLETED (final status for delivery)
        if (
          newStatus === 'DROPPED_OFF' ||
          (newStatus === 'COMPLETED' &&
            assignment.assignmentType === 'delivery')
        ) {
          // Show redirecting state immediately
          setIsRedirecting(true);

          // Redirect immediately after successful completion
          // Don't wait for fetchAssignments as the assignment will be removed from the list
          router.push('/admin/driver/assignments');
        } else {
          // For other status updates, refresh the assignments to get updated data
          await fetchAssignments();
        }
      } else {
        // Show error toast
        showToast(
          result.error || 'Failed to update assignment status',
          'error'
        );
      }
    } catch (error) {
      logger.error('Error updating assignment status:', error);
      showToast('An unexpected error occurred while updating status', 'error');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handlePhotoCapture = async (photoDataUrl: string) => {
    if (!assignment || !pendingStatusUpdate) return;

    setPhotoData(photoDataUrl);
    setShowPhotoCapture(false);
    setStatusUpdateLoading(true);

    try {
      // Upload photo first
      const photoType = getPhotoType(
        assignment.assignmentType,
        pendingStatusUpdate
      );
      await uploadPhoto(assignment.id, {
        photoUrl: photoDataUrl,
        photoType,
        description: `Photo for ${assignment.assignmentType} ${pendingStatusUpdate.toLowerCase()}`,
      });

      // Then update status
      const result = await updateAssignmentStatus(
        assignment.id,
        pendingStatusUpdate,
        notes
      );

      if (result.success) {
        showToast(
          `Status updated to ${getStatusDisplayName(pendingStatusUpdate)} with photo successfully!`,
          'success'
        );

        // Reset states
        setPhotoData(null);
        setPendingStatusUpdate(null);

        // Only redirect if the status is DROPPED_OFF (final status for pickup) or COMPLETED (final status for delivery)
        if (
          pendingStatusUpdate === 'DROPPED_OFF' ||
          (pendingStatusUpdate === 'COMPLETED' &&
            assignment.assignmentType === 'delivery')
        ) {
          // Show redirecting state immediately
          setIsRedirecting(true);

          // Redirect immediately after successful completion
          // Don't wait for fetchAssignments as the assignment will be removed from the list
          router.push('/admin/driver/assignments');
        } else {
          // For other status updates, refresh the assignments to get updated data
          await fetchAssignments();
        }
      } else {
        // Show error toast
        showToast(
          result.error || 'Failed to update assignment status',
          'error'
        );
        setPhotoError('Failed to update assignment status');
      }
    } catch (error) {
      logger.error('Error updating assignment with photo:', error);
      showToast(
        'An unexpected error occurred while updating assignment with photo',
        'error'
      );
      setPhotoError('Failed to upload photo and update status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handlePhotoCancel = () => {
    setShowPhotoCapture(false);
    setPendingStatusUpdate(null);
    setPhotoData(null);
    setPhotoError(null);
  };

  // Generate Google Maps link for the assignment
  const getGoogleMapsLink = (assignment: DriverAssignment) => {
    if (
      assignment.order.address?.latitude &&
      assignment.order.address?.longitude
    ) {
      return `https://www.google.com/maps?q=${assignment.order.address.latitude},${assignment.order.address.longitude}`;
    }
    // Fallback to address search
    const address =
      assignment.order.address?.addressLine1 ||
      assignment.order.customerAddress ||
      '';
    return `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect to login
  }

  if (!assignment) {
    // Only show "not found" if we've finished loading and have assignments but still can't find it
    if (!isLoading && assignments.length > 0) {
      return (
        <div className='min-h-screen bg-gray-50'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='text-center'>
              <h1 className='text-xl sm:text-2xl font-bold text-gray-900 mb-4'>
                Assignment Not Available
              </h1>
              <p className='text-gray-600 mb-6 px-4'>
                This assignment may have been completed or is no longer
                available. Redirecting to assignments list...
              </p>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <button
                onClick={() => router.push('/admin/driver/assignments')}
                className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-base font-medium'
              >
                Go to Assignments Now
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If still loading or no assignments, show loading spinner
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Photo Capture Modal */}
      {showPhotoCapture && (
        <PhotoCapture
          isOpen={showPhotoCapture}
          onCapture={handlePhotoCapture}
          onCancel={handlePhotoCancel}
        />
      )}

      {/* Mobile Header */}
      <div className='bg-white shadow-sm border-b border-gray-200 lg:hidden'>
        <div className='px-4 py-4'>
          <div className='flex items-center justify-between'>
            <button
              onClick={() => router.push('/admin/driver/assignments')}
              className='flex items-center space-x-2 text-blue-600 font-medium'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
              <span>Back</span>
            </button>
            <h1 className='text-lg font-semibold text-gray-900 truncate'>
              {assignment.assignmentType === 'pickup' ? 'Pickup' : 'Delivery'}
            </h1>
            <button
              onClick={logout}
              className='text-gray-500 hover:text-gray-700'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                />
              </svg>
            </button>
          </div>
          <p className='text-sm text-gray-500 mt-1 truncate'>
            Order #{assignment.order.orderNumber}
          </p>
        </div>
      </div>

      {/* Desktop Header */}
      <div className='bg-white shadow hidden lg:block'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Assignment Details
              </h1>
              <p className='mt-1 text-sm text-gray-500'>
                {assignment.assignmentType === 'pickup' ? 'Pickup' : 'Delivery'}{' '}
                - {assignment.order.orderNumber}
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => router.push('/admin/driver/assignments')}
                className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200'
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
                    d='M10 19l-7-7m0 0l7-7m-7 7h18'
                  />
                </svg>
                <span>Back to Assignments</span>
              </button>
              <button
                onClick={logout}
                className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200'
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
                    d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8'>
        {/* Photo Error Alert */}
        {photoError && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center'>
              <svg
                className='w-5 h-5 text-red-400 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <span className='text-red-800'>{photoError}</span>
              <button
                onClick={() => setPhotoError(null)}
                className='ml-auto text-red-400 hover:text-red-600'
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
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Success/Redirecting Alert */}
        {isRedirecting && (
          <div className='mb-6 bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='flex items-center'>
              <svg
                className='w-5 h-5 text-green-400 mr-2'
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
              <span className='text-green-800'>
                Assignment updated successfully! Redirecting to assignments
                list...
              </span>
              <div className='ml-auto'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-green-600'></div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Status Update Section - Fixed at top on mobile */}
        <div className='lg:hidden mb-6'>
          <div className='bg-white shadow rounded-lg'>
            <div className='px-4 py-4 border-b border-gray-200'>
              <h2 className='text-lg font-medium text-gray-900'>
                Update Status
              </h2>
            </div>
            <div className='p-4 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className='w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base'
                  placeholder='Add any notes about this assignment...'
                />
              </div>

              <div className='space-y-3'>
                {assignment.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleStatusUpdate('IN_PROGRESS')}
                    disabled={statusUpdateLoading}
                    className='w-full px-4 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-base font-medium'
                  >
                    {statusUpdateLoading ? 'Updating...' : 'Start Assignment'}
                  </button>
                )}

                {assignment.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleStatusUpdate('COMPLETED')}
                    disabled={statusUpdateLoading}
                    className='w-full px-4 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-base font-medium flex items-center justify-center'
                  >
                    {statusUpdateLoading ? (
                      'Updating...'
                    ) : (
                      <>
                        <svg
                          className='w-5 h-5 mr-2'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                          />
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
                          />
                        </svg>
                        Complete{' '}
                        {assignment.assignmentType === 'pickup'
                          ? 'Pickup'
                          : 'Delivery'}{' '}
                        (Photo Required)
                      </>
                    )}
                  </button>
                )}

                {assignment.status === 'COMPLETED' &&
                  assignment.assignmentType === 'pickup' && (
                    <button
                      onClick={() => handleStatusUpdate('DROPPED_OFF')}
                      disabled={statusUpdateLoading}
                      className='w-full px-4 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-base font-medium flex items-center justify-center'
                    >
                      {statusUpdateLoading ? (
                        'Updating...'
                      ) : (
                        <>
                          <svg
                            className='w-5 h-5 mr-2'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                            />
                          </svg>
                          Drop Off at Facility (Photo Required)
                        </>
                      )}
                    </button>
                  )}

                {assignment.status === 'COMPLETED' &&
                  assignment.assignmentType === 'delivery' && (
                    <div className='w-full px-4 py-4 bg-green-100 text-green-800 rounded-lg text-center text-base font-medium'>
                      ✓ Delivery Completed
                    </div>
                  )}

                {(assignment.status === 'ASSIGNED' ||
                  assignment.status === 'IN_PROGRESS') && (
                  <button
                    onClick={() => handleStatusUpdate('FAILED')}
                    disabled={statusUpdateLoading}
                    className='w-full px-4 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-base font-medium flex items-center justify-center'
                  >
                    {statusUpdateLoading ? (
                      'Updating...'
                    ) : (
                      <>
                        <svg
                          className='w-5 h-5 mr-2'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                          />
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
                          />
                        </svg>
                        Mark as Failed (Photo Required)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Customer Information - Moved to top for quick access */}
            <div className='bg-white shadow rounded-lg'>
              <div className='px-4 lg:px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-medium text-gray-900'>
                  Customer Information
                </h2>
              </div>
              <div className='p-4 lg:p-6'>
                <div className='space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6'>
                  <div className='flex items-center justify-between lg:block'>
                    <h3 className='text-sm font-medium text-gray-500 lg:mb-2'>
                      Customer Name
                    </h3>
                    <p className='text-base lg:text-lg font-medium text-gray-900 text-right lg:text-left'>
                      {assignment.order.customerFirstName}{' '}
                      {assignment.order.customerLastName}
                    </p>
                  </div>

                  <div className='flex items-center justify-between lg:block'>
                    <h3 className='text-sm font-medium text-gray-500 lg:mb-2'>
                      Phone Number
                    </h3>
                    <p className='text-base lg:text-lg font-medium text-gray-900 text-right lg:text-left'>
                      {assignment.order.customerPhone || 'Not provided'}
                    </p>
                  </div>

                  <div className='lg:col-span-2'>
                    <h3 className='text-sm font-medium text-gray-500 mb-2'>
                      Address
                    </h3>

                    {/* Detailed Address Display */}
                    {assignment.order.address ? (
                      <div className='space-y-3'>
                        {/* Location Type Badge */}
                        <div className='flex items-center gap-2'>
                          <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                            {assignment.order.address.locationType
                              ? assignment.order.address.locationType
                                  ?.charAt(0)
                                  ?.toUpperCase() +
                                assignment.order?.address?.locationType?.slice(
                                  1
                                )
                              : 'Location'}
                          </span>
                          {assignment.order.address.locationType && (
                            <span className='text-sm text-gray-500'>
                              (
                              {getLocationTypeDescription(
                                assignment.order?.address?.locationType
                              )}
                              )
                            </span>
                          )}
                        </div>

                        {/* Main Address */}
                        {assignment.order.address.addressLine1 && (
                          <div className='bg-gray-50 p-3 rounded-lg'>
                            <p className='text-sm font-medium text-gray-500 mb-1'>
                              Full Address
                            </p>
                            <p className='text-base lg:text-lg font-medium text-gray-900'>
                              {assignment.order.address.addressLine1}
                            </p>
                          </div>
                        )}

                        {/* Address Line 2 */}
                        {assignment.order.address.addressLine2 && (
                          <div className='bg-gray-50 p-3 rounded-lg'>
                            <p className='text-sm font-medium text-gray-500 mb-1'>
                              Additional Details
                            </p>
                            <p className='text-base text-gray-700'>
                              {assignment.order.address.addressLine2}
                            </p>
                          </div>
                        )}

                        {/* Location Specific Details */}
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                          {/* Building Information */}
                          {assignment.order.address.building && (
                            <div className='bg-gray-50 p-3 rounded-lg'>
                              <p className='text-sm font-medium text-gray-500 mb-1'>
                                {assignment.order.address.locationType ===
                                'hotel'
                                  ? 'Hotel Name'
                                  : assignment.order.address.locationType ===
                                      'office'
                                    ? 'Office Building'
                                    : assignment.order.address.locationType ===
                                        'home'
                                      ? 'House Number'
                                      : 'Building Name'}
                              </p>
                              <p className='text-base font-medium text-gray-900'>
                                {assignment.order.address.building}
                              </p>
                            </div>
                          )}

                          {/* Floor Information */}
                          {assignment.order.address.floor && (
                            <div className='bg-gray-50 p-3 rounded-lg'>
                              <p className='text-sm font-medium text-gray-500 mb-1'>
                                {assignment.order.address.locationType ===
                                'hotel'
                                  ? 'Room Number'
                                  : assignment.order.address.locationType ===
                                      'flat'
                                    ? 'Floor Number'
                                    : assignment.order.address.locationType ===
                                        'home'
                                      ? 'House Details'
                                      : 'Floor'}
                              </p>
                              <p className='text-base font-medium text-gray-900'>
                                {assignment.order.address.floor}
                              </p>
                            </div>
                          )}

                          {/* Apartment/Unit Information */}
                          {assignment.order.address.apartment && (
                            <div className='bg-gray-50 p-3 rounded-lg'>
                              <p className='text-sm font-medium text-gray-500 mb-1'>
                                {assignment.order.address.locationType ===
                                'flat'
                                  ? 'Apartment Number'
                                  : assignment.order.address.locationType ===
                                      'office'
                                    ? 'Office Number'
                                    : assignment.order.address.locationType ===
                                        'home'
                                      ? 'House Details'
                                      : 'Unit Number'}
                              </p>
                              <p className='text-base font-medium text-gray-900'>
                                {assignment.order.address.apartment}
                              </p>
                            </div>
                          )}

                          {/* Area Information */}
                          {assignment.order.address.area && (
                            <div className='bg-gray-50 p-3 rounded-lg'>
                              <p className='text-sm font-medium text-gray-500 mb-1'>
                                Area/Road
                              </p>
                              <p className='text-base font-medium text-gray-900'>
                                {assignment.order.address.area}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Landmark Information */}
                        {assignment.order.address.landmark && (
                          <div className='bg-gray-50 p-3 rounded-lg'>
                            <p className='text-sm font-medium text-gray-500 mb-1'>
                              Nearby Landmark
                            </p>
                            <p className='text-base font-medium text-gray-900'>
                              {assignment.order.address.landmark}
                            </p>
                          </div>
                        )}

                        {/* City */}
                        {assignment.order.address.city && (
                          <div className='bg-gray-50 p-3 rounded-lg'>
                            <p className='text-sm font-medium text-gray-500 mb-1'>
                              City
                            </p>
                            <p className='text-base font-medium text-gray-900'>
                              {assignment.order.address.city}
                            </p>
                          </div>
                        )}

                        {/* Collection Method */}
                        {assignment.order.address.collectionMethod && (
                          <div className='bg-blue-50 p-3 rounded-lg border border-blue-200'>
                            <p className='text-sm font-medium text-blue-700 mb-1'>
                              Collection Method
                            </p>
                            <p className='text-base font-medium text-blue-900'>
                              {assignment.order.address.collectionMethod}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Fallback to customer address */
                      <div className='bg-gray-50 p-3 rounded-lg'>
                        <p className='text-sm font-medium text-gray-500 mb-1'>
                          Customer Address
                        </p>
                        <p className='text-base lg:text-lg font-medium text-gray-900 break-words'>
                          {assignment.order.customerAddress ||
                            'No address provided'}
                        </p>
                      </div>
                    )}

                    {/* Open in Maps Button */}
                    {(assignment.order.address?.latitude &&
                      assignment.order.address?.longitude) ||
                    assignment.order.customerAddress ? (
                      <div className='mt-3'>
                        <a
                          href={getGoogleMapsLink(assignment)}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'
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
                              d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                            />
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                            />
                          </svg>
                          <span>Open in Maps</span>
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Overview */}
            <div className='bg-white shadow rounded-lg'>
              <div className='px-4 lg:px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-medium text-gray-900'>
                  Assignment Overview
                </h2>
              </div>
              <div className='p-4 lg:p-6'>
                <div className='space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6'>
                  <div className='flex items-center justify-between lg:block'>
                    <h3 className='text-sm font-medium text-gray-500 lg:mb-2'>
                      Assignment Type
                    </h3>
                    <div className='flex items-center space-x-2'>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          assignment.assignmentType === 'pickup'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}
                      ></div>
                      <span className='text-base lg:text-lg font-medium text-gray-900'>
                        {assignment.assignmentType === 'pickup'
                          ? 'Pickup'
                          : 'Delivery'}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center justify-between lg:block'>
                    <h3 className='text-sm font-medium text-gray-500 lg:mb-2'>
                      Status
                    </h3>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(assignment.status)}`}
                    >
                      {getStatusDisplayName(assignment.status)}
                    </span>
                  </div>

                  <div className='flex items-center justify-between lg:block'>
                    <h3 className='text-sm font-medium text-gray-500 lg:mb-2'>
                      Order Number
                    </h3>
                    <p className='text-base lg:text-lg font-medium text-gray-900'>
                      {assignment.order.orderNumber}
                    </p>
                  </div>

                  <div className='flex items-center justify-between lg:block'>
                    <h3 className='text-sm font-medium text-gray-500 lg:mb-2'>
                      Estimated Time
                    </h3>
                    <div className='text-right lg:text-left'>
                      <p className='text-base lg:text-lg font-medium text-gray-900'>
                        {assignment.estimatedTime
                          ? formatUTCForTimeDisplay(assignment.estimatedTime)
                          : 'Time TBD'}
                      </p>
                      {assignment.estimatedTime && (
                        <p className='text-sm text-gray-500'>
                          {formatUTCForDisplay(assignment.estimatedTime)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {assignment.order.specialInstructions && (
              <div className='bg-white shadow rounded-lg'>
                <div className='px-4 lg:px-6 py-4 border-b border-gray-200'>
                  <h2 className='text-lg font-medium text-gray-900'>
                    Special Instructions
                  </h2>
                </div>
                <div className='p-4 lg:p-6'>
                  <p className='text-gray-900 break-words'>
                    {assignment.order.specialInstructions}
                  </p>
                </div>
              </div>
            )}

            {/* Assignment Photos */}
            {assignment.photos && assignment.photos.length > 0 && (
              <div className='bg-white shadow rounded-lg'>
                <div className='px-4 lg:px-6 py-4 border-b border-gray-200'>
                  <h2 className='text-lg font-medium text-gray-900'>
                    Assignment Photos
                  </h2>
                </div>
                <div className='p-4 lg:p-6'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    {assignment.photos.map(photo => (
                      <div key={photo.id} className='space-y-2'>
                        <img
                          src={photo.photoUrl}
                          alt={photo.description || 'Assignment photo'}
                          className='w-full h-48 object-cover rounded-lg'
                        />
                        <div className='text-sm'>
                          <p className='font-medium text-gray-900'>
                            {photo.photoType
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          {photo.description && (
                            <p className='text-gray-600'>{photo.description}</p>
                          )}
                          <p className='text-gray-500'>
                            {new Date(photo.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Assignment Notes */}
            {assignment.notes && (
              <div className='bg-white shadow rounded-lg lg:hidden'>
                <div className='px-4 py-4 border-b border-gray-200'>
                  <h2 className='text-lg font-medium text-gray-900'>
                    Current Notes
                  </h2>
                </div>
                <div className='p-4'>
                  <p className='text-gray-900 break-words'>
                    {assignment.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Sidebar */}
          <div className='hidden lg:block space-y-6'>
            {/* Status Update */}
            <div className='bg-white shadow rounded-lg'>
              <div className='px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-medium text-gray-900'>
                  Update Status
                </h2>
              </div>
              <div className='p-6 space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Add any notes about this assignment...'
                  />
                </div>

                <div className='space-y-2'>
                  {assignment.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleStatusUpdate('IN_PROGRESS')}
                      disabled={statusUpdateLoading}
                      className='w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors'
                    >
                      {statusUpdateLoading ? 'Updating...' : 'Start Assignment'}
                    </button>
                  )}

                  {assignment.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleStatusUpdate('COMPLETED')}
                      disabled={statusUpdateLoading}
                      className='w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center'
                    >
                      {statusUpdateLoading ? (
                        'Updating...'
                      ) : (
                        <>
                          <svg
                            className='w-4 h-4 mr-2'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                            />
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
                            />
                          </svg>
                          Complete{' '}
                          {assignment.assignmentType === 'pickup'
                            ? 'Pickup'
                            : 'Delivery'}{' '}
                          (Photo Required)
                        </>
                      )}
                    </button>
                  )}

                  {assignment.status === 'COMPLETED' &&
                    assignment.assignmentType === 'pickup' && (
                      <button
                        onClick={() => handleStatusUpdate('DROPPED_OFF')}
                        disabled={statusUpdateLoading}
                        className='w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center'
                      >
                        {statusUpdateLoading ? (
                          'Updating...'
                        ) : (
                          <>
                            <svg
                              className='w-4 h-4 mr-2'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                              />
                            </svg>
                            Drop Off at Facility (Photo Required)
                          </>
                        )}
                      </button>
                    )}

                  {assignment.status === 'COMPLETED' &&
                    assignment.assignmentType === 'delivery' && (
                      <div className='w-full px-4 py-2 bg-green-100 text-green-800 rounded-md text-center text-sm font-medium'>
                        ✓ Delivery Completed
                      </div>
                    )}

                  {(assignment.status === 'ASSIGNED' ||
                    assignment.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => handleStatusUpdate('FAILED')}
                      disabled={statusUpdateLoading}
                      className='w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center'
                    >
                      {statusUpdateLoading ? (
                        'Updating...'
                      ) : (
                        <>
                          <svg
                            className='w-4 h-4 mr-2'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                            />
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
                            />
                          </svg>
                          Mark as Failed (Photo Required)
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment Notes */}
            {assignment.notes && (
              <div className='bg-white shadow rounded-lg'>
                <div className='px-6 py-4 border-b border-gray-200'>
                  <h2 className='text-lg font-medium text-gray-900'>
                    Current Notes
                  </h2>
                </div>
                <div className='p-6'>
                  <p className='text-gray-900'>{assignment.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
