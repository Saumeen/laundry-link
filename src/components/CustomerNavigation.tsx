'use client';

import Link from 'next/link';
import { useProfileStore } from '@/customer';
import { useLogout } from '@/hooks/useAuth';
import { useEffect } from 'react';

interface CustomerNavigationProps {
  currentPage: 'dashboard' | 'orders' | 'schedule' | 'services' | 'pricing' | 'addresses' | 'profile' | 'faq';
  title: string;
  subtitle: string;
  icon: string;
}

export default function CustomerNavigation({ currentPage, title, subtitle, icon }: CustomerNavigationProps) {
  const { profile, fetchProfile } = useProfileStore();
  const logout = useLogout();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">{icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(profile?.walletBalance || 0)}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          {/* Mobile wallet balance */}
          <div className="sm:hidden pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Wallet Balance</p>
              <p className="text-sm font-bold text-green-600">
                {formatCurrency(profile?.walletBalance || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            <Link
              href="/customer/dashboard"
              className={`flex items-center px-3 py-4 text-sm font-medium transition-colors whitespace-nowrap ${getActiveClass('dashboard')}`}
            >
              <span className="mr-2">📊</span>
              Dashboard
            </Link>
            <Link
              href="/customer/orders"
              className={`flex items-center px-3 py-4 text-sm font-medium transition-colors whitespace-nowrap ${getActiveClass('orders')}`}
            >
              <span className="mr-2">📦</span>
              Orders
            </Link>
            <Link
              href="/customer/schedule"
              className={`flex items-center px-3 py-4 text-sm font-medium transition-colors whitespace-nowrap ${getActiveClass('schedule')}`}
            >
              <span className="mr-2">📅</span>
              Schedule
            </Link>
            <Link
              href="/services"
              className={`flex items-center px-3 py-4 text-sm font-medium transition-colors whitespace-nowrap ${getActiveClass('services')}`}
            >
              <span className="mr-2">🧺</span>
              Services
            </Link>
            <Link
              href="/pricing"
              className={`flex items-center px-3 py-4 text-sm font-medium transition-colors whitespace-nowrap ${getActiveClass('pricing')}`}
            >
              <span className="mr-2">💰</span>
              Pricing
            </Link>
            <Link
              href="/customer/addresses"
              className={`flex items-center px-3 py-4 text-sm font-medium transition-colors whitespace-nowrap ${getActiveClass('addresses')}`}
            >
              <span className="mr-2">📍</span>
              Addresses
            </Link>
            <Link
              href="/customer/profile"
              className={`flex items-center px-3 py-4 text-sm font-medium transition-colors whitespace-nowrap ${getActiveClass('profile')}`}
            >
              <span className="mr-2">👤</span>
              Profile
            </Link>
            <Link
              href="/faq"
              className={`flex items-center px-3 py-4 text-sm font-medium transition-colors whitespace-nowrap ${getActiveClass('faq')}`}
            >
              <span className="mr-2">❓</span>
              FAQ
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
} 