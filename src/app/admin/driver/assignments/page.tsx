'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDriverAuth } from '@/admin/hooks/useAdminAuth';
import { useDriverStore } from '@/admin/stores/driverStore';
import {
  getStatusBadgeColor,
  getStatusDisplayName,
} from '@/admin/utils/orderUtils';
import { getCurrentBahrainDate, formatUTCForTimeDisplay, formatUTCForDisplay } from '@/lib/utils/timezone';
import type { DriverAssignment } from '@/admin/api/driver';

export default function DriverAssignmentsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthorized, logout } = useDriverAuth();
  const { assignments, loading, fetchAssignments } = useDriverStore();
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthorized) {
      fetchAssignments();
    }
  }, [isAuthorized, fetchAssignments]);

  // Filter assignments based on criteria
  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    // Date filter
    if (dateFilter === 'today') {
      const bahrainToday = getCurrentBahrainDate();
      filtered = filtered.filter(assignment => {
        if (!assignment.estimatedTime) return false;
        const assignmentDate = new Date(assignment.estimatedTime);
        const assignmentBahrainDate = assignmentDate.toLocaleDateString('en-CA', { 
          timeZone: 'Asia/Bahrain' 
        });
        return bahrainToday === assignmentBahrainDate;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.assignmentType === typeFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(assignment => 
        assignment.order.orderNumber.toLowerCase().includes(term) ||
        assignment.order.customerFirstName.toLowerCase().includes(term) ||
        assignment.order.customerLastName.toLowerCase().includes(term) ||
        assignment.order.customerAddress?.toLowerCase().includes(term)
      );
    }

    // Sort by estimated time
    return filtered.sort((a, b) => {
      if (a.estimatedTime && b.estimatedTime) {
        return new Date(a.estimatedTime).getTime() - new Date(b.estimatedTime).getTime();
      }
      return 0;
    });
  }, [assignments, statusFilter, typeFilter, dateFilter, searchTerm]);

  const handleViewAssignment = (assignment: DriverAssignment) => {
    router.push(`/admin/driver/assignments/${assignment.id}`);
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'today' || searchTerm !== '';

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('today');
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect to login
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                My Assignments
              </h1>
              <p className='mt-1 text-sm text-gray-500'>
                Manage your pickup and delivery assignments - {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => router.push('/admin/driver')}
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
                <span>Back to Dashboard</span>
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

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Filters Accordion */}
        <div className='bg-white shadow rounded-lg mb-8'>
          <div 
            className='px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors'
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-3'>
                <h2 className='text-lg font-medium text-gray-900'>Filters</h2>
                {hasActiveFilters && (
                  <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    Active
                  </span>
                )}
              </div>
              <div className='flex items-center space-x-2'>
                {hasActiveFilters && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilters();
                    }}
                    className='text-sm text-gray-500 hover:text-gray-700'
                  >
                    Clear
                  </button>
                )}
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                    filtersExpanded ? 'rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Collapsible Filters Content */}
          <div className={`transition-all duration-200 ease-in-out overflow-hidden ${
            filtersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className='p-6 border-t border-gray-100'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
                {/* Search */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Search
                  </label>
                  <input
                    type='text'
                    placeholder='Order #, customer, address...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                {/* Date Filter */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Date
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='today'>Today</option>
                    <option value='all'>All Dates</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='all'>All Status</option>
                    <option value='ASSIGNED'>Assigned</option>
                    <option value='IN_PROGRESS'>In Progress</option>
                    <option value='COMPLETED'>Completed</option>
                    <option value='CANCELLED'>Cancelled</option>
                    <option value='FAILED'>Failed</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='all'>All Types</option>
                    <option value='pickup'>Pickup</option>
                    <option value='delivery'>Delivery</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                <div className='flex items-end'>
                  <button
                    onClick={clearFilters}
                    className='w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className='bg-white shadow rounded-lg'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <div className='flex justify-between items-center'>
              <h2 className='text-lg font-medium text-gray-900'>
                Assignments ({filteredAssignments.length})
              </h2>
              {loading && (
                <div className='flex items-center space-x-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                  <span className='text-sm text-gray-500'>Loading...</span>
                </div>
              )}
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className='text-center py-12'>
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
                    d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No assignments found
              </h3>
              <p className='text-gray-600 mb-4'>
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more results.'
                  : 'You have no assignments at the moment.'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className='divide-y divide-gray-200'>
              {filteredAssignments.map(assignment => (
                <div
                  key={assignment.id}
                  className='border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer'
                  onClick={() => handleViewAssignment(assignment)}
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-3 mb-2'>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            assignment.assignmentType === 'pickup' ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                        ></div>
                        <h3 className='text-lg font-medium text-gray-900'>
                          {assignment.assignmentType === 'pickup' ? 'Pickup' : 'Delivery'} - {assignment.order.orderNumber}
                        </h3>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(assignment.status)}`}
                        >
                          {getStatusDisplayName(assignment.status)}
                        </span>
                      </div>
                      <p className='text-sm text-gray-600'>
                        Customer: {assignment.order.customerFirstName} {assignment.order.customerLastName}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-medium text-gray-900'>
                        {assignment.estimatedTime ? formatUTCForTimeDisplay(assignment.estimatedTime) : 'Time TBD'}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {assignment.estimatedTime ? formatUTCForDisplay(assignment.estimatedTime) : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='text-gray-500'>Address:</span>
                      <p className='text-gray-900 truncate'>
                        {assignment.order.customerAddress || 'No address provided'}
                      </p>
                    </div>
                    <div>
                      <span className='text-gray-500'>Phone:</span>
                      <p className='text-gray-900'>
                        {assignment.order.customerPhone || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  {assignment.notes && (
                    <div className='mt-4 p-3 bg-yellow-50 rounded-md'>
                      <p className='text-sm text-yellow-800'>
                        <span className='font-medium'>Notes:</span> {assignment.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 