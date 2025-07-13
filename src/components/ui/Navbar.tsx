"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "next-auth/react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const {isAuthenticated,customer }= useAuth()




  // Handle logout
  const handleLogout = () => {  
    signOut();
  
    // Redirect to home
    router.push('/');
  };

  const customerName = customer ? `${customer.firstName} ${customer.lastName}` : '';

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <Image 
                src="/images/toplogo.png" 
                alt="Laundry Link Logo" 
                width={130} 
                height={35} 
                className="object-contain"
                priority
                unoptimized
              />
            </Link>

            <div className="hidden sm:flex space-x-6">
              <Link href="/" className="text-gray-500 hover:text-blue-700">Home</Link>
              <Link href="/pricing" className="text-gray-500 hover:text-blue-700">Pricing</Link>
              <Link href="/services" className="text-gray-500 hover:text-blue-700">Services</Link>
              <Link href="/schedule" className="text-gray-500 hover:text-blue-700">Schedule Pickup</Link>
              <Link href="/tracking" className="text-gray-500 hover:text-blue-700">Track Order</Link>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-4">
            {isAuthenticated && customer ? (
              // Logged in - Show My Account dropdown
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-700"
                >
                  <span>👤 {customerName}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <p className="font-medium text-gray-900">{customerName}</p>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                      <p className="text-sm text-blue-600 font-medium">
                        Wallet: {customer.walletBalance?.toFixed(3) || '0.000'} BD
                      </p>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href="/customer/dashboard"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                          </svg>
                          Dashboard
                        </div>
                      </Link>
                      
                      <Link
                        href="/customer/dashboard?tab=orders"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          My Orders
                        </div>
                      </Link>
                      
                      <Link
                        href="/customer/dashboard?tab=addresses"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Addresses
                        </div>
                      </Link>
                      
                      <Link
                        href="/schedule"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          New Order
                        </div>
                      </Link>
                    </div>
                    
                    <div className="border-t py-2">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Not logged in - Show Login/Register buttons
              <>
                <Link href="/registerlogin" className="text-gray-500 hover:text-blue-700">Login</Link>
                <Link href="/registerlogin" className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">Register</Link>
              </>
            )}
          </div>

          <div className="sm:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden px-4 pb-4">
          <Link href="/" className="block py-2 text-gray-700 hover:text-blue-700" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link href="/pricing" className="block py-2 text-gray-700 hover:text-blue-700" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
          <Link href="/services" className="block py-2 text-gray-700 hover:text-blue-700" onClick={() => setIsMenuOpen(false)}>Services</Link>
          <Link href="/schedule" className="block py-2 text-gray-700 hover:text-blue-700" onClick={() => setIsMenuOpen(false)}>Schedule Pickup</Link>
          <Link href="/tracking" className="block py-2 text-gray-700 hover:text-blue-700" onClick={() => setIsMenuOpen(false)}>Track Order</Link>

          {isAuthenticated && customer ? (
            <>
              <div className="border-t pt-2 mt-2">
                <p className="py-2 text-sm text-gray-600">👤 {customerName}</p>
                <p className="text-xs text-blue-600 mb-2">Wallet: {customer.walletBalance?.toFixed(3) || '0.000'} BD</p>
              </div>
              <Link href="/customer/dashboard" className="block py-2 text-green-700 hover:text-green-900" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link href="/customer/dashboard?tab=orders" className="block py-2 text-green-700 hover:text-green-900" onClick={() => setIsMenuOpen(false)}>My Orders</Link>
              <Link href="/customer/dashboard?tab=addresses" className="block py-2 text-green-700 hover:text-green-900" onClick={() => setIsMenuOpen(false)}>Addresses</Link>
              <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600 hover:text-red-800">Logout</button>
            </>
          ) : (
            <>
              <div className="border-t pt-2 mt-2">
                <Link href="/registerlogin" className="block py-2 text-gray-700 hover:text-blue-700" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link href="/registerlogin" className="block py-2 text-blue-700 hover:text-blue-900" onClick={() => setIsMenuOpen(false)}>Register</Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </nav>
  );
}

