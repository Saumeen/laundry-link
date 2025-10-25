"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';
import Logo from '@/components/ui/Logo';

const Header = () => {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const { isAuthenticated, customer } = useAuth();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 600);
  });

  // Handle logout
  const handleLogout = () => {
    signOut();
    setShowDropdown(false);
    router.push('/');
  };

  const customerName = customer
    ? `${customer.firstName || 'User'} ${customer.lastName || ''}`.trim()
    : '';

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 left-0 right-0 z-50 flex items-center justify-between whitespace-nowrap px-4 py-4 sm:px-6 lg:px-10 transition-all duration-500 ease-in-out`}
        style={{
          background: scrolled 
            ? 'rgba(255, 255, 255, 0.35)' 
            : 'rgba(255, 255, 255, 0.20)',
          backdropFilter: scrolled ? 'blur(25px)' : 'blur(15px)',
          WebkitBackdropFilter: scrolled ? 'blur(25px)' : 'blur(15px)',
          borderBottom: scrolled 
            ? '1px solid rgba(255, 255, 255, 0.25)' 
            : '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: scrolled 
            ? '0 12px 40px 0 rgba(31, 38, 135, 0.45)' 
            : '0 6px 25px 0 rgba(31, 38, 135, 0.25)',
        }}
      >
        <Link href="/" className="flex items-center gap-3">
          {/* Circular Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }}
            className="flex-shrink-0"
          >
            <Logo 
              src="/laundry-link-logo.png"
              width={50} 
              height={50} 
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain" 
            />
          </motion.div>
          
          {/* Main Text Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="hidden sm:block"
          >
            <Logo 
              src="/laundry-link-main.png"
              width={140} 
              height={40} 
              className="h-8 w-auto lg:h-10 object-contain" 
            />
          </motion.div>
        </Link>
        
        <div className="flex items-center justify-end gap-2 sm:gap-4 lg:gap-10">
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="hidden items-center gap-8 lg:flex"
          >
            <Link
              className="text-lg font-medium text-gray-600 transition-colors hover:text-[#1a28c2] relative group"
              href="/"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1a28c2] transition-all group-hover:w-full"></span>
            </Link>
            <Link
              className="text-lg font-medium text-gray-600 transition-colors hover:text-[#1a28c2] relative group"
              href="/services"
            >
              Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1a28c2] transition-all group-hover:w-full"></span>
            </Link>
            <Link
              className="text-lg font-medium text-gray-600 transition-colors hover:text-[#1a28c2] relative group"
              href="/pricing"
            >
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1a28c2] transition-all group-hover:w-full"></span>
            </Link>
            <Link
              className="text-lg font-medium text-gray-600 transition-colors hover:text-[#1a28c2] relative group"
              href="/customer/schedule"
            >
              Schedule
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1a28c2] transition-all group-hover:w-full"></span>
            </Link>
          </motion.nav>
          
          {/* Desktop Auth Section */}
          <div className="hidden sm:flex items-center gap-4">
            {isAuthenticated && customer ? (
              // Logged in - Show user dropdown
              <div className="relative">
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-[#1a28c2] transition-colors bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30"
                >
                  <span>👤 {customerName}</span>
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
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </motion.button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className='absolute right-0 mt-2 w-56 sm:w-64 bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl border border-white/50 z-50'
                  >
                    <div className='p-4 border-b border-gray-200/50'>
                      <p className='font-semibold text-gray-900'>
                        {customerName}
                      </p>
                      <p className='text-sm text-gray-600'>{customer.email}</p>
                      <p className='text-sm text-[#1a28c2] font-medium mt-1'>
                        Wallet: {customer.wallet?.balance ? `${customer.wallet.currency} ${customer.wallet.balance.toFixed(3)}` : 'No wallet'}
                      </p>
                    </div>

                    <div className='py-2'>
                      <Link
                        href='/customer/dashboard'
                        className='block px-4 py-3 text-gray-700 hover:bg-[#1a28c2]/10 hover:text-[#1a28c2] transition-colors'
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className='flex items-center'>
                          <svg className='w-4 h-4 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z' />
                          </svg>
                          Dashboard
                        </div>
                      </Link>

                      <Link
                        href='/customer/dashboard?tab=orders'
                        className='block px-4 py-3 text-gray-700 hover:bg-[#1a28c2]/10 hover:text-[#1a28c2] transition-colors'
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className='flex items-center'>
                          <svg className='w-4 h-4 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' />
                          </svg>
                          My Orders
                        </div>
                      </Link>

                      <Link
                        href='/customer/dashboard?tab=addresses'
                        className='block px-4 py-3 text-gray-700 hover:bg-[#1a28c2]/10 hover:text-[#1a28c2] transition-colors'
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className='flex items-center'>
                          <svg className='w-4 h-4 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                          </svg>
                          Addresses
                        </div>
                      </Link>

                      <Link
                        href='/customer/schedule'
                        className='block px-4 py-3 text-gray-700 hover:bg-[#1a28c2]/10 hover:text-[#1a28c2] transition-colors'
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className='flex items-center'>
                          <svg className='w-4 h-4 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                          </svg>
                          New Order
                        </div>
                      </Link>
                    </div>

                    <div className='border-t border-gray-200/50 py-2'>
                      <button
                        onClick={handleLogout}
                        className='block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50/50 transition-colors'
                      >
                        <div className='flex items-center'>
                          <svg className='w-4 h-4 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                          </svg>
                          Sign Out
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              // Not logged in - Show Sign In button
              <Link href="/registerlogin">
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.9, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#1a28c2] px-6 text-base font-bold leading-normal tracking-wide text-white shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl flex h-12 lg:h-14 lg:px-8 lg:text-lg"
                >
                  <span className="truncate">Sign In</span>
                </motion.button>
              </Link>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-full p-2 hover:bg-gray-200/50 lg:hidden transition-colors"
          >
            <span className="material-symbols-outlined text-3xl text-gray-700">
              {isMenuOpen ? 'close' : 'menu'}
            </span>
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden sticky top-16 sm:top-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg"
        >
          <div className="px-3 py-4 sm:px-4 sm:py-6 space-y-3 sm:space-y-4">
            <Link
              href="/"
              className="block py-2 sm:py-3 text-base sm:text-lg font-medium text-gray-700 hover:text-[#1a28c2] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/services"
              className="block py-2 sm:py-3 text-base sm:text-lg font-medium text-gray-700 hover:text-[#1a28c2] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="/pricing"
              className="block py-2 sm:py-3 text-base sm:text-lg font-medium text-gray-700 hover:text-[#1a28c2] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/customer/schedule"
              className="block py-2 sm:py-3 text-base sm:text-lg font-medium text-gray-700 hover:text-[#1a28c2] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Schedule Pickup
            </Link>

            {isAuthenticated && customer ? (
              <>
                <div className="border-t border-gray-200/50 pt-3 mt-3 sm:pt-4 sm:mt-4">
                  <p className="py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-600">👤 {customerName}</p>
                  <p className="text-xs text-[#1a28c2] font-medium mb-3 sm:mb-4">
                    Wallet: {customer.wallet?.balance ? `${customer.wallet.currency} ${customer.wallet.balance.toFixed(3)}` : 'No wallet'}
                  </p>
                </div>
                <Link
                  href="/customer/dashboard"
                  className="block py-2 sm:py-3 text-base sm:text-lg font-medium text-[#1a28c2] hover:text-[#190dad] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/customer/dashboard?tab=orders"
                  className="block py-2 sm:py-3 text-base sm:text-lg font-medium text-[#1a28c2] hover:text-[#190dad] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Orders
                </Link>
                <Link
                  href="/customer/dashboard?tab=addresses"
                  className="block py-2 sm:py-3 text-base sm:text-lg font-medium text-[#1a28c2] hover:text-[#190dad] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Addresses
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 sm:py-3 text-base sm:text-lg font-medium text-red-600 hover:text-red-800 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="border-t border-gray-200/50 pt-3 mt-3 sm:pt-4 sm:mt-4">
                <Link
                  href="/registerlogin"
                  className="block py-2 sm:py-3 text-base sm:text-lg font-bold text-[#1a28c2] hover:text-[#190dad] transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </>
  );
};

export default Header;
