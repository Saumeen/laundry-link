'use client';

import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/global';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminHeader from '@/components/admin/AdminHeader';
import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';

interface StaffMember {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  phone?: string;
}

interface Role {
  id: number;
  name: UserRole;
  description?: string;
}

// Memoized Staff Card Component
const StaffCard = memo(
  ({
    staff,
    onEdit,
    onToggleStatus,
    onDelete,
    isDeleting,
  }: {
    staff: StaffMember;
    onEdit: (staff: StaffMember) => void;
    onToggleStatus: (staff: StaffMember) => void;
    onDelete: (staff: StaffMember) => void;
    isDeleting: boolean;
  }) => {
    const getRoleColor = (role: UserRole) => {
      switch (role) {
        case 'SUPER_ADMIN':
          return 'bg-purple-100 text-purple-800';
        case 'OPERATION_MANAGER':
          return 'bg-blue-100 text-blue-800';
        case 'DRIVER':
          return 'bg-green-100 text-green-800';
        case 'FACILITY_TEAM':
          return 'bg-orange-100 text-orange-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getRoleDisplayName = (role: UserRole) => {
      switch (role) {
        case 'SUPER_ADMIN':
          return 'Super Admin';
        case 'OPERATION_MANAGER':
          return 'Operation Manager';
        case 'DRIVER':
          return 'Driver';
        case 'FACILITY_TEAM':
          return 'Facility Team';
        default:
          return role;
      }
    };

    return (
      <div
        className={`bg-white border rounded-lg p-6 hover:shadow-md transition-shadow ${
          staff.isActive ? 'border-green-200' : 'border-red-200'
        }`}
      >
        <div className='flex justify-between items-start mb-4'>
          <div className='flex-1'>
            <div className='flex items-center space-x-3 mb-2'>
              <h3 className='text-lg font-semibold text-gray-900'>
                {staff.firstName} {staff.lastName}
              </h3>
              <span
                className={`px-2 py-1 text-xs rounded-full ${getRoleColor(staff.role)}`}
              >
                {getRoleDisplayName(staff.role)}
              </span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  staff.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {staff.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className='text-gray-600 text-sm'>{staff.email}</p>
            {staff.phone && (
              <p className='text-gray-600 text-sm'>{staff.phone}</p>
            )}
          </div>
          <div className='text-right'>
            <p className='text-sm text-gray-500'>Last Login</p>
            <p className='text-sm font-medium text-gray-900'>
              {staff.lastLoginAt
                ? new Date(staff.lastLoginAt).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4 mb-4 text-sm'>
          <div>
            <span className='text-gray-500'>Joined:</span>
            <span className='ml-2 font-medium'>
              {new Date(staff.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className='text-gray-500'>Status:</span>
            <span
              className={`ml-2 font-medium ${
                staff.isActive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {staff.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className='flex space-x-2'>
          <button
            onClick={() => onEdit(staff)}
            className='flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm transition-colors duration-200'
          >
            Edit
          </button>
          <button
            onClick={() => onToggleStatus(staff)}
            className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors duration-200 ${
              staff.isActive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {staff.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDelete(staff)}
            disabled={isDeleting}
            className='flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm transition-colors duration-200 disabled:opacity-50'
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    );
  }
);

StaffCard.displayName = 'StaffCard';

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

// Skeleton Loading Component for Staff Cards
const StaffCardSkeleton = memo(() => (
  <div className='bg-white border rounded-lg p-6 animate-pulse'>
    <div className='flex justify-between items-start mb-4'>
      <div className='flex-1'>
        <div className='flex items-center space-x-3 mb-2'>
          <div className='h-6 bg-gray-200 rounded w-32'></div>
          <div className='h-5 bg-gray-200 rounded w-20'></div>
          <div className='h-5 bg-gray-200 rounded w-16'></div>
        </div>
        <div className='h-4 bg-gray-200 rounded w-48 mb-2'></div>
        <div className='h-4 bg-gray-200 rounded w-32'></div>
      </div>
      <div className='text-right'>
        <div className='h-4 bg-gray-200 rounded w-20 mb-1'></div>
        <div className='h-4 bg-gray-200 rounded w-16'></div>
      </div>
    </div>

    <div className='grid grid-cols-2 gap-4 mb-4'>
      <div className='h-4 bg-gray-200 rounded w-20'></div>
      <div className='h-4 bg-gray-200 rounded w-16'></div>
    </div>

    <div className='flex space-x-2'>
      <div className='flex-1 h-10 bg-gray-200 rounded'></div>
      <div className='flex-1 h-10 bg-gray-200 rounded'></div>
      <div className='flex-1 h-10 bg-gray-200 rounded'></div>
    </div>
  </div>
));

StaffCardSkeleton.displayName = 'StaffCardSkeleton';

export default function StaffManagementPage() {
  const router = useRouter();
  const { adminUser, loading, logout } = useAdminAuth('SUPER_ADMIN');
  const { data: session } = useSession();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [manageableRoles, setManageableRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [staffLoading, setStaffLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingStaffId, setDeletingStaffId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: '' as UserRole | '',
    phone: '',
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: '' as UserRole | '',
    phone: '',
    isActive: true,
  });

  // Memoized form handlers
  const handleFormDataChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleEditFormDataChange = useCallback(
    (field: keyof typeof editFormData, value: string | boolean) => {
      setEditFormData(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  }, []);

  const handleShowCreateForm = useCallback(() => {
    setShowCreateForm(true);
  }, []);

  const handleHideCreateForm = useCallback(() => {
    setShowCreateForm(false);
  }, []);

  const handleShowEditForm = useCallback(() => {
    setShowEditForm(true);
  }, []);

  const handleHideEditForm = useCallback(() => {
    setShowEditForm(false);
    setEditingStaff(null);
  }, []);

  // Memoized computed values
  const filteredStaffMembers = useMemo(() => {
    return staffMembers.filter(staff => {
      const matchesSearch =
        !searchTerm ||
        staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = !roleFilter || staff.role === roleFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' && staff.isActive) ||
        (statusFilter === 'inactive' && !staff.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffMembers, searchTerm, roleFilter, statusFilter]);

  const staffStats = useMemo(() => {
    if (!staffMembers.length) return null;

    return {
      totalStaff: staffMembers.length,
      activeStaff: staffMembers.filter(s => s.isActive).length,
      inactiveStaff: staffMembers.filter(s => !s.isActive).length,
      superAdmins: staffMembers.filter(s => s.role === 'SUPER_ADMIN').length,
      operationManagers: staffMembers.filter(
        s => s.role === 'OPERATION_MANAGER'
      ).length,
      drivers: staffMembers.filter(s => s.role === 'DRIVER').length,
      facilityTeam: staffMembers.filter(s => s.role === 'FACILITY_TEAM').length,
    };
  }, [staffMembers]);

  // Memoized fetch staff function
  const fetchStaffMembers = useCallback(
    async (page: number, append = false) => {
      if (page === 1) {
        setStaffLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          search: searchTerm,
          role: roleFilter,
          status: statusFilter,
        });
        const res = await fetch(`/api/admin/staff?${params}`);
        const data = (await res.json()) as {
          success: boolean;
          staff: StaffMember[];
          manageableRoles: Role[];
          pagination: { totalPages: number; total: number };
          error?: string;
        };

        if (data.success) {
          setStaffMembers(prev =>
            append ? [...prev, ...data.staff] : data.staff
          );
          setManageableRoles(data.manageableRoles);
          setHasMore(page < data.pagination.totalPages);

          // Stats will be calculated by useMemo based on staffMembers
        } else {
          setError(data.error || 'Failed to fetch staff members');
        }
      } catch (error) {
        logger.error('Error fetching staff members:', error);
        setError('Network error');
      } finally {
        setStaffLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchTerm, roleFilter, statusFilter]
  );

  // Memoized logout handler
  const handleLogout = useCallback(() => {
    logout();
    router.push('/admin/login');
  }, [logout, router]);

  const handleCreateStaff = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      try {
        const response = await fetch('/api/admin/staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = (await response.json()) as {
          success?: boolean;
          error?: string;
        };

        if (response.ok) {
          setShowCreateForm(false);
          setFormData({
            email: '',
            firstName: '',
            lastName: '',
            password: '',
            role: '',
            phone: '',
          });
          // Reset to first page and refresh
          setCurrentPage(1);
          setHasMore(true);
          fetchStaffMembers(1, false);
        } else {
          setError(data.error || 'Failed to create staff member');
        }
      } catch (error) {
        setError('Network error');
      }
    },
    [formData, fetchStaffMembers]
  );

  const handleToggleStatus = useCallback(async (staff: StaffMember) => {
    setError('');

    try {
      const response = await fetch(`/api/admin/staff?id=${staff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !staff.isActive }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (response.ok) {
        // Update the staff member in the local state
        setStaffMembers(prev =>
          prev.map(s =>
            s.id === staff.id ? { ...s, isActive: !s.isActive } : s
          )
        );
        // Show success message (you can add a success state if needed)
        logger.info(data.message || 'Staff status updated successfully');
      } else {
        setError(data.error || 'Failed to update staff status');
      }
    } catch {
      setError('Failed to toggle staff status');
    }
  }, []);

  const handleDeleteStaff = useCallback(async (staff: StaffMember) => {
    if (
      !confirm(
        `Are you sure you want to delete ${staff.firstName} ${staff.lastName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingStaffId(staff.id);
    setError('');

    try {
      const response = await fetch(`/api/admin/staff?id=${staff.id}`, {
        method: 'DELETE',
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (response.ok) {
        // Remove the staff member from local state
        setStaffMembers(prev => prev.filter(s => s.id !== staff.id));
        // Show success message (you can add a success state if needed)
        logger.info(data.message || 'Staff member deleted successfully');
      } else {
        setError(data.error || 'Failed to delete staff member');
      }
    } catch {
      setError('Network error');
    } finally {
      setDeletingStaffId(null);
    }
  }, []);

  const handleEditStaff = useCallback(
    (staff: StaffMember) => {
      setEditingStaff(staff);
      setEditFormData({
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        password: '', // Password is not editable
        role: staff.role,
        phone: staff.phone || '',
        isActive: staff.isActive,
      });
      handleShowEditForm();
    },
    [handleShowEditForm]
  );

  const handleUpdateStaff = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingStaff) return;

      setError('');

      try {
        // Prepare update data (only include fields that have changed)
        const updateData: Record<string, unknown> = {};

        if (editFormData.email !== editingStaff.email) {
          updateData.email = editFormData.email;
        }
        if (editFormData.firstName !== editingStaff.firstName) {
          updateData.firstName = editFormData.firstName;
        }
        if (editFormData.lastName !== editingStaff.lastName) {
          updateData.lastName = editFormData.lastName;
        }
        if (editFormData.role !== editingStaff.role) {
          updateData.role = editFormData.role;
        }
        if (editFormData.phone !== (editingStaff.phone || '')) {
          updateData.phone = editFormData.phone;
        }
        if (editFormData.isActive !== editingStaff.isActive) {
          updateData.isActive = editFormData.isActive;
        }
        if (editFormData.password) {
          updateData.password = editFormData.password;
        }

        // Only make the request if there are changes
        if (Object.keys(updateData).length === 0) {
          handleHideEditForm();
          return;
        }

        const response = await fetch(`/api/admin/staff?id=${editingStaff.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        const data = (await response.json()) as {
          message?: string;
          error?: string;
          staff?: StaffMember;
        };

        if (response.ok) {
          // Update the staff member in the local state
          setStaffMembers(prev =>
            prev.map(s =>
              s.id === editingStaff.id
                ? {
                    ...s,
                    email: data.staff?.email || s.email,
                    firstName: data.staff?.firstName || s.firstName,
                    lastName: data.staff?.lastName || s.lastName,
                    role: data.staff?.role || s.role,
                    phone: data.staff?.phone || s.phone,
                    isActive:
                      data.staff?.isActive !== undefined
                        ? data.staff.isActive
                        : s.isActive,
                  }
                : s
            )
          );

          handleHideEditForm();
          setError(''); // Clear any previous errors
        } else {
          setError(data.error || 'Failed to update staff member');
        }
      } catch {
        setError('Network error');
      }
    },
    [editingStaff, editFormData, handleHideEditForm]
  );

  useEffect(() => {
    if (!loading && adminUser) {
      fetchStaffMembers(1, false); // Initial fetch
    }
  }, [loading, adminUser, fetchStaffMembers]);

  // Debounced search and filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      setHasMore(true);
      fetchStaffMembers(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, roleFilter, statusFilter, fetchStaffMembers]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const currentObserver = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setCurrentPage(prev => {
            const nextPage = prev + 1;
            fetchStaffMembers(nextPage, true);
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
  }, [hasMore, isLoadingMore, fetchStaffMembers]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600 text-lg font-medium'>
            Loading Staff Management...
          </p>
          <p className='text-gray-500 text-sm mt-2'>
            Please wait while we fetch staff data
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
        title='Staff Management'
        subtitle='Manage staff members and roles'
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
              title='Total Staff'
              value={staffStats?.totalStaff.toLocaleString() || '0'}
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
              title='Active Staff'
              value={staffStats?.activeStaff.toLocaleString() || '0'}
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
              title='Super Admins'
              value={staffStats?.superAdmins.toLocaleString() || '0'}
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
              bgColor='bg-purple-500'
            />

            <StatsCard
              title='Drivers'
              value={staffStats?.drivers.toLocaleString() || '0'}
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
                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
              }
              bgColor='bg-green-600'
            />
          </div>

          {/* Additional Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <StatsCard
              title='Operation Managers'
              value={staffStats?.operationManagers.toLocaleString() || '0'}
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
                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                  />
                </svg>
              }
              bgColor='bg-blue-600'
            />

            <StatsCard
              title='Facility Team'
              value={staffStats?.facilityTeam.toLocaleString() || '0'}
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
                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                  />
                </svg>
              }
              bgColor='bg-orange-500'
            />

            <StatsCard
              title='Inactive Staff'
              value={staffStats?.inactiveStaff.toLocaleString() || '0'}
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
          </div>

          {/* Search and Filters */}
          <div className='bg-white shadow rounded-lg p-6 mb-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <label
                  htmlFor='search'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Search Staff
                </label>
                <input
                  type='text'
                  id='search'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder='Search by name or email...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label
                  htmlFor='role'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Role Filter
                </label>
                <select
                  id='role'
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>All Roles</option>
                  <option value='SUPER_ADMIN'>Super Admin</option>
                  <option value='OPERATION_MANAGER'>Operation Manager</option>
                  <option value='DRIVER'>Driver</option>
                  <option value='FACILITY_TEAM'>Facility Team</option>
                </select>
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
                  <option value=''>All Status</option>
                  <option value='active'>Active Only</option>
                  <option value='inactive'>Inactive Only</option>
                </select>
              </div>
              <div className='flex items-end space-x-2'>
                <button
                  onClick={handleClearFilters}
                  className='flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200'
                >
                  Clear Filters
                </button>
                <button
                  onClick={handleShowCreateForm}
                  className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200'
                >
                  Add Staff
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className='mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
              {error}
            </div>
          )}

          {/* Create Staff Form */}
          {showCreateForm && (
            <div className='bg-white shadow rounded-lg p-6 mb-6'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Create New Staff Member
                </h3>
                <button
                  onClick={handleHideCreateForm}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <svg
                    className='w-6 h-6'
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
              <form onSubmit={handleCreateStaff} className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Email *
                    </label>
                    <input
                      type='email'
                      value={formData.email}
                      onChange={e =>
                        handleFormDataChange('email', e.target.value)
                      }
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={e =>
                        handleFormDataChange('role', e.target.value)
                      }
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value=''>Select Role</option>
                      {manageableRoles.map(role => (
                        <option key={role.id} value={role.name}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      First Name *
                    </label>
                    <input
                      type='text'
                      value={formData.firstName}
                      onChange={e =>
                        handleFormDataChange('firstName', e.target.value)
                      }
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Last Name *
                    </label>
                    <input
                      type='text'
                      value={formData.lastName}
                      onChange={e =>
                        handleFormDataChange('lastName', e.target.value)
                      }
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Password *
                    </label>
                    <input
                      type='password'
                      value={formData.password}
                      onChange={e =>
                        handleFormDataChange('password', e.target.value)
                      }
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Phone
                    </label>
                    <input
                      type='tel'
                      value={formData.phone}
                      onChange={e =>
                        handleFormDataChange('phone', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>
                <div className='flex space-x-4'>
                  <button
                    type='submit'
                    className='bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200'
                  >
                    Create Staff Member
                  </button>
                  <button
                    type='button'
                    onClick={handleHideCreateForm}
                    className='bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Staff Form */}
          {showEditForm && editingStaff && (
            <div className='bg-white shadow rounded-lg p-6 mb-6'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Edit Staff Member
                </h3>
                <button
                  onClick={handleHideEditForm}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <svg
                    className='w-6 h-6'
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
              <form onSubmit={handleUpdateStaff} className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Email *
                    </label>
                    <input
                      type='email'
                      value={editFormData.email}
                      onChange={e =>
                        handleEditFormDataChange('email', e.target.value)
                      }
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Role *
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={e =>
                        handleEditFormDataChange(
                          'role',
                          e.target.value as UserRole
                        )
                      }
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value=''>Select Role</option>
                      {manageableRoles.map(role => (
                        <option key={role.id} value={role.name}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      First Name *
                    </label>
                    <input
                      type='text'
                      value={editFormData.firstName}
                      onChange={e =>
                        handleEditFormDataChange('firstName', e.target.value)
                      }
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Last Name *
                    </label>
                    <input
                      type='text'
                      value={editFormData.lastName}
                      onChange={e =>
                        handleEditFormDataChange('lastName', e.target.value)
                      }
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Password (leave blank to keep current)
                    </label>
                    <input
                      type='password'
                      value={editFormData.password}
                      onChange={e =>
                        handleEditFormDataChange('password', e.target.value)
                      }
                      placeholder='Enter new password or leave blank'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Phone
                    </label>
                    <input
                      type='tel'
                      value={editFormData.phone}
                      onChange={e =>
                        handleEditFormDataChange('phone', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Status
                    </label>
                    <select
                      value={editFormData.isActive ? 'active' : 'inactive'}
                      onChange={e =>
                        handleEditFormDataChange(
                          'isActive',
                          e.target.value === 'active'
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='active'>Active</option>
                      <option value='inactive'>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className='flex space-x-4'>
                  <button
                    type='submit'
                    className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200'
                  >
                    Save Changes
                  </button>
                  <button
                    type='button'
                    onClick={handleHideEditForm}
                    className='bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Staff Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            {staffLoading && staffMembers.length === 0
              ? // Show skeleton loading for initial load
                Array.from({ length: 6 }).map((_, index) => (
                  <StaffCardSkeleton key={index} />
                ))
              : filteredStaffMembers.map(staff => (
                  <StaffCard
                    key={staff.id}
                    staff={staff}
                    onEdit={handleEditStaff}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteStaff}
                    isDeleting={deletingStaffId === staff.id}
                  />
                ))}
          </div>

          {/* Infinite scroll loader */}
          <div ref={loadMoreRef} className='flex justify-center py-6'>
            {isLoadingMore && (
              <span className='inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></span>
            )}
            {!hasMore && filteredStaffMembers.length > 0 && !isLoadingMore && (
              <span className='text-gray-500'>No more staff members</span>
            )}
          </div>

          {/* No staff message */}
          {filteredStaffMembers.length === 0 && !staffLoading && (
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
                No staff members found
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                {searchTerm || roleFilter || statusFilter
                  ? 'Try adjusting your search criteria.'
                  : 'No staff members have been added yet.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
