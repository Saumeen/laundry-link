'use client';

import React, { useState, useEffect } from 'react';
import { OrderStatus } from '@prisma/client';
import { ORDER_STATUS_CONFIG } from '@/lib/orderStatus';
import { formatUTCForDisplay } from '@/lib/utils/timezone';
import { useOrderHistoryStore } from '@/admin/stores/orderHistoryStore';
import { useToast } from '@/components/ui/Toast';
import ImageGallery from './ImageGallery';

interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  specialInstructions?: string;
}

interface OrderHistoryTabProps {
  order: Order;
  onRefresh: () => void;
}

export default function OrderHistoryTab({ order }: OrderHistoryTabProps) {
  const { showToast } = useToast();
  const {
    timeline,
    loading,
    error,
    addHistoryForm,
    uploadPhotoForm,
    fetchOrderHistory,
    addHistoryEntry,
    uploadDriverPhoto,
  } = useOrderHistoryStore();

  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<
    number | null
  >(null);

  useEffect(() => {
    fetchOrderHistory(order.id);
  }, [order.id, fetchOrderHistory]);

  const getStatusColor = (status: OrderStatus) => {
    const config = ORDER_STATUS_CONFIG[status];
    return config?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayName = (status: OrderStatus) => {
    const config = ORDER_STATUS_CONFIG[status];
    return config?.label || status;
  };

  const getStatusIcon = (status: OrderStatus) => {
    const config = ORDER_STATUS_CONFIG[status];
    return config?.icon || '📋';
  };

  const getTimelineIcon = (type: string, status?: string) => {
    switch (type) {
      case 'order_created':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
            <span className='text-green-600 text-sm'>📋</span>
          </div>
        );
      case 'status_change':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
            <span className='text-blue-600 text-sm'>🔄</span>
          </div>
        );
      case 'driver_assignment':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
            <span className='text-purple-600 text-sm'>🚚</span>
          </div>
        );
      case 'processing_update':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
            <span className='text-yellow-600 text-sm'>⚙️</span>
          </div>
        );
      case 'issue_reported':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
            <span className='text-red-600 text-sm'>⚠️</span>
          </div>
        );
      case 'photo_uploaded':
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center'>
            <span className='text-indigo-600 text-sm'>📸</span>
          </div>
        );
      default:
        return (
          <div className='flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center'>
            <span className='text-gray-600 text-sm'>📋</span>
          </div>
        );
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      showToast('Please enter a note', 'error');
      return;
    }

    try {
      await addHistoryEntry(order.id, {
        action: 'note_added',
        description: newNote,
        metadata: { type: 'manual_note' },
      });

      setNewNote('');
      setShowAddNoteModal(false);
      showToast('Note added successfully', 'success');
    } catch (error) {
      showToast('Failed to add note', 'error');
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto || !selectedAssignmentId) {
      showToast('Please select a photo and assignment', 'error');
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async e => {
        const photoUrl = e.target?.result as string;

        await uploadDriverPhoto(selectedAssignmentId, {
          photoUrl,
          photoType: 'manual_upload',
          description: photoDescription || 'Photo uploaded by admin',
        });

        setSelectedPhoto(null);
        setPhotoDescription('');
        setSelectedAssignmentId(null);
        setShowPhotoUploadModal(false);
        showToast('Photo uploaded successfully', 'success');
      };
      reader.readAsDataURL(selectedPhoto);
    } catch (error) {
      showToast('Failed to upload photo', 'error');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showToast('File size must be less than 5MB', 'error');
        return;
      }
      setSelectedPhoto(file);
    }
  };

  // Get driver assignments for photo upload
  const driverAssignments = timeline
    .filter(event => event.type === 'driver_assignment')
    .map(event => ({
      id: event.id,
      driver: event.driver,
      type: event.status,
    }));

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900'>Order History</h3>
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setShowAddNoteModal(true)}
              className='px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700'
            >
              Add Note
            </button>
            <button
              onClick={() => setShowPhotoUploadModal(true)}
              className='px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700'
            >
              Upload Photo
            </button>
          </div>
        </div>
        <div className='flex items-center justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900'>Order History</h3>
        </div>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>Error: {error}</p>
          <button
            onClick={() => fetchOrderHistory(order.id)}
            className='mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Order History & Timeline
        </h3>
        <div className='flex items-center space-x-2'>
          <span className='text-sm text-gray-500'>
            {timeline.length} events
          </span>
          <button
            onClick={() => setShowAddNoteModal(true)}
            className='px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Add Note
          </button>
          <button
            onClick={() => setShowPhotoUploadModal(true)}
            className='px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700'
          >
            Upload Photo
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h4 className='text-lg font-semibold text-gray-900 mb-2'>
              Current Status
            </h4>
            <div className='flex items-center space-x-2'>
              <span className='text-2xl'>{getStatusIcon(order.status)}</span>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}
              >
                {getStatusDisplayName(order.status)}
              </span>
            </div>
          </div>
          <div className='text-right'>
            <div className='text-sm text-gray-600'>Last Updated</div>
            <div className='text-sm font-medium'>
              {formatUTCForDisplay(order.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className='bg-white border border-gray-200 rounded-lg p-6'>
        <h4 className='text-lg font-semibold text-gray-900 mb-6'>
          Order Timeline
        </h4>

        {timeline.length === 0 ? (
          <div className='text-center py-8'>
            <div className='text-gray-400 mb-2'>
              <svg
                className='mx-auto h-12 w-12'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <p className='text-gray-500'>No history available for this order</p>
          </div>
        ) : (
          <div className='flow-root'>
            <ul className='-mb-8'>
              {timeline.map((event, eventIdx) => (
                <li key={event.id}>
                  <div className='relative pb-8'>
                    {eventIdx !== timeline.length - 1 ? (
                      <span
                        className='absolute top-8 left-4 -ml-px h-full w-0.5 bg-gray-200'
                        aria-hidden='true'
                      />
                    ) : null}
                    <div className='relative flex space-x-3'>
                      {getTimelineIcon(event.type, event.status)}
                      <div className='min-w-0 flex-1 pt-1.5 flex justify-between space-x-4'>
                        <div className='flex-1'>
                          <p className='text-sm text-gray-900 font-medium'>
                            {event.status}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {event.description}
                          </p>
                          {event.previousStatus && (
                            <p className='text-xs text-gray-400 mt-1'>
                              Changed from: {event.previousStatus}
                            </p>
                          )}
                          {event.createdBy && (
                            <p className='text-xs text-gray-400 mt-1'>
                              Updated by: {event.createdBy}
                            </p>
                          )}
                          {event.driver && (
                            <p className='text-xs text-gray-400 mt-1'>
                              Driver: {event.driver.firstName}{' '}
                              {event.driver.lastName} ({event.driver.phone})
                            </p>
                          )}

                          {/* Display Photos */}
                          {event.photos && event.photos.length > 0 && (
                            <ImageGallery
                              images={event.photos}
                              title='Driver Photos'
                              showLocation={true}
                            />
                          )}

                          {/* Display Issue Report */}
                          {event.issueReport && (
                            <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-lg'>
                              <p className='text-sm font-medium text-red-800'>
                                Issue: {event.issueReport.issueType}
                              </p>
                              <p className='text-sm text-red-700 mt-1'>
                                {event.issueReport.description}
                              </p>
                              <p className='text-xs text-red-600 mt-1'>
                                Severity: {event.issueReport.severity}
                              </p>
                              {event.issueReport?.images && event.issueReport.images.length > 0 && (
                                <div className='mt-2'>
                                  <ImageGallery
                                    images={event.issueReport.images.map((imageUrl, index) => ({
                                      id: (event.issueReport?.id || 0) * 1000 + index, // Generate unique numeric ID
                                      photoUrl: imageUrl,
                                      photoType: 'issue_photo',
                                      description: event.issueReport?.description || '',
                                      createdAt: event.issueReport?.reportedAt || '',
                                    }))}
                                    title='Issue Photos'
                                    maxDisplay={3}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Display Processing Details */}
                          {event.processing && (
                            <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                              <p className='text-sm font-medium text-blue-800'>
                                Processing: {event.processing.processingStatus}
                              </p>
                              {event.processing.totalPieces && (
                                <p className='text-sm text-blue-700 mt-1'>
                                  Pieces: {event.processing.totalPieces}
                                </p>
                              )}
                              {event.processing.totalWeight && (
                                <p className='text-sm text-blue-700'>
                                  Weight: {event.processing.totalWeight}kg
                                </p>
                              )}
                              {event.processing.processingNotes && (
                                <p className='text-sm text-blue-700 mt-1'>
                                  Notes: {event.processing.processingNotes}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className='text-right text-sm whitespace-nowrap text-gray-500'>
                          <time dateTime={event.timestamp}>
                            {formatUTCForDisplay(event.timestamp)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <h4 className='font-semibold text-yellow-900 mb-2'>
            Special Instructions
          </h4>
          <p className='text-yellow-800'>{order.specialInstructions}</p>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-semibold mb-4'>Add Note</h3>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder='Enter your note...'
              className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              rows={4}
            />
            <div className='flex justify-end space-x-2 mt-4'>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={addHistoryForm.loading}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
              >
                {addHistoryForm.loading ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-semibold mb-4'>Upload Photo</h3>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Select Assignment
                </label>
                <select
                  value={selectedAssignmentId || ''}
                  onChange={e =>
                    setSelectedAssignmentId(Number(e.target.value) || null)
                  }
                  className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select a driver assignment...</option>
                  {driverAssignments.map(assignment => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.driver
                        ? `${assignment.driver.firstName} ${assignment.driver.lastName}`
                        : 'Driver'}{' '}
                      - {assignment.type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Select Photo
                </label>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleFileSelect}
                  className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Maximum file size: 5MB
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Description (Optional)
                </label>
                <textarea
                  value={photoDescription}
                  onChange={e => setPhotoDescription(e.target.value)}
                  placeholder='Describe the photo...'
                  className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  rows={3}
                />
              </div>
            </div>

            <div className='flex justify-end space-x-2 mt-6'>
              <button
                onClick={() => {
                  setShowPhotoUploadModal(false);
                  setSelectedPhoto(null);
                  setPhotoDescription('');
                  setSelectedAssignmentId(null);
                }}
                className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={handlePhotoUpload}
                disabled={
                  uploadPhotoForm.loading ||
                  !selectedPhoto ||
                  !selectedAssignmentId
                }
                className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50'
              >
                {uploadPhotoForm.loading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
