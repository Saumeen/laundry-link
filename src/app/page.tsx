"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MainLayout from "@/components/layouts/main-layout";

export default function Home() {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [showAllSlots, setShowAllSlots] = useState(false);
  
  // Time slots for today and tomorrow
  const timeSlots = {
    today: [
      { id: 1, label: "EARLIEST", time: "in the next 45min", available: true },
      { id: 2, label: "10:00 - 13:00", available: true },
      { id: 3, label: "13:00 - 16:00", available: false },
      { id: 4, label: "16:00 - 19:00", available: true },
      { id: 5, label: "LAST", time: "19:00 - 22:00", available: true }
    ],
    tomorrow: [
      { id: 6, label: "09:00 - 12:00", available: true },
      { id: 7, label: "12:00 - 15:00", available: true },
      { id: 8, label: "15:00 - 18:00", available: true },
      { id: 9, label: "18:00 - 21:00", available: true },
      { id: 10, label: "21:00 - 00:00", available: true }
    ]
  };

  const handleTimeSlotClick = (slotType) => {
    const now = new Date();
    let timeParam = "";
    
    if (slotType === "earliest") {
      // Calculate 45 minutes from now
      const earliestTime = new Date(now.getTime() + 45 * 60000);
      timeParam = `earliest=${earliestTime.toISOString()}`;
    } else if (slotType === "last") {
      // Set to today 8-10 PM
      timeParam = "last=20:00-22:00";
    }
    
    // Redirect to schedule page with time parameter
    window.location.href = `/schedule?${timeParam}`;
  };

  return (
    <MainLayout>
      {/* Hero Section with Quick Pickup Form */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Laundry & dry cleaning with 24h delivery
              </h1>
              <p className="text-xl mb-6">
                Free pickup and delivery service in Bahrain
              </p>
              {/* Review section removed as requested */}
            </div>

            {/* New Schedule Collection Box */}
            <div className="bg-white rounded-lg shadow-md p-6 text-gray-900">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
                Schedule your collection now!
              </h2>
              
              {/* Time Slot Selection */}
              <div className="space-y-4">
                {/* Earliest Slot */}
                <button
                  onClick={() => handleTimeSlotClick("earliest")}
                  className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-lg p-4 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 text-white rounded-full p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-lg text-blue-700">EARLIEST</div>
                        <div className="text-sm text-gray-600">in the next 45min</div>
                      </div>
                    </div>
                    <div className="text-blue-500 group-hover:text-blue-700">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Last Slot */}
                <button
                  onClick={() => handleTimeSlotClick("last")}
                  className="w-full bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-300 rounded-lg p-4 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-amber-500 text-white rounded-full p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-lg text-amber-700">LAST</div>
                        <div className="text-sm text-gray-600">20:00 - 22:00</div>
                      </div>
                    </div>
                    <div className="text-amber-500 group-hover:text-amber-700">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>

              {/* See All Slots Link */}
              <div className="mt-6 text-center">
                <Link 
                  href="/schedule"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-center space-x-1 hover:underline"
                >
                  <span>See all slots</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-amber-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Take back your time.</h2>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Leave the laundry to us.</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Book it & bag it</h3>
              <p className="text-gray-600">
                Pack your laundry and schedule a pick-up when it suits you.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Cleaned with care, locally</h3>
              <p className="text-gray-600">
                We collect your laundry & carefully clean it at our local facilities.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Free delivery, fresh results</h3>
              <p className="text-gray-600">
                Relax while we clean and deliver your items fresh to your doorstep.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center mt-8 space-x-6">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-700">Free collection and delivery</span>
            </div>
            
            <div className="flex items-center">
              <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Quick support</span>
            </div>
            
            <div className="flex items-center">
              <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-gray-700">Live order updates</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Explore our services</h2>
            <p className="mt-4 text-lg text-gray-600">
              Your clothes are treated with the utmost care, receiving the attention they deserve.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Wash & Iron</h3>
              </div>
              <p className="text-gray-600">
                Your everyday laundry, washed, dried, and ironed to perfection.
              </p>
              <div className="mt-4">
                <span className="text-blue-600 font-medium">From BD 0.600</span>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Dry Cleaning</h3>
              </div>
              <p className="text-gray-600">
                Professional dry cleaning for your delicate and special garments.
              </p>
              <div className="mt-4">
                <span className="text-blue-600 font-medium">From BD 2.500</span>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Express Service</h3>
              </div>
              <p className="text-gray-600">
                Need it fast? Our express service delivers within 24 hours.
              </p>
              <div className="mt-4">
                <span className="text-blue-600 font-medium">+50% surcharge</span>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Bedding & Linens</h3>
              </div>
              <p className="text-gray-600">
                Fresh, clean bedding and household linens with careful handling.
              </p>
              <div className="mt-4">
                <span className="text-blue-600 font-medium">From BD 3.000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

