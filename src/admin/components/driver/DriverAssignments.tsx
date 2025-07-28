import { memo, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDriverStore } from '@/admin/stores/driverStore';
import {
  getStatusBadgeColor,
  getStatusDisplayName,
} from '@/admin/utils/orderUtils';
import {
  getCurrentBahrainDate,
  formatUTCForTimeDisplay,
} from '@/lib/utils/timezone';
import type { DriverAssignment } from '@/admin/api/driver';

// Utility function to format address based on assignment type and available data
const formatAddress = (assignment: DriverAssignment): string => {
  const { assignmentType, order } = assignment;

  // If we have structured address data, use it
  if (order.address) {
    const address = order.address;
    const locationType = address.locationType || 'flat';

    // Helper function to check if a word/phrase exists in text using word boundaries
    const containsWord = (text: string, searchWord: string): boolean => {
      if (!searchWord || !text) return false;

      const normalizedText = text.toLowerCase().trim();
      const normalizedSearch = searchWord.toLowerCase().trim();

      // Split search word into individual words for more accurate matching
      const searchWords = normalizedSearch.split(/\s+/);

      // Check if all search words are present in the text
      return searchWords.every(word => {
        // Use word boundary regex for exact word matching
        const wordRegex = new RegExp(
          `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          'i'
        );
        return wordRegex.test(normalizedText);
      });
    };

    // Helper function to check if text contains a complete phrase
    const containsPhrase = (text: string, phrase: string): boolean => {
      if (!phrase || !text) return false;

      const normalizedText = text.toLowerCase().trim();
      const normalizedPhrase = phrase.toLowerCase().trim();

      // For phrases, check if the complete phrase exists
      return normalizedText.includes(normalizedPhrase);
    };

    // Build the full address
    const parts: string[] = [];
    const allAddressText = [
      address.addressLine1 || '',
      address.addressLine2 || '',
      address.building || '',
      address.area || '',
      address.city || '',
      address.landmark || '',
    ]
      .filter(Boolean)
      .join(' ');

    // Add location-specific details first
    switch (locationType) {
      case 'hotel':
        if (address.building && address.floor) {
          parts.push(`Hotel: ${address.building} - Room ${address.floor}`);
        } else if (address.building) {
          parts.push(`Hotel: ${address.building}`);
        }
        break;
      case 'home':
        if (address.building) {
          parts.push(`Home: ${address.building}`);
        }
        break;
      case 'flat':
        if (address.building && address.floor) {
          parts.push(`Building: ${address.building}, Floor: ${address.floor}`);
        } else if (address.building) {
          parts.push(`Building: ${address.building}`);
        }
        break;
      case 'office':
        if (address.building && address.apartment) {
          parts.push(`Office: ${address.building}, ${address.apartment}`);
        } else if (address.building) {
          parts.push(`Office: ${address.building}`);
        }
        break;
    }

    // Add address lines (avoiding duplicates with location details)
    if (address.addressLine1) {
      const buildingAlreadyIncluded =
        address.building &&
        (containsWord(address.addressLine1, address.building) ||
          containsPhrase(address.addressLine1, address.building));

      if (!buildingAlreadyIncluded) {
        parts.push(address.addressLine1);
      }
    }

    if (address.addressLine2) {
      parts.push(address.addressLine2);
    }

    // Add area only if not already mentioned in any part
    if (address.area && !containsWord(allAddressText, address.area)) {
      parts.push(address.area);
    }

    // Add city only if not already mentioned in any part
    if (address.city && !containsWord(allAddressText, address.city)) {
      parts.push(address.city);
    }

    // Add landmark if available and not already mentioned
    if (address.landmark && !containsWord(allAddressText, address.landmark)) {
      parts.push(`Near: ${address.landmark}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }

  // Fallback to customer address if no structured address
  return order.customerAddress || 'No address provided';
};

export const DriverAssignments = memo(() => {
  const router = useRouter();
  const { assignments, loading, fetchAssignments } = useDriverStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleViewAssignment = (assignment: DriverAssignment) => {
    router.push(`/admin/driver/assignments/${assignment.id}`);
  };

  // Filter today's assignments based on Bahraini time and additional filters
  const todaysAssignments = useMemo(() => {
    return assignments
      .filter(assignment => {
        if (!assignment.estimatedTime) return false;

        // Get current Bahrain date
        const bahrainToday = getCurrentBahrainDate();

        // Convert assignment time to Bahrain time for comparison
        const assignmentDate = new Date(assignment.estimatedTime);
        const assignmentBahrainDate = assignmentDate.toLocaleDateString(
          'en-CA',
          {
            timeZone: 'Asia/Bahrain',
          }
        ); // Returns YYYY-MM-DD format

        const isToday = bahrainToday === assignmentBahrainDate;

        // Apply status filter
        const statusMatches =
          statusFilter === 'all' || assignment.status === statusFilter;

        // Apply type filter
        const typeMatches =
          typeFilter === 'all' || assignment.assignmentType === typeFilter;

        return isToday && statusMatches && typeMatches;
      })
      .sort((a, b) => {
        // Sort by estimated time, then by status priority
        if (a.estimatedTime && b.estimatedTime) {
          return (
            new Date(a.estimatedTime).getTime() -
            new Date(b.estimatedTime).getTime()
          );
        }
        return 0;
      });
  }, [assignments, statusFilter, typeFilter]);

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
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Filters and Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex items-center space-x-4'>
          <h4 className='text-sm font-medium text-gray-900'>
            Today&apos;s Assignments ({todaysAssignments.length})
          </h4>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className='text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500'
          >
            <option value='all'>All Status</option>
            <option value='ASSIGNED'>Assigned</option>
            <option value='IN_PROGRESS'>In Progress</option>
            <option value='COMPLETED'>Completed</option>
            <option value='CANCELLED'>Cancelled</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className='text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500'
          >
            <option value='all'>All Types</option>
            <option value='pickup'>Pickup</option>
            <option value='delivery'>Delivery</option>
          </select>
        </div>
      </div>

      {/* Assignments Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {(showAll ? todaysAssignments : todaysAssignments.slice(0, 6)).map(
          assignment => (
            <div
              key={assignment.id}
              className='bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer'
              onClick={() => handleViewAssignment(assignment)}
            >
              <div className='flex justify-between items-start mb-2'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        assignment.assignmentType === 'pickup'
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                      }`}
                    ></div>
                    <h5 className='font-medium text-gray-900 truncate'>
                      {assignment.assignmentType === 'pickup'
                        ? 'Pickup'
                        : 'Delivery'}{' '}
                      - {assignment.order.orderNumber}
                    </h5>
                  </div>
                  <p className='text-sm text-gray-600 truncate'>
                    {assignment.order.customerFirstName}{' '}
                    {assignment.order.customerLastName}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${getStatusBadgeColor(assignment.status)}`}
                >
                  {getStatusDisplayName(assignment.status)}
                </span>
              </div>

              <div className='text-sm text-gray-500 space-y-1'>
                <div className='flex items-start'>
                  <span className='mr-1 mt-0.5 flex-shrink-0'>📍</span>
                  <p className='text-xs leading-relaxed break-words line-clamp-2'>
                    {formatAddress(assignment)}
                  </p>
                </div>
                <p className='flex items-center'>
                  <span className='mr-1'>⏰</span>
                  {assignment.estimatedTime
                    ? formatUTCForTimeDisplay(assignment.estimatedTime)
                    : 'Time TBD'}
                </p>
              </div>

              {assignment.order.specialInstructions && (
                <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800'>
                  <strong>Note:</strong> {assignment.order.specialInstructions}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Show More/Less Button */}
      {todaysAssignments.length > 6 && (
        <div className='text-center pt-4'>
          <button
            onClick={() => setShowAll(!showAll)}
            className='text-sm text-blue-600 hover:text-blue-800 font-medium'
          >
            {showAll
              ? 'Show Less'
              : `Show ${todaysAssignments.length - 6} More Assignments`}
          </button>
        </div>
      )}
    </div>
  );
});

DriverAssignments.displayName = 'DriverAssignments';
