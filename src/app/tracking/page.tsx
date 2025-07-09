"use client";

import { useState } from "react";
import MainLayout from "@/components/layouts/main-layout";
import Link from "next/link";

export default function Tracking() {
  const [trackingId, setTrackingId] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  
  // Mock order data for demonstration
  const mockOrder = {
    id: "ORD12345",
    status: "out_for_delivery",
    customer: "John Doe",
    pickupDate: "April 22, 2025",
    pickupTime: "10:00 AM - 12:00 PM",
    deliveryDate: "April 24, 2025",
    deliveryTime: "2:00 PM - 4:00 PM",
    items: [
      { service: "Wash & Fold", quantity: "5 lbs", price: "$12.50" },
      { service: "Dry Cleaning", quantity: "2 items", price: "$12.00" }
    ],
    total: "$24.50",
    driver: {
      name: "Michael Rodriguez",
      vehicle: "White Van",
      licensePlate: "LDY-4321",
      eta: "15 minutes"
    },
    timeline: [
      { status: "Order Placed", time: "April 22, 10:15 AM", completed: true },
      { status: "Driver Assigned for Pickup", time: "April 22, 10:30 AM", completed: true },
      { status: "Picked Up", time: "April 22, 11:45 AM", completed: true },
      { status: "Processing", time: "April 22, 2:00 PM", completed: true },
      { status: "Cleaning Complete", time: "April 23, 3:30 PM", completed: true },
      { status: "Quality Check", time: "April 23, 4:15 PM", completed: true },
      { status: "Driver Assigned for Delivery", time: "April 24, 1:30 PM", completed: true },
      { status: "Out for Delivery", time: "April 24, 2:15 PM", completed: true },
      { status: "Delivered", time: "Estimated: April 24, 3:15 PM", completed: false }
    ]
  };

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      setIsTracking(true);
    }
  };

  const getStatusPercentage = () => {
    const completedSteps = mockOrder.timeline.filter(step => step.completed).length;
    return (completedSteps / mockOrder.timeline.length) * 100;
  };

  return (
    <MainLayout>
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center">Track Your Order</h1>
          <p className="mt-4 text-xl text-blue-100 text-center max-w-3xl mx-auto">
            Follow the status of your laundry in real-time
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isTracking ? (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Enter Your Order ID</h2>
            <form onSubmit={handleTrack}>
              <div className="mb-6">
                <label htmlFor="tracking-id" className="block text-sm font-medium text-gray-700 mb-2">
                  Order ID
                </label>
                <input
                  type="text"
                  id="tracking-id"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., ORD12345"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Track Order
              </button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-gray-600">Don't have an order ID?</p>
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Log in to view your orders
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Order #{mockOrder.id}</h2>
                  <p className="text-gray-600">Customer: {mockOrder.customer}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {mockOrder.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Progress</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      In Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {Math.round(getStatusPercentage())}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${getStatusPercentage()}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                  ></div>
                </div>
              </div>
            </div>

            {/* Current Status */}
            {mockOrder.status === "out_for_delivery" && (
              <div className="p-6 border-b border-gray-200 bg-blue-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Driver</p>
                    <p className="font-medium">{mockOrder.driver.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vehicle</p>
                    <p className="font-medium">{mockOrder.driver.vehicle} ({mockOrder.driver.licensePlate})</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Arrival</p>
                    <p className="font-medium text-blue-600">{mockOrder.driver.eta}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Delivery Window</p>
                    <p className="font-medium">{mockOrder.deliveryTime}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-3 mr-4">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Driver Location</p>
                        <p className="font-medium">Currently 2.3 miles away</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pickup Date</p>
                  <p className="font-medium">{mockOrder.pickupDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pickup Time</p>
                  <p className="font-medium">{mockOrder.pickupTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Delivery Date</p>
                  <p className="font-medium">{mockOrder.deliveryDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Delivery Time</p>
                  <p className="font-medium">{mockOrder.deliveryTime}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.price}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-right">
                      {mockOrder.total}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Timeline */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Timeline</h3>
              <div className="flow-root">
                <ul className="-mb-8">
                  {mockOrder.timeline.map((event, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== mockOrder.timeline.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${event.completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                              {event.completed ? (
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className={`text-sm font-medium ${event.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                                {event.status}
                              </p>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <time>{event.time}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 flex justify-between">
              <button
                onClick={() => setIsTracking(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Tracking
              </button>
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Need Help?
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
