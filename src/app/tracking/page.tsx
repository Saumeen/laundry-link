"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layouts/main-layout";
import Link from "next/link";

interface OrderItem {
  id: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
  notes?: string;
}

interface OrderServiceMapping {
  id: number;
  service: {
    id: number;
    name: string;
    displayName: string;
    description: string;
    price: number;
  };
  quantity: number;
  price: number;
  orderItems: OrderItem[];
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  invoiceTotal: number;
  pickupTime: string;
  deliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  specialInstructions?: string;
  paymentStatus: string;
  orderServiceMappings: OrderServiceMapping[];
  address?: {
    id: number;
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    area?: string;
    building?: string;
    floor?: string;
    apartment?: string;
    contactNumber?: string;
  };
}

interface TimelineEvent {
  status: string;
  time: string;
  completed: boolean;
}

export default function Tracking() {
  const [trackingId, setTrackingId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect logged-in users to their dashboard
  useEffect(() => {
    if (status === "loading") return;
    
    if (session?.userType === "customer") {
      router.push("/customer/dashboard?tab=orders");
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Don't render anything if user is logged in (they'll be redirected)
  if (session?.userType === "customer") {
    return null;
  }

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(`/api/tracking/${trackingId.trim()}`);
      
      if (response.ok) {
        const data = await response.json() as { order: Order };
        setOrder(data.order);
      } else {
        const errorData = await response.json() as { error?: string };
        setError(errorData.error || "Order not found");
      }
    } catch (error) {
      setError("Failed to fetch order details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusPercentage = (order: Order) => {
    const timeline = generateTimeline(order);
    const completedSteps = timeline.filter(step => step.completed).length;
    return (completedSteps / timeline.length) * 100;
  };

  const generateTimeline = (order: Order): TimelineEvent[] => {
    const timeline: TimelineEvent[] = [];
    const createdAt = new Date(order.createdAt);
    const updatedAt = new Date(order.updatedAt);

    // Order Placed
    timeline.push({
      status: "Order Placed",
      time: createdAt.toLocaleString(),
      completed: true
    });

    // Driver Assigned for Pickup
    if (order.status !== "ORDER_PLACED") {
      timeline.push({
        status: "Driver Assigned for Pickup",
        time: new Date(createdAt.getTime() + 15 * 60000).toLocaleString(),
        completed: true
      });
    }

    // Picked Up
    if (["PICKUP_COMPLETED", "RECEIVED_AT_FACILITY", "PROCESSING_STARTED", "PROCESSING_COMPLETED", "QUALITY_CHECK", "READY_FOR_DELIVERY", "DELIVERY_ASSIGNED", "DELIVERY_IN_PROGRESS", "DELIVERED"].includes(order.status)) {
      timeline.push({
        status: "Picked Up",
        time: new Date(createdAt.getTime() + 90 * 60000).toLocaleString(),
        completed: true
      });
    }

    // Processing
    if (["RECEIVED_AT_FACILITY", "PROCESSING_STARTED", "PROCESSING_COMPLETED", "QUALITY_CHECK", "READY_FOR_DELIVERY", "DELIVERY_ASSIGNED", "DELIVERY_IN_PROGRESS", "DELIVERED"].includes(order.status)) {
      timeline.push({
        status: "Processing",
        time: new Date(createdAt.getTime() + 3 * 3600000).toLocaleString(),
        completed: true
      });
    }

    // Processing Complete
    if (["PROCESSING_COMPLETED", "QUALITY_CHECK", "READY_FOR_DELIVERY", "DELIVERY_ASSIGNED", "DELIVERY_IN_PROGRESS", "DELIVERED"].includes(order.status)) {
      timeline.push({
        status: "Processing Complete",
        time: new Date(updatedAt.getTime() - 2 * 3600000).toLocaleString(),
        completed: true
      });
    }

    // Quality Check
    if (["QUALITY_CHECK", "READY_FOR_DELIVERY", "DELIVERY_ASSIGNED", "DELIVERY_IN_PROGRESS", "DELIVERED"].includes(order.status)) {
      timeline.push({
        status: "Quality Check",
        time: new Date(updatedAt.getTime() - 1.5 * 3600000).toLocaleString(),
        completed: true
      });
    }

    // Driver Assigned for Delivery
    if (["DELIVERY_ASSIGNED", "DELIVERY_IN_PROGRESS", "DELIVERED"].includes(order.status)) {
      timeline.push({
        status: "Driver Assigned for Delivery",
        time: new Date(updatedAt.getTime() - 1 * 3600000).toLocaleString(),
        completed: true
      });
    }

    // Out for Delivery
    if (order.status === "DELIVERY_IN_PROGRESS") {
      timeline.push({
        status: "Out for Delivery",
        time: new Date(updatedAt.getTime() - 30 * 60000).toLocaleString(),
        completed: true
      });
    }

    // Delivered
    if (order.status === "DELIVERED") {
      timeline.push({
        status: "Delivered",
        time: updatedAt.toLocaleString(),
        completed: true
      });
    } else {
      timeline.push({
        status: "Delivered",
        time: `Estimated: ${new Date(createdAt.getTime() + 48 * 3600000).toLocaleString()}`,
        completed: false
      });
    }

    return timeline;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
        {!order ? (
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
                  disabled={loading}
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Tracking..." : "Track Order"}
              </button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-gray-600">Have an account?</p>
              <Link href="/registerlogin" className="text-blue-600 hover:text-blue-800 font-medium">
                Log in to view all your orders
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Order #{order.orderNumber}</h2>
                  <p className="text-gray-600">Customer: {order.customerFirstName} {order.customerLastName}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {order.status}
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
                      {Math.round(getStatusPercentage(order))}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    style={{ width: `${getStatusPercentage(order)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                  ></div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pickup Date</p>
                  <p className="font-medium">{formatDate(order.pickupTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pickup Time</p>
                  <p className="font-medium">{formatTime(order.pickupTime)}</p>
                </div>
                {order.deliveryTime && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Delivery Date</p>
                      <p className="font-medium">{formatDate(order.deliveryTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Delivery Time</p>
                      <p className="font-medium">{formatTime(order.deliveryTime)}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Date</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  <p className="font-medium">{order.paymentStatus}</p>
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
                  {order.orderServiceMappings.map((mapping, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {mapping.service.displayName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mapping.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {mapping.price.toFixed(3)} BD
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-right">
                      {order.invoiceTotal.toFixed(3)} BD
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
                  {generateTimeline(order).map((event, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== generateTimeline(order).length - 1 ? (
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
                onClick={() => {
                  setOrder(null);
                  setError("");
                  setTrackingId("");
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Track Another Order
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
