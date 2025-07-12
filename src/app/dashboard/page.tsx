"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching orders from API
    setTimeout(() => {
      setOrders([
        {
          id: 'ORD-12345',
          date: '2025-04-22',
          status: 'Delivered',
          items: 'Wash and Iron (5 items)',
          amount: 'BD 3.500',
          trackingSteps: [
            { name: 'Order Placed', completed: true, time: '2025-04-22 09:15' },
            { name: 'Picked Up', completed: true, time: '2025-04-22 11:30' },
            { name: 'Processing', completed: true, time: '2025-04-22 14:45' },
            { name: 'Ready for Delivery', completed: true, time: '2025-04-23 10:20' },
            { name: 'Out for Delivery', completed: true, time: '2025-04-23 13:10' },
            { name: 'Delivered', completed: true, time: '2025-04-23 15:35' }
          ]
        },
        {
          id: 'ORD-12344',
          date: '2025-04-18',
          status: 'Delivered',
          items: 'Dry Clean (3 items)',
          amount: 'BD 4.200',
          trackingSteps: [
            { name: 'Order Placed', completed: true, time: '2025-04-18 14:22' },
            { name: 'Picked Up', completed: true, time: '2025-04-18 16:45' },
            { name: 'Processing', completed: true, time: '2025-04-19 09:30' },
            { name: 'Ready for Delivery', completed: true, time: '2025-04-19 15:15' },
            { name: 'Out for Delivery', completed: true, time: '2025-04-19 17:20' },
            { name: 'Delivered', completed: true, time: '2025-04-19 19:05' }
          ]
        },
        {
          id: 'ORD-12343',
          date: '2025-04-15',
          status: 'Delivered',
          items: 'Wash and Fold (4 kg)',
          amount: 'BD 4.000',
          trackingSteps: [
            { name: 'Order Placed', completed: true, time: '2025-04-15 10:10' },
            { name: 'Picked Up', completed: true, time: '2025-04-15 12:30' },
            { name: 'Processing', completed: true, time: '2025-04-15 15:45' },
            { name: 'Ready for Delivery', completed: true, time: '2025-04-16 11:20' },
            { name: 'Out for Delivery', completed: true, time: '2025-04-16 14:10' },
            { name: 'Delivered', completed: true, time: '2025-04-16 16:35' }
          ]
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const renderOrdersList = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {orders.map((order) => (
          <li key={order.id}>
            <button
              onClick={() => handleOrderClick(order)}
              className="block hover:bg-gray-50 w-full text-left"
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-600 truncate">
                    {order.id}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                      order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {order.items}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      {order.date}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    Amount: <span className="font-medium ml-1">{order.amount}</span>
                  </p>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Order Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {selectedOrder.id}
            </p>
          </div>
          <button
            onClick={() => setSelectedOrder(null)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Back to Orders
          </button>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Order Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {selectedOrder.date}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Status
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                  selectedOrder.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedOrder.status}
                </span>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Items
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {selectedOrder.items}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Amount
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {selectedOrder.amount}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 mb-4">
                Tracking Timeline
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {selectedOrder.trackingSteps.map((step, stepIdx) => (
                      <li key={step.name}>
                        <div className="relative pb-8">
                          {stepIdx !== selectedOrder.trackingSteps.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                step.completed ? 'bg-blue-500' : 'bg-gray-300'
                              }`}>
                                {step.completed ? (
                                  <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <span className="h-5 w-5 text-white" />
                                )}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className={`text-sm font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {step.name}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {step.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  };

  const renderBillingHistory = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Billing History
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Your recent payments and invoices
        </p>
      </div>
      <div className="border-t border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={`invoice-${order.id}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  INV-{order.id.split('-')[1]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Paid
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Profile Information
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Your personal details and preferences
        </p>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Full name
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              Ahmed Al Bahraini
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Phone number
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              +973 33440841
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Address
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              Juffair 341, Road 4101, Building 20, Apartment 15
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Notification preferences
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex items-center">
                <input
                  id="sms-notifications"
                  name="sms-notifications"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
                <label htmlFor="sms-notifications" className="ml-2 block text-sm text-gray-900">
                  SMS notifications
                </label>
              </div>
              <div className="flex items-center mt-2">
                <input
                  id="email-notifications"
                  name="email-notifications"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
                <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900">
                  Email notifications
                </label>
              </div>
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:px-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Profile
            </button>
          </div>
        </dl>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Image 
                              src="/images/toplogo.png" 
              alt="Laundry Link Logo" 
              width={50} 
              height={50} 
            />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">
              Customer Dashboard
            </h1>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
            Back to Home
          </Link>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`${
                    activeTab === 'orders'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  My Orders
                </button>
                <button
                  onClick={() => setActiveTab('billing')}
                  className={`${
                    activeTab === 'billing'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Billing History
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Profile
                </button>
              </nav>
            </div>

            <div className="mt-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-lg text-gray-500">Loading...</span>
                </div>
              ) : (
                <>
                  {activeTab === 'orders' && (
                    selectedOrder ? renderOrderDetails() : renderOrdersList()
                  )}
                  {activeTab === 'billing' && renderBillingHistory()}
                  {activeTab === 'profile' && renderProfile()}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
