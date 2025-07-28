'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProfileStore } from '@/customer';
import { useLogout } from '@/hooks/useAuth';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: '📊' },
  { name: 'Orders', href: '/customer/orders', icon: '📦' },
  { name: 'Schedule', href: '/schedule', icon: '📅' },
  { name: 'Services', href: '/services', icon: '🧺' },
  { name: 'Pricing', href: '/pricing', icon: '💰' },
  { name: 'Addresses', href: '/customer/addresses', icon: '📍' },
  { name: 'Profile', href: '/customer/profile', icon: '👤' },
  { name: 'FAQ', href: '/faq', icon: '❓' },
];

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const pathname = usePathname();
  const { profile } = useProfileStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logout = useLogout();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}
      >
        <div
          className='fixed inset-0 bg-gray-600 bg-opacity-75'
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className='fixed inset-y-0 left-0 flex w-64 flex-col bg-white'>
          <div className='flex h-16 items-center justify-between px-4 border-b border-gray-200'>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>🧺</span>
              </div>
              <span className='text-lg font-bold text-gray-900'>
                LaundryLink
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className='p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100'
            >
              <span className='text-xl'>×</span>
            </button>
          </div>
          <nav className='flex-1 px-4 py-6 space-y-2'>
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className='text-lg'>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className='border-t border-gray-200 p-4'>
            <div className='flex items-center space-x-3 mb-4'>
              <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>
                  {profile?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-900 truncate'>
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p className='text-xs text-gray-500 truncate'>
                  {profile?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className='flex items-center space-x-3 w-full px-3 py-3 sm:py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation'
            >
              <span className='text-lg'>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className='hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col'>
        <div className='flex flex-col flex-grow bg-white border-r border-gray-200'>
          <div className='flex h-16 items-center px-6 border-b border-gray-200'>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>🧺</span>
              </div>
              <span className='text-lg font-bold text-gray-900'>
                LaundryLink
              </span>
            </div>
          </div>
          <nav className='flex-1 px-6 py-6 space-y-2'>
            {navigation.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className='text-lg'>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className='border-t border-gray-200 p-6'>
            <div className='flex items-center space-x-3 mb-4'>
              <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>
                  {profile?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-900 truncate'>
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p className='text-xs text-gray-500 truncate'>
                  {profile?.email}
                </p>
              </div>
            </div>
            <div className='mb-4 pt-4 border-t border-gray-100'>
              <p className='text-xs text-gray-500'>Wallet Balance</p>
              <p className='text-sm font-bold text-green-600'>
                {(profile?.walletBalance || 0).toFixed(3)} BD
              </p>
            </div>
            <button
              onClick={handleLogout}
              className='flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors'
            >
              <span className='text-lg'>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className='lg:pl-64'>
        {/* Top bar */}
        <div className='sticky top-0 z-40 bg-white border-b border-gray-200 lg:hidden'>
          <div className='flex items-center justify-between px-4 py-3'>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className='p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100'
            >
              <span className='text-xl'>☰</span>
            </button>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>
                  {profile?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className='text-right'>
                <p className='text-sm font-medium text-gray-900'>
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p className='text-xs text-gray-500'>
                  {(profile?.walletBalance || 0).toFixed(3)} BD
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className='flex-1'>{children}</main>
      </div>
    </div>
  );
}
