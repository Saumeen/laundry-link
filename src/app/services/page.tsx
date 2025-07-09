"use client";

import { useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layouts/main-layout";

export default function Services() {
  const [activeTab, setActiveTab] = useState("all");
  
  const services = [
    {
      id: 1,
      name: "Wash & Fold",
      category: "regular",
      description: "Our standard laundry service includes washing, drying, and folding your clothes with premium detergents and fabric softeners.",
      price: "BD 1.000",
      unit: "per kg",
      turnaround: "24 hours",
      features: [
        "Sorted by color and fabric type",
        "Washed at appropriate temperatures",
        "Folded and packaged neatly",
        "Stain treatment included"
      ]
    },
    {
      id: 2,
      name: "Dry Cleaning",
      category: "premium",
      description: "Professional dry cleaning service for delicate garments, suits, dresses, and other items that require special care.",
      price: "BD 0.900",
      unit: "per item",
      turnaround: "48 hours",
      features: [
        "Gentle cleaning process",
        "Preserves fabric quality",
        "Pressed and hung",
        "Individually packaged"
      ]
    },
    {
      id: 3,
      name: "Ironing",
      category: "regular",
      description: "Professional ironing service to keep your clothes looking crisp and wrinkle-free.",
      price: "BD 0.300",
      unit: "per item",
      turnaround: "24 hours",
      features: [
        "Pressed to perfection",
        "Hung on hangers",
        "Attention to detail",
        "Folded upon request"
      ]
    },
    {
      id: 4,
      name: "Express Service",
      category: "premium",
      description: "Same-day turnaround for urgent laundry needs. Perfect for last-minute events or emergencies.",
      price: "BD 1.500",
      unit: "per kg",
      turnaround: "8 hours",
      features: [
        "Priority processing",
        "Same-day service",
        "Available 7 days a week",
        "Pickup and delivery included"
      ]
    },
    {
      id: 5,
      name: "Bedding & Linens",
      category: "regular",
      description: "Specialized cleaning for bedsheets, duvet covers, pillowcases, towels, and other household linens.",
      price: "BD 1.350",
      unit: "per item",
      turnaround: "24 hours",
      features: [
        "Deep cleaning",
        "Sanitizing wash",
        "Proper folding",
        "Fresh scent"
      ]
    },
    {
      id: 6,
      name: "Stain Removal",
      category: "premium",
      description: "Expert stain removal service for tough stains on clothing, linens, and other fabrics.",
      price: "BD 2.000",
      unit: "per item",
      turnaround: "48 hours",
      features: [
        "Pre-treatment process",
        "Specialized solutions",
        "Gentle on fabrics",
        "Multiple stain types"
      ]
    }
  ];

  const filteredServices = activeTab === "all" 
    ? services 
    : services.filter(service => service.category === activeTab);

  return (
    <MainLayout>
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center">Our Services</h1>
          <p className="mt-4 text-xl text-blue-100 text-center max-w-3xl mx-auto">
            Professional laundry and dry cleaning services with convenient pickup and delivery
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Service Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                activeTab === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("all")}
            >
              All Services
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "regular"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("regular")}
            >
              Regular Services
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                activeTab === "premium"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("premium")}
            >
              Premium Services
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <div className="flex items-center mb-4">
                  <span className="text-blue-600 font-bold text-xl">
                    {service.price}
                  </span>
                  <span className="text-gray-500 ml-1">
                    {service.unit}
                  </span>
                  <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {service.turnaround}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">
                  {service.description}
                </p>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Includes:</h4>
                  <ul className="space-y-1">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <Link
                    href="/schedule"
                    className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                  >
                    Schedule Pickup
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How Our Service Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              We've simplified the laundry process to make it as convenient as possible for you
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Schedule</h3>
              <p className="text-gray-600">
                Choose a convenient pickup time through our easy scheduling system
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Pickup</h3>
              <p className="text-gray-600">
                Our driver arrives at your location to collect your laundry
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Processing</h3>
              <p className="text-gray-600">
                Your clothes are cleaned according to your selected service
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl font-bold">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Delivery</h3>
              <p className="text-gray-600">
                Clean clothes are delivered back to your doorstep
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Link
              href="/schedule"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Schedule Your Pickup Now
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <p className="mt-4 text-xl text-gray-600">
            Find answers to common questions about our services
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">How do I pay for the service?</h3>
            <p className="text-gray-600">
              Customer will receive an invoice of their laundry after sorting in laundry and a payment link will be shared to pay for the laundry.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">What if I'm not home during pickup or delivery?</h3>
            <p className="text-gray-600">
              You can leave special instructions for our drivers. Many customers leave their laundry in a designated spot and request contactless delivery.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">How is pricing calculated?</h3>
            <p className="text-gray-600">
              For wash and fold it's as per KG with a minimum of 3 KG per wash, and for other services it's by item.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">What areas do you service?</h3>
            <p className="text-gray-600">
              We serve all Bahrain excluding Durra Albahrain, Zallaq, Areen, Jaw, and Askar.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">How do I track my order?</h3>
            <p className="text-gray-600">
              You can track your order in real-time through our website. You'll receive notifications at each stage of the process, including driver location during pickup and delivery.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">What detergents do you use?</h3>
            <p className="text-gray-600">
              We use high-quality, eco-friendly detergents. If you have specific preferences or allergies, you can note this in your order and we'll accommodate your needs.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
