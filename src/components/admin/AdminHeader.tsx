'use client';

import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/admin/hooks/useAdminAuth';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backUrl?: string;
  showBackButton?: boolean;
  rightContent?: React.ReactNode;
  showLogout?: boolean;
}

export default function AdminHeader({
  title,
  subtitle,
  onBack,
  backUrl,
  showBackButton = true,
  rightContent,
  showLogout = true,
}: AdminHeaderProps) {
  const router = useRouter();
  const { logout, user } = useAdminAuth();

  // Get the appropriate dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user?.role?.name) return '/admin';
    
    switch (user.role.name) {
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
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      router.push(backUrl);
    } else {
      // Navigate to role-specific dashboard instead of browser back
      router.push(getDashboardUrl());
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className='bg-white shadow-sm border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center space-x-4'>
            {showBackButton && (
              <button
                onClick={handleBack}
                className='flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 group'
              >
                <svg
                  className='w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200'
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
                <span className='text-sm font-medium'>Back to Dashboard</span>
              </button>
            )}

            <div className='flex items-center space-x-3'>
              <div className='w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full'></div>
              <div>
                <h1 className='text-xl font-bold text-gray-900'>{title}</h1>
                {subtitle && (
                  <p className='text-sm text-gray-500'>{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          <div className='flex items-center space-x-3'>
            {rightContent && rightContent}
            {showLogout && (
              <button
                onClick={handleLogout}
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
