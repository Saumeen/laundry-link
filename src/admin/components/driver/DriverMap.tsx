import { memo, useEffect, useState } from 'react';
import { useDriverStore } from '@/admin/stores/driverStore';
import type { DriverAssignment } from '@/admin/api/driver';

// Google Maps configuration - removed unused variable

export const DriverMap = memo(() => {
  const { assignments } = useDriverStore();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Google Maps API is available
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      setIsMapLoaded(true);
    } else {
      // Load Google Maps API if not already loaded
      const loadGoogleMaps = () => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsMapLoaded(true);
        script.onerror = () => setMapError('Failed to load Google Maps');
        document.head.appendChild(script);
      };

      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        loadGoogleMaps();
      }
    }
  }, []);

  // Get assignment locations for map markers
  const getAssignmentLocations = () => {
    return assignments
      .filter(
        assignment =>
          assignment.order.address?.latitude &&
          assignment.order.address?.longitude
      )
      .map(assignment => ({
        id: assignment.id,
        position: {
          lat: assignment.order.address!.latitude!,
          lng: assignment.order.address!.longitude!,
        },
        title: `${assignment.assignmentType} - ${assignment.order.orderNumber}`,
        type: assignment.assignmentType,
        status: assignment.status,
      }));
  };

  // Generate Google Maps link for an assignment
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

  if (mapError) {
    return (
      <div className='text-center py-8'>
        <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <svg
            className='w-8 h-8 text-red-600'
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
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>Map Error</h3>
        <p className='text-gray-600 mb-4'>{mapError}</p>
        <button
          onClick={() => window.location.reload()}
          className='bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors'
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isMapLoaded) {
    return (
      <div className='text-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
        <p className='text-gray-500 mt-2'>Loading map...</p>
      </div>
    );
  }

  const locations = getAssignmentLocations();

  if (locations.length === 0) {
    return (
      <div className='text-center py-8'>
        <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <svg
            className='w-8 h-8 text-gray-400'
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
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          No Locations Available
        </h3>
        <p className='text-gray-600 mb-4'>
          No assignment locations are available to display on the map.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h4 className='text-sm font-medium text-gray-900'>
          Assignment Locations
        </h4>
        <span className='text-xs text-gray-500'>
          {locations.length} locations
        </span>
      </div>

      {/* Map Container */}
      <div className='relative w-full h-64 border border-gray-300 rounded-lg overflow-hidden'>
        <div id='driver-map' className='w-full h-full'>
          {/* Google Maps will be rendered here */}
          <div className='w-full h-full bg-gray-100 flex items-center justify-center'>
            <div className='text-center'>
              <svg
                className='w-12 h-12 text-gray-400 mx-auto mb-2'
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
              <p className='text-sm text-gray-500'>
                Interactive map loading...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location List */}
      <div className='space-y-2'>
        {assignments.slice(0, 3).map(assignment => (
          <div
            key={assignment.id}
            className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
          >
            <div className='flex items-center space-x-3'>
              <div
                className={`w-3 h-3 rounded-full ${
                  assignment.assignmentType === 'pickup'
                    ? 'bg-blue-500'
                    : 'bg-green-500'
                }`}
              ></div>
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  {assignment.assignmentType === 'pickup'
                    ? 'Pickup'
                    : 'Delivery'}{' '}
                  - {assignment.order.orderNumber}
                </p>
                <p className='text-xs text-gray-500 truncate max-w-48'>
                  {assignment.order.customerAddress}
                </p>
              </div>
            </div>
            <a
              href={getGoogleMapsLink(assignment)}
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 hover:text-blue-800 text-sm'
            >
              Open
            </a>
          </div>
        ))}
      </div>

      {assignments.length > 3 && (
        <div className='text-center pt-2'>
          <button className='text-sm text-blue-600 hover:text-blue-800'>
            View {assignments.length - 3} more locations
          </button>
        </div>
      )}
    </div>
  );
});

DriverMap.displayName = 'DriverMap';
