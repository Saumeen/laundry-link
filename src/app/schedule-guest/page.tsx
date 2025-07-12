"use client";

import { useState, useEffect, Suspense } from "react";
import MainLayout from "@/components/layouts/main-layout";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useServices, Service } from "@/hooks/useServices";

interface FormData {
  // Step 1: Location
  locationType: string;
  hotelName: string;
  roomNumber: string;
  collectionMethod: string;
  house: string;
  road: string;
  block: string;
  homeCollectionMethod: string;
  building: string;
  flatNumber: string;
  officeNumber: string;
  contactNumber: string;
  
  // Step 2: Time
  pickupDate: string;
  pickupTime: string;
  
  // Step 3: Services
  services: string[];
  
  // Step 4: Customer Details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialInstructions: string;
}

function GuestScheduleContent() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { services, loading: servicesLoading } = useServices();
  
  const [formData, setFormData] = useState<FormData>({
    // Step 1: Location
    locationType: "",
    hotelName: "",
    roomNumber: "",
    collectionMethod: "",
    house: "",
    road: "",
    block: "",
    homeCollectionMethod: "",
    building: "",
    flatNumber: "",
    officeNumber: "",
    contactNumber: "",
    
    // Step 2: Time
    pickupDate: "",
    pickupTime: "",
    
    // Step 3: Services
    services: [],
    
    // Step 4: Customer Details
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialInstructions: "",
  });

  // Pre-fill time from main page if available
  useEffect(() => {
    const selectedTime = searchParams.get('time');
    if (selectedTime) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      let timeValue = "";
      if (selectedTime === 'earliest') {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 45);
        timeValue = now.toTimeString().slice(0, 5);
      } else if (selectedTime === 'last') {
        timeValue = "20:00";
      }
      
      setFormData(prev => ({
        ...prev,
        pickupDate: tomorrow.toISOString().split('T')[0],
        pickupTime: timeValue
      }));
    }
  }, [searchParams]);

  const locationTypes = [
    { id: "hotel", name: "Hotel", icon: "🏨" },
    { id: "home", name: "Home", icon: "🏠" },
    { id: "flat", name: "Flat/Apartment", icon: "🏢" },
    { id: "office", name: "Office", icon: "🏢" },
  ];

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30", "22:00"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((id: string) => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.locationType) return "Please select a location type";
        if (!formData.contactNumber.trim()) return "Contact number is required";
        
        if (formData.locationType === "hotel") {
          if (!formData.hotelName.trim() || !formData.roomNumber.trim()) {
            return "Hotel name and room number are required";
          }
        } else if (formData.locationType === "home") {
          if (!formData.house.trim() || !formData.road.trim()) {
            return "House and road are required";
          }
        } else if (formData.locationType === "flat") {
          if (!formData.building.trim() || !formData.road.trim()) {
            return "Building and road are required";
          }
        } else if (formData.locationType === "office") {
          if (!formData.building.trim() || !formData.road.trim()) {
            return "Building and road are required";
          }
        }
        break;
        
      case 2:
        if (!formData.pickupDate) return "Pickup date is required";
        if (!formData.pickupTime) return "Pickup time is required";
        break;
        
      case 3:
        if (formData.services.length === 0) return "Please select at least one service";
        break;
        
      case 4:
        if (!formData.firstName.trim()) return "First name is required";
        if (!formData.lastName.trim()) return "Last name is required";
        if (!formData.email.trim()) return "Email is required";
        if (!formData.phone.trim()) return "Phone number is required";
        break;
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      alert(error);
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    const error = validateStep(4);
    if (error) {
      alert(error);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const orderData = {
        // Customer info
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        
        // Location info
        locationType: formData.locationType,
        hotelName: formData.hotelName,
        roomNumber: formData.roomNumber,
        collectionMethod: formData.collectionMethod,
        house: formData.house,
        road: formData.road,
        block: formData.block,
        homeCollectionMethod: formData.homeCollectionMethod,
        building: formData.building,
        flatNumber: formData.flatNumber,
        officeNumber: formData.officeNumber,
        contactNumber: formData.contactNumber,
        
        // Time info
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        
        // Services
        services: formData.services,
        
        // Special instructions
        specialInstructions: formData.specialInstructions,
        
        // Flag to indicate this is from a guest customer
        isLoggedInCustomer: false,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json() as { orderNumber?: string; error?: string };

      if (response.ok) {
        // Redirect to success page
        window.location.href = `/order-success?orderNumber=${result.orderNumber}&email=${encodeURIComponent(formData.email)}`;
      } else {
        setSubmitError(result.error || "Failed to submit order");
      }
    } catch (error) {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 1: Choose Location</h2>
            
            {/* Location Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select your location type:
              </label>
              <div className="grid grid-cols-2 gap-4">
                {locationTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, locationType: type.id }))}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.locationType === type.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Location-specific fields */}
            {formData.locationType === "hotel" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name *</label>
                    <input
                      type="text"
                      name="hotelName"
                      value={formData.hotelName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Hotel name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Room number"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.locationType === "home" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">House *</label>
                    <input
                      type="text"
                      name="house"
                      value={formData.house}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="House number/name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Road *</label>
                    <input
                      type="text"
                      name="road"
                      value={formData.road}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Road name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block (Optional)</label>
                    <input
                      type="text"
                      name="block"
                      value={formData.block}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Block number"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.locationType === "flat" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Building *</label>
                    <input
                      type="text"
                      name="building"
                      value={formData.building}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Building name/number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Road *</label>
                    <input
                      type="text"
                      name="road"
                      value={formData.road}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Road name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block (Optional)</label>
                    <input
                      type="text"
                      name="block"
                      value={formData.block}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Block number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Flat Number</label>
                    <input
                      type="text"
                      name="flatNumber"
                      value={formData.flatNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Flat number"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.locationType === "office" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Building *</label>
                    <input
                      type="text"
                      name="building"
                      value={formData.building}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Building name/number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Road *</label>
                    <input
                      type="text"
                      name="road"
                      value={formData.road}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Road name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block (Optional)</label>
                    <input
                      type="text"
                      name="block"
                      value={formData.block}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Block number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office Number</label>
                    <input
                      type="text"
                      name="officeNumber"
                      value={formData.officeNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Office number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Number */}
            {formData.locationType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact number for this address"
                />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 2: Choose Pickup Time</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time *</label>
                <select
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 3: Choose Services</h2>
            
            {servicesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading services...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.services.includes(service.name)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300"
                    }`}
                    onClick={() => handleServiceToggle(service.name)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{service.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{service.displayName}</h3>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        <p className="text-sm text-blue-600 mt-1 font-medium">
                          Pricing: {service.pricingType === 'BY_WEIGHT' ? 'By Weight' : 'By Piece'} ({service.pricingUnit})
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service.name)}
                          onChange={() => handleServiceToggle(service.name)}
                          className="w-5 h-5 text-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 4: Your Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions (Optional)
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions for pickup or delivery..."
              />
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {submitError}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
              )}
              {currentStep === 1 && (
                <Link
                  href="/"
                  className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700 transition-colors inline-block"
                >
                  Back to Home
                </Link>
              )}
            </div>
            
            <div>
              {currentStep < 4 && (
                <button
                  onClick={handleNext}
                  className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              )}
              {currentStep === 4 && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 text-white py-2 px-8 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Order"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuestSchedulePage() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <GuestScheduleContent />
      </Suspense>
    </MainLayout>
  );
}

