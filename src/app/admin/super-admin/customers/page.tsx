'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { AdminUser, UserRole } from '@/types/global';
import {
  EditCustomerModal,
  CustomerDetailsModal,
  ResetPasswordModal,
} from '@/components/admin/CustomerModals';
import AdminHeader from '@/components/admin/AdminHeader';

interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  wallet?: {
    balance: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
  addresses: Address[];
  _count: {
    orders: number;
  };
}

interface Address {
  id: number;
  label: string;
  addressLine1: string;
  city: string;
  isDefault: boolean;
}

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalOrders: number;
}

// Memoized Customer Card Component
const CustomerCard = memo(
  ({
    customer,
    onEdit,
    onViewDetails,
    onResetPassword,
    onToggleStatus,
  }: {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onViewDetails: (customer: Customer) => void;
    onResetPassword: (customer: Customer) => void;
    onToggleStatus: (customer: Customer) => void;
  }) => (
    <div
      className={`bg-white border rounded-lg p-6 hover:shadow-md transition-shadow ${
        customer.isActive ? 'border-green-200' : 'border-red-200'
      }`}
    >
      <div className='flex justify-between items-start mb-4'>
        <div className='flex-1'>
          <div className='flex items-center space-x-3 mb-2'>
            <h3 className='text-lg font-semibold text-gray-900'>
              {customer.firstName} {customer.lastName}
            </h3>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                customer.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {customer.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className='text-gray-600 text-sm'>{customer.email}</p>
          {customer.phone && (
            <p className='text-gray-600 text-sm'>{customer.phone}</p>
          )}
        </div>
        <div className='text-right'>
          <p className='text-sm text-gray-500'>Wallet Balance</p>
          <p className='text-lg font-semibold text-green-600'>
            {customer.wallet?.balance ? `${customer.wallet.currency} ${customer.wallet.balance.toFixed(2)}` : 'No wallet'}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4 mb-4 text-sm'>
        <div>
          <span className='text-gray-500'>Orders:</span>
          <span className='ml-2 font-medium'>{customer._count.orders}</span>
        </div>
        <div>
          <span className='text-gray-500'>Addresses:</span>
          <span className='ml-2 font-medium'>{customer.addresses.length}</span>
        </div>
        <div>
          <span className='text-gray-500'>Joined:</span>
          <span className='ml-2 font-medium'>
            {new Date(customer.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div>
          <span className='text-gray-500'>Last Updated:</span>
          <span className='ml-2 font-medium'>
            {new Date(customer.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className='flex space-x-2'>
        <button
          onClick={() => onViewDetails(customer)}
          className='flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm'
        >
          View Details
        </button>
        <button
          onClick={() => onEdit(customer)}
          className='flex-1 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm'
        >
          Edit
        </button>
        <button
          onClick={() => onResetPassword(customer)}
          className='flex-1 bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 text-sm'
        >
          Reset Password
        </button>
        <button
          onClick={() => onToggleStatus(customer)}
          className={`flex-1 px-3 py-2 rounded-md text-sm ${
            customer.isActive
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {customer.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  )
);

CustomerCard.displayName = 'CustomerCard';

// Memoized Stats Card Component
const StatsCard = memo(
  ({
    title,
    value,
    icon,
    bgColor,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    bgColor: string;
  }) => (
    <div className='bg-white overflow-hidden shadow rounded-lg'>
      <div className='p-5'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <div
              className={`w-8 h-8 ${bgColor} rounded-md flex items-center justify-center`}
            >
              {icon}
            </div>
          </div>
          <div className='ml-5 w-0 flex-1'>
            <dl>
              <dt className='text-sm font-medium text-gray-500 truncate'>
                {title}
              </dt>
              <dd className='text-lg font-medium text-gray-900'>{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
);

StatsCard.displayName = 'StatsCard';

// Skeleton Loading Component for Customer Cards
const CustomerCardSkeleton = memo(() => (
  <div className='bg-white border rounded-lg p-6 animate-pulse'>
    <div className='flex justify-between items-start mb-4'>
      <div className='flex-1'>
        <div className='flex items-center space-x-3 mb-2'>
          <div className='h-6 bg-gray-200 rounded w-32'></div>
          <div className='h-5 bg-gray-200 rounded w-16'></div>
        </div>
        <div className='h-4 bg-gray-200 rounded w-48 mb-2'></div>
        <div className='h-4 bg-gray-200 rounded w-32'></div>
      </div>
      <div className='text-right'>
        <div className='h-4 bg-gray-200 rounded w-20 mb-1'></div>
        <div className='h-6 bg-gray-200 rounded w-16'></div>
      </div>
    </div>

    <div className='grid grid-cols-2 gap-4 mb-4'>
      <div className='h-4 bg-gray-200 rounded w-20'></div>
      <div className='h-4 bg-gray-200 rounded w-24'></div>
      <div className='h-4 bg-gray-200 rounded w-16'></div>
      <div className='h-4 bg-gray-200 rounded w-28'></div>
    </div>

    <div className='flex space-x-2'>
      <div className='flex-1 h-10 bg-gray-200 rounded'></div>
      <div className='flex-1 h-10 bg-gray-200 rounded'></div>
      <div className='flex-1 h-10 bg-gray-200 rounded'></div>
      <div className='flex-1 h-10 bg-gray-200 rounded'></div>
    </div>
  </div>
));

CustomerCardSkeleton.displayName = 'CustomerCardSkeleton';

export default function CustomerManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [message, setMessage] = useState('');

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

  // Memoized fetch customers function
  const fetchCustomers = useCallback(
    async (page: number, append = false) => {
      if (page === 1) {
        setCustomersLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          search: searchTerm,
          status: statusFilter,
        });
        const res = await fetch(`/api/admin/customers?${params}`);
        const data = (await res.json()) as {
          success: boolean;
          customers: Customer[];
          pagination: { totalPages: number };
          error?: string;
        };
        if (data.success) {
          setCustomers(prev =>
            append ? [...prev, ...data.customers] : data.customers
          );
          setHasMore(page < data.pagination.totalPages);
        } else {
          // Handle error silently or show user-friendly message
          setCustomers(prev => (append ? prev : []));
        }
      } catch (error) {
        // Handle error silently or show user-friendly message
        setCustomers(prev => (append ? prev : []));
      } finally {
        setCustomersLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchTerm, statusFilter]
  );

  // Memoized fetch stats function
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/super-admin-stats');
      if (response.ok) {
        const data = (await response.json()) as {
          totalCustomers: number;
          totalOrders: number;
        };

        setStats({
          totalCustomers: data.totalCustomers,
          activeCustomers: 0, // Will be calculated from customers list
          inactiveCustomers: 0, // Will be calculated from customers list
          totalOrders: data.totalOrders,
        });
      }
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
  }, []); // Remove customers dependency to prevent infinite loop

  // Memoized logout handler
  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: '/admin/login' });
  }, []);

  const handleEditCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  }, []);

  const handleViewDetails = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  }, []);

  const handleOpenResetPassword = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPasswordModal(true);
  }, []);

  const handleToggleStatus = useCallback(async (customer: Customer) => {
    try {
      const response = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          updates: { isActive: !customer.isActive },
        }),
      });

      if (response.ok) {
        setMessage(
          `Customer ${customer.isActive ? 'deactivated' : 'activated'} successfully`
        );
        // Update the customer in the local state
        setCustomers(prev =>
          prev.map(c =>
            c.id === customer.id ? { ...c, isActive: !c.isActive } : c
          )
        );
      } else {
        setMessage('Failed to update customer status');
      }
    } catch (error) {
      setMessage('Error updating customer status');
    }
  }, []);

  // Modal handlers
  const handleSaveCustomer = useCallback(
    async (customerId: number, updates: Record<string, unknown>) => {
      const response = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      // Update the customer in the local state
      setCustomers(prev =>
        prev.map(c => (c.id === customerId ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const handleEditAddress = useCallback(
    async (addressId: number, updates: Record<string, unknown>) => {
      const response = await fetch('/api/admin/customer-addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId, updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update address');
      }

      // Refresh customer data
      if (selectedCustomer) {
        const customerResponse = await fetch(
          `/api/admin/customers?customerId=${selectedCustomer.id}`
        );
        if (customerResponse.ok) {
          const data = (await customerResponse.json()) as {
            customers: Customer[];
          };
          const updatedCustomer = data.customers.find(
            c => c.id === selectedCustomer.id
          );
          if (updatedCustomer) {
            setSelectedCustomer(updatedCustomer);
          }
        }
      }
    },
    [selectedCustomer]
  );

  const handleDeleteAddress = useCallback(
    async (addressId: number) => {
      const response = await fetch(
        `/api/admin/customer-addresses?id=${addressId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      // Refresh customer data
      if (selectedCustomer) {
        const customerResponse = await fetch(
          `/api/admin/customers?customerId=${selectedCustomer.id}`
        );
        if (customerResponse.ok) {
          const data = (await customerResponse.json()) as {
            customers: Customer[];
          };
          const updatedCustomer = data.customers.find(
            c => c.id === selectedCustomer.id
          );
          if (updatedCustomer) {
            setSelectedCustomer(updatedCustomer);
          }
        }
      }
    },
    [selectedCustomer]
  );

  const handleResetPassword = useCallback(
    async (customerId: number, newPassword?: string) => {
      const response = await fetch('/api/admin/reset-customer-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, newPassword }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset password');
      }

      const data = (await response.json()) as { message: string };
      setMessage(data.message);
    },
    []
  );

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (
      session?.userType !== 'admin' ||
      (session?.role !== 'SUPER_ADMIN' && session?.role !== 'OPERATION_MANAGER')
    ) {
      router.push('/admin/login');
      return;
    }

    const user: AdminUser = {
      id: session.adminId || 0,
      email: session.user?.email || '',
      firstName: session.user?.name?.split(' ')[0] || '',
      lastName: session.user?.name?.split(' ').slice(1).join(' ') || '',
      role: session.role as UserRole,
      isActive: session.isActive || false,
      lastLoginAt: undefined,
    };

    setAdminUser(user);
    setLoading(false);
  }, [session, status, router]);

  useEffect(() => {
    if (!loading && adminUser) {
      fetchCustomers(1, false); // Initial fetch
      fetchStats();
    }
  }, [loading, adminUser, fetchCustomers, fetchStats]);

  // Debounced search and filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      setHasMore(true);
      fetchCustomers(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, fetchCustomers]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const currentObserver = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setCurrentPage((prev: number) => {
            const nextPage = prev + 1;
            fetchCustomers(nextPage, true);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.current = currentObserver;

    if (loadMoreRef.current) {
      currentObserver.observe(loadMoreRef.current);
    }

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, fetchCustomers]);

  // Update active/inactive customer counts when customers list changes
  useEffect(() => {
    if (customers.length > 0 && stats) {
      const activeCustomers = customers.filter(c => c.isActive).length;
      const inactiveCustomers = customers.filter(c => !c.isActive).length;

      setStats(prev =>
        prev
          ? {
              ...prev,
              activeCustomers,
              inactiveCustomers,
            }
          : null
      );
    }
  }, [customers]); // Only update local counts, don't call API

  if (loading || status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600 text-lg font-medium'>
            Loading Customer Management...
          </p>
          <p className='text-gray-500 text-sm mt-2'>
            Please wait while we fetch customer data
          </p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-100 animate-fadeIn'>
      {/* Header */}
      <AdminHeader
        title='Customer Management'
        subtitle='Manage customer accounts, addresses, and information'
        backUrl={getBackUrl()}
        rightContent={
          <div className='flex items-center space-x-4'>
            <span className='text-sm text-gray-600'>
              Welcome, {adminUser.firstName} {adminUser.lastName}
            </span>
            <button
              onClick={handleLogout}
              className='bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200'
            >
              Logout
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <StatsCard
              title='Total Customers'
              value={(stats?.totalCustomers || 0).toLocaleString()}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
              }
              bgColor='bg-blue-500'
            />

            <StatsCard
              title='Active Customers'
              value={(stats?.activeCustomers || 0).toLocaleString()}
              icon={
                <svg
                  className='w-5 h-5 text-white'
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
              }
              bgColor='bg-green-500'
            />

            <StatsCard
              title='Inactive Customers'
              value={(stats?.inactiveCustomers || 0).toLocaleString()}
              icon={
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              }
              bgColor='bg-red-500'
            />

            <StatsCard
              title='Total Orders'
              value={(stats?.totalOrders || 0).toLocaleString()}
              icon={
                <svg
                  className='w-5 h-5 text-white'
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
              }
              bgColor='bg-yellow-500'
            />
          </div>

          {/* Search and Filters */}
          <div className='bg-white shadow rounded-lg p-6 mb-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label
                  htmlFor='search'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Search Customers
                </label>
                <input
                  type='text'
                  id='search'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder='Search by name, email, or phone...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label
                  htmlFor='status'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Status Filter
                </label>
                <select
                  id='status'
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>All Customers</option>
                  <option value='active'>Active Only</option>
                  <option value='inactive'>Inactive Only</option>
                </select>
              </div>
              <div className='flex items-end'>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setCurrentPage(1);
                  }}
                  className='w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700'
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className='mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded'>
              {message}
            </div>
          )}

          {/* Customers Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            {customersLoading && customers.length === 0
              ? Array.from({ length: 6 }).map((_, index) => (
                  <CustomerCardSkeleton key={index} />
                ))
              : customers.map(customer => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onEdit={handleEditCustomer}
                    onViewDetails={handleViewDetails}
                    onResetPassword={handleOpenResetPassword}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
          </div>
          {/* Infinite scroll loader */}
          <div ref={loadMoreRef} className='flex justify-center py-6'>
            {isLoadingMore && (
              <span className='inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></span>
            )}
            {!hasMore && customers.length > 0 && !isLoadingMore && (
              <span className='text-gray-500'>No more customers</span>
            )}
          </div>

          {/* No customers message */}
          {customers.length === 0 && !loading && (
            <div className='text-center py-12'>
              <svg
                className='mx-auto h-12 w-12 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
              <h3 className='mt-2 text-sm font-medium text-gray-900'>
                No customers found
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                {searchTerm || statusFilter
                  ? 'Try adjusting your search criteria.'
                  : 'No customers have been registered yet.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <EditCustomerModal
        customer={selectedCustomer}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomer(null);
        }}
        onSave={handleSaveCustomer}
      />

      <CustomerDetailsModal
        customer={selectedCustomer}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCustomer(null);
        }}
        onEditAddress={handleEditAddress}
        onDeleteAddress={handleDeleteAddress}
      />

      <ResetPasswordModal
        customer={selectedCustomer}
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setSelectedCustomer(null);
        }}
        onResetPassword={handleResetPassword}
      />
    </div>
  );
}
