'use client';

import Link from 'next/link';
import { useProfileStore } from '@/customer';
import { useLogout } from '@/hooks/useAuth';
import { useEffect } from 'react';

interface CustomerNavigationProps {
  currentPage:
    | 'dashboard'
    | 'orders'
    | 'schedule'
    | 'services'
    | 'pricing'
    | 'addresses'
    | 'profile'
    | 'faq';
  title: string;
  subtitle: string;
  icon: string;
}

export default function CustomerNavigation({
  currentPage,
  title,
  subtitle,
  icon,
}: CustomerNavigationProps) {
  const { profile, fetchProfile } = useProfileStore();
  const logout = useLogout();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Add mobile bottom padding to body
  useEffect(() => {
    const addMobilePadding = () => {
      if (window.innerWidth <= 640) {
        document.body.style.paddingBottom = '140px';
      } else {
        document.body.style.paddingBottom = '';
      }
    };

    addMobilePadding();
    window.addEventListener('resize', addMobilePadding);

    return () => {
      document.body.style.paddingBottom = '';
      window.removeEventListener('resize', addMobilePadding);
    };
  }, []);

  const handleLogout = () => {
    logout();
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} BD`;
  };

  const getActiveClass = (page: string) => {
    return currentPage === page
      ? 'text-blue-600 border-b-2 border-blue-600'
      : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300';
  };

  const getMobileActiveClass = (page: string) => {
    return currentPage === page
      ? 'text-blue-600 bg-blue-50'
      : 'text-gray-500 hover:text-gray-700';
  };

  const navigationItems = [
    { href: '/customer/dashboard', label: 'Dashboard', icon: '📊', page: 'dashboard' },
    { href: '/customer/orders', label: 'Orders', icon: '📦', page: 'orders' },
    { href: '/customer/schedule', label: 'Schedule', icon: '📅', page: 'schedule' },
    { href: '/services', label: 'Services', icon: '🧺', page: 'services' },
    { href: '/pricing', label: 'Pricing', icon: '💰', page: 'pricing' },
    { href: '/customer/addresses', label: 'Addresses', icon: '📍', page: 'addresses' },
    { href: '/customer/profile', label: 'Profile', icon: '👤', page: 'profile' },
    { href: '/faq', label: 'FAQ', icon: '❓', page: 'faq' },
  ];

  return (
    <>
      {/* Header */}
      <div className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-3 sm:space-x-4'>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm sm:text-lg'>
                  {icon}
                </span>
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-lg sm:text-2xl font-bold text-gray-900 truncate'>
                  {title}
                </h1>
                <p className='text-xs sm:text-sm text-gray-600 truncate'>
                  {subtitle}
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-2 sm:space-x-4'>
              <div className='hidden sm:block text-right'>
                <p className='text-sm text-gray-600'>Wallet Balance</p>
                <p className='text-lg font-bold text-green-600'>
                  {formatCurrency(profile?.walletBalance || 0)}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className='flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200'
              >
                <svg
                  className='w-3 h-3 sm:w-4 sm:h-4'
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
                <span className='hidden sm:inline'>Logout</span>
              </button>
            </div>
          </div>
          {/* Mobile wallet balance */}
          <div className='sm:hidden pb-3'>
            <div className='flex items-center justify-between'>
              <p className='text-sm text-gray-600'>Wallet Balance</p>
              <p className='text-sm font-bold text-green-600'>
                {formatCurrency(profile?.walletBalance || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <div className='hidden sm:block bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <nav className='flex space-x-8 overflow-x-auto'>
            {navigationItems.map((item) => (
              <Link
                key={item.page}
                href={item.href}
                className={`flex items-center px-3 py-4 text-sm font-medium transition-colors whitespace-nowrap ${getActiveClass(item.page)}`}
              >
                <span className='mr-2'>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <div className='sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50'>
        <div className='grid grid-cols-5 gap-1 p-2'>
          {navigationItems
            .filter(item => ['dashboard', 'orders', 'schedule', 'addresses', 'profile'].includes(item.page))
            .map((item) => (
              <Link
                key={item.page}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${getMobileActiveClass(item.page)}`}
              >
                <span className='text-lg mb-1'>{item.icon}</span>
                <span className='text-xs font-medium'>{item.label}</span>
              </Link>
            ))}
        </div>
      </div>
    </>
  );
}
