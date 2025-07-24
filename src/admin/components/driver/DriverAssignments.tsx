import { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDriverStore } from '@/admin/stores/driverStore';
import {
  getStatusBadgeColor,
  getStatusDisplayName,
  formatDate,
} from '@/admin/utils/orderUtils';
import type { DriverAssignment } from '@/admin/api/driver';

export const DriverAssignments = memo(() => {
  const router = useRouter();
  const { assignments, loading, fetchAssignments } = useDriverStore();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleViewAssignments = () => {
    router.push('/admin/driver/assignments');
  };

  const handleViewAssignment = (assignment: DriverAssignment) => {
    router.push(`/admin/driver/assignments/${assignment.id}`);
  };

  // Filter today's assignments
  const todaysAssignments = assignments.filter(assignment => {
    if (!assignment.estimatedTime) return false;
    const today = new Date();
    const assignmentDate = new Date(assignment.estimatedTime);
    return today.toDateString() === assignmentDate.toDateString();
  });

  if (loading) {
    return (
      <div className='text-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
        <p className='text-gray-500 mt-2'>Loading assignments...</p>
      </div>
    );
  }

  if (todaysAssignments.length === 0) {
    return (
      <div className='text-center py-8'>
        <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <svg
            className='w-8 h-8 text-blue-600'
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
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          No Active Assignments
        </h3>
        <p className='text-gray-600 mb-4'>
          You don&apos;t have any active assignments for today. New assignments
          will appear here when they are assigned to you.
        </p>
        <button
          onClick={handleViewAssignments}
          className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
        >
          View All Assignments
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h4 className='text-sm font-medium text-gray-900'>
          Today&apos;s Assignments
        </h4>
        <button
          onClick={handleViewAssignments}
          className='text-sm text-blue-600 hover:text-blue-800'
        >
          View All
        </button>
      </div>

      <div className='space-y-3'>
        {todaysAssignments.slice(0, 3).map(assignment => (
          <div
            key={assignment.id}
            className='bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer'
            onClick={() => handleViewAssignment(assignment)}
          >
            <div className='flex justify-between items-start mb-2'>
              <div>
                <h5 className='font-medium text-gray-900'>
                  {assignment.assignmentType === 'pickup'
                    ? 'Pickup'
                    : 'Delivery'}{' '}
                  - {assignment.order.orderNumber}
                </h5>
                <p className='text-sm text-gray-600'>
                  {assignment.order.customerFirstName}{' '}
                  {assignment.order.customerLastName}
                </p>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(assignment.status)}`}
              >
                {getStatusDisplayName(assignment.status)}
              </span>
            </div>

            <div className='text-sm text-gray-500 space-y-1'>
              <p className='truncate'>
                📍 {assignment.order.customerAddress || 'No address provided'}
              </p>
              <p>
                ⏰{' '}
                {assignment.estimatedTime
                  ? formatDate(assignment.estimatedTime)
                  : 'Time TBD'}
              </p>
            </div>

            {assignment.order.specialInstructions && (
              <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800'>
                <strong>Note:</strong> {assignment.order.specialInstructions}
              </div>
            )}
          </div>
        ))}
      </div>

      {todaysAssignments.length > 3 && (
        <div className='text-center pt-2'>
          <button
            onClick={handleViewAssignments}
            className='text-sm text-blue-600 hover:text-blue-800'
          >
            View {todaysAssignments.length - 3} more assignments
          </button>
        </div>
      )}
    </div>
  );
});

DriverAssignments.displayName = 'DriverAssignments';
