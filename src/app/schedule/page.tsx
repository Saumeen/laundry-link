"use client";

import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import MainLayout from "@/components/layouts/main-layout";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useServices } from "@/hooks/useServices";
import { useSession } from "next-auth/react";

import PhoneInput from "@/components/PhoneInput";
import AddressSelector from "@/components/AddressSelector";


// Type definitions
interface Address {
  id: string | number;
  label: string;
  address?: string;
  addressLine1?: string;
  contactNumber?: string;
  isDefault?: boolean;
  locationType?: string;
  hotelName?: string;
  roomNumber?: string;
  collectionMethod?: string;
  house?: string;
  road?: string;
  block?: string;
  homeCollectionMethod?: string;
  building?: string;
  flatNumber?: string;
  officeNumber?: string;
}

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Service {
  id: string | number;
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  pricingType: string;
  pricingUnit: string;
}

interface ApiAddressesResponse {
  addresses: Address[];
}

interface ApiOrderResponse {
  orderNumber: string;
  error?: string;
}

// Add FormData type
interface FormData {
  selectedAddressId: string;
  firstName: string;
  lastName: string;
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
  email: string;
  addressLabel: string;
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
  services: string[];
  specialInstructions: string;
}

function ScheduleContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  // Explicitly type services as Service[]
  const { services, loading: servicesLoading } = useServices() as { services: Service[]; loading: boolean };
  

  
  // Guest customer flow state (original 4-page flow)
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  const [formData, setFormData] = useState<FormData>({
    selectedAddressId: "",
    
    // Guest customer: Address collection (Page 1)
    firstName: "",
    lastName: "",
    locationType: "",
    // Hotel fields
    hotelName: "",
    roomNumber: "",
    collectionMethod: "", // reception, concierge, direct
    // Home fields
    house: "",
    road: "",
    block: "",
    homeCollectionMethod: "", // direct, outside
    // Flat fields
    building: "",
    flatNumber: "",
    // Office fields
    officeNumber: "",
    contactNumber: "",
    email: "",
    
    // New address fields for logged-in customers
    addressLabel: "",
    
    // Page 2: Time Selection
    pickupDate: "",
    pickupTime: "",
    deliveryDate: "",
    deliveryTime: "",
    
    // Page 3: Service Selection + Special Instructions
    services: [],
    specialInstructions: "",
  });

  // Add validation state
  const [timeValidationError, setTimeValidationError] = useState("");

  // Type guard for custom session.user fields
  function isCustomUser(user: any): user is { firstName: string; lastName: string; phone: string; email: string } {
    return (
      typeof user?.firstName === "string" &&
      typeof user?.lastName === "string" &&
      typeof user?.phone === "string" &&
      typeof user?.email === "string"
    );
  }

  // Replace login detection with NextAuth session
  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }
    if (session && session.user) {
      // Use type guard and fallback values
      let firstName = "";
      let lastName = "";
      let phone = "";
      let email = "";
      if (isCustomUser(session.user)) {
        firstName = session.user.firstName;
        lastName = session.user.lastName;
        phone = session.user.phone;
        email = session.user.email;
      } else {
        // fallback to name/email if not extended
        firstName = session.user.name ?? "";
        lastName = "";
        phone = "";
        email = session.user.email ?? "";
      }
      setIsLoggedIn(true);
      setCustomerData({
        firstName,
        lastName,
        email,
        phone,
      });
      setShowLoginPrompt(false);
      fetchCustomerAddresses();
      setIsLoading(false);
    } else {
      setIsLoggedIn(false);
      setCustomerData(null);
      setShowLoginPrompt(true);
      setIsLoading(false);
    }
  }, [session, status]);

  // Fetch customer addresses for logged-in users
  const fetchCustomerAddresses = useCallback(async () => {
    try {
      const response = await fetch('/api/customer/addresses');
      const result: ApiAddressesResponse = await response.json();
      if (response.ok) {
        setAddresses(result.addresses || []);
        // Auto-select default address if available
        const defaultAddress = result.addresses?.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setFormData(prev => ({ ...prev, selectedAddressId: defaultAddress.id.toString() }));
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  }, []);

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
        pickupTime: timeValue,
        deliveryDate: tomorrow.toISOString().split('T')[0],
        deliveryTime: timeValue
      }));
    }
  }, [searchParams]);

  const locationTypes = [
    { id: "hotel", name: "Hotel", icon: "🏨" },
    { id: "home", name: "Home", icon: "🏠" },
    { id: "flat", name: "Flat/Apartment", icon: "🏢" },
    { id: "office", name: "Office", icon: "🏢" }
  ];



  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  // Fix all event handler types
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user makes changes
    if (timeValidationError) {
      setTimeValidationError("");
    }
  }, [timeValidationError]);

  // Add time validation function
  const validateTimeSelection = useCallback(() => {
    if (!formData.pickupDate || !formData.pickupTime || !formData.deliveryDate || !formData.deliveryTime) {
      return true; // Allow empty values during input
    }

    const pickupDateTime = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
    const deliveryDateTime = new Date(`${formData.deliveryDate}T${formData.deliveryTime}`);

    // Check if delivery date is before pickup date
    if (formData.deliveryDate < formData.pickupDate) {
      setTimeValidationError("Delivery date cannot be before pickup date");
      return false;
    }

    // Check if delivery time is before or equal to pickup time on the same date
    if (deliveryDateTime <= pickupDateTime) {
      setTimeValidationError("Delivery time must be after pickup time");
      return false;
    }

    // Check minimum time gap (2 hours)
    const timeDiffInHours = (deliveryDateTime.getTime() - pickupDateTime.getTime()) / (1000 * 60 * 60);
    if (timeDiffInHours < 2) {
      setTimeValidationError("Delivery must be at least 2 hours after pickup");
      return false;
    }

    setTimeValidationError("");
    return true;
  }, [formData.pickupDate, formData.pickupTime, formData.deliveryDate, formData.deliveryTime]);

  // Validate time selection when dates or times change
  useEffect(() => {
    if (formData.pickupDate && formData.pickupTime && formData.deliveryDate && formData.deliveryTime) {
      validateTimeSelection();
    }
  }, [formData.pickupDate, formData.pickupTime, formData.deliveryDate, formData.deliveryTime, validateTimeSelection]);

  // Fix handleServiceToggle to use service IDs
  const handleServiceToggle = useCallback((serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((id: string) => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  }, []);

  // Guest customer navigation
  const handleNext = useCallback(() => {
    // Validate time selection when moving from step 2 to step 3
    if (step === 2) {
      if (!validateTimeSelection()) {
        return; // Don't proceed if validation fails
      }
    }
    
    if (step < 4) {
      setStep(step + 1);
    }
  }, [step, validateTimeSelection]);

  const handlePrevious = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  // Handle address selection
  const handleAddressSelect = useCallback((addressId: string) => {
    setFormData(prev => ({ ...prev, selectedAddressId: addressId }));
  }, []);

  // Get selected address for display
  const selectedAddress = useMemo(() => 
    addresses.find(addr => addr.id.toString() === formData.selectedAddressId),
    [addresses, formData.selectedAddressId]
  );

  // Handle address creation from AddressSelector
  const handleAddressCreate = useCallback((newAddress: Address) => {
    // Select the newly created address
    setFormData(prev => ({ ...prev, selectedAddressId: newAddress.id.toString() }));
    // Refresh addresses list
    fetchCustomerAddresses();
  }, [fetchCustomerAddresses]);



  // Submit order for logged-in customers
  const handleLoggedInSubmit = useCallback(async () => {
    if (!formData.selectedAddressId) {
      alert("Please select an address");
      return;
    }
    if (!formData.pickupDate || !formData.pickupTime) {
      alert("Please select pickup date and time");
      return;
    }
    if (!formData.deliveryDate || !formData.deliveryTime) {
      alert("Please select delivery date and time");
      return;
    }
    if (formData.services.length === 0) {
      alert("Please select at least one service");
      return;
    }

    // Validate time selection before submission
    if (!validateTimeSelection()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const selectedAddress = addresses.find(addr => addr.id.toString() === formData.selectedAddressId);
      const orderData = {
        // Customer info (auto-filled from logged-in user)
        firstName: customerData?.firstName,
        lastName: customerData?.lastName,
        email: customerData?.email,
        phone: customerData?.phone,
        
        // Address info
        addressId: formData.selectedAddressId,
        locationType: selectedAddress?.locationType || "",
        contactNumber: selectedAddress?.contactNumber || customerData?.phone,
        
        // Time info
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        deliveryDate: formData.deliveryDate,
        deliveryTime: formData.deliveryTime,
        
        // Services
        services: formData.services,
        
        // Special instructions
        specialInstructions: formData.specialInstructions,
        
        // Flag to indicate this is from a logged-in customer
        isLoggedInCustomer: true,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result: ApiOrderResponse = await response.json();

      if (response.ok) {
        // Redirect to success page
        window.location.href = `/order-success/${result.orderNumber}`;
      } else {
        setSubmitError(result.error || "Failed to submit order");
      }
    } catch (error) {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, customerData, addresses, validateTimeSelection]);

  // Submit order for guest customers (original flow)
  const handleGuestSubmit = useCallback(async () => {
    // Validate time selection before submission
    if (!validateTimeSelection()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const orderData = {
        // Customer info (use contactNumber as phone)
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.contactNumber, // Use contactNumber from Step 1
        
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
        deliveryDate: formData.deliveryDate,
        deliveryTime: formData.deliveryTime,
        
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

      const result: ApiOrderResponse = await response.json();

      if (response.ok) {
        // Redirect to success page
        window.location.href = `/order-success/${result.orderNumber}`;
      } else {
        if (result.error === "Customer already exists") {
          alert("An account with this email already exists. Please log in to continue.");
          return;
        }
        setSubmitError(result.error || "Failed to submit order");
      }
    } catch (error) {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateTimeSelection]);

  // Show loading while checking login status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Checking login status...</div>
        </div>
      </div>
    );
  }

  // Logged-in customer flow (streamlined single page) - NO LOGIN PROMPT
  if (isLoggedIn && customerData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Schedule Pickup</h1>
              <p className="text-gray-600 mt-2">Welcome back, {customerData?.firstName}! Schedule your laundry pickup quickly.</p>
            </div>

            {/* Step 1: Address Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Choose Pickup Address</h2>

              {/* Address Selector Component */}
              <AddressSelector
                selectedAddressId={formData.selectedAddressId}
                onAddressSelect={handleAddressSelect}
                onAddressCreate={handleAddressCreate}
                showCreateNew={true}
                label="Select Pickup Address"
                required={true}
                className="mt-4"
              />
            </div>

            {/* Step 2: Date & Time Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Choose Pickup & Delivery Time</h2>
              
              {/* Time Validation Error */}
              {timeValidationError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {timeValidationError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-6">
                {/* Pickup */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Pickup</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
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

                {/* Delivery */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Delivery</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        name="deliveryDate"
                        value={formData.deliveryDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                      <select
                        name="deliveryTime"
                        value={formData.deliveryTime}
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
              </div>
            </div>

            {/* Step 3: Service Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Choose Services</h2>
              
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
                        formData.services.includes(service.id.toString())
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-blue-300"
                      }`}
                      onClick={() => handleServiceToggle(service.id.toString())}
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
                            checked={formData.services.includes(service.id.toString())}
                            onChange={() => handleServiceToggle(service.id.toString())}
                            className="w-5 h-5 text-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4: Confirmation */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Confirm Details</h2>
              
              {/* Customer Info Display */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span> {customerData?.firstName} {customerData?.lastName}
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span> {customerData?.email}
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span> {selectedAddress?.contactNumber || customerData?.phone}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {selectedAddress && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Pickup Address</h3>
                  <div className="text-sm">
                    <div className="mb-1">
                      <span className="text-gray-600">Address:</span> {selectedAddress.label}
                    </div>
                    {selectedAddress.locationType && (
                      <div className="mb-1">
                        <span className="text-gray-600">Type:</span> {selectedAddress.locationType.charAt(0).toUpperCase() + selectedAddress.locationType.slice(1)}
                      </div>
                    )}
                    {selectedAddress.contactNumber && (
                      <div>
                        <span className="text-gray-600">Contact:</span> {selectedAddress.contactNumber}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Services */}
              {formData.services.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Selected Services</h3>
                  <div className="space-y-2">
                    {formData.services.map((serviceId) => {
                      const service = services.find(s => s.id.toString() === serviceId);
                      return (
                        <div key={serviceId} className="flex items-center space-x-3 text-sm">
                          <span className="text-lg">{service?.icon}</span>
                          <div>
                            <div className="font-medium">{service?.displayName || serviceId}</div>
                            <div className="text-gray-600">{service?.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
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
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-between">
              <Link
                href="/customer/dashboard"
                className="bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
              
              <button
                onClick={handleLoggedInSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Confirming Pickup..." : "Confirm Pickup"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login prompt for non-logged-in users ONLY
  if (showLoginPrompt && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Schedule Pickup</h2>
          <p className="text-gray-600 mb-6">Do you have an account with us?</p>
          <div className="space-y-3">
            <Link
              href="/customer/login"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Login to Your Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Guest customer flow (original 4-page flow)
  const renderGuestStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 1: Your Information & Address</h2>
            
            {/* Name Collection */}
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
            </div>

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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Where will we collect?</label>
                  <select
                    name="collectionMethod"
                    value={formData.collectionMethod}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select collection method</option>
                    <option value="reception">Reception</option>
                    <option value="concierge">Concierge</option>
                    <option value="direct">Directly from you</option>
                  </select>
                </div>
                <PhoneInput
                  value={formData.contactNumber}
                  onChange={(value) => setFormData(prev => ({ ...prev, contactNumber: value }))}
                  placeholder="Your contact number"
                  label="Contact Number"
                  required
                />
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collection Method</label>
                  <select
                    name="homeCollectionMethod"
                    value={formData.homeCollectionMethod}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select collection method</option>
                    <option value="direct">Collect directly from you</option>
                    <option value="outside">Leave outside house</option>
                  </select>
                </div>
                <PhoneInput
                  value={formData.contactNumber}
                  onChange={(value) => setFormData(prev => ({ ...prev, contactNumber: value }))}
                  placeholder="Your contact number"
                  label="Contact Number"
                  required
                />
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
              </div>
            )}

            {formData.locationType === "flat" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
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
                <PhoneInput
                  value={formData.contactNumber}
                  onChange={(value) => setFormData(prev => ({ ...prev, contactNumber: value }))}
                  placeholder="Your contact number"
                  label="Contact Number"
                  required
                />
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
              </div>
            )}

            {formData.locationType === "office" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
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
                <PhoneInput
                  value={formData.contactNumber}
                  onChange={(value) => setFormData(prev => ({ ...prev, contactNumber: value }))}
                  placeholder="Your contact number"
                  label="Contact Number"
                  required
                />
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
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 2: Time Selection</h2>
            
            {/* Time Validation Error */}
            {timeValidationError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {timeValidationError}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-6">
                {/* Pickup */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Pickup</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
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

                {/* Delivery */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Delivery</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        name="deliveryDate"
                        value={formData.deliveryDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                      <select
                        name="deliveryTime"
                        value={formData.deliveryTime}
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
              </div>
            </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 3: Service Selection</h2>
            
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
                      formData.services.includes(service.id.toString())
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300"
                    }`}
                    onClick={() => handleServiceToggle(service.id.toString())}
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
                          checked={formData.services.includes(service.id.toString())}
                          onChange={() => handleServiceToggle(service.id.toString())}
                          className="w-5 h-5 text-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Instructions in Step 3 */}
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
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 4: Overview & Submit Order</h2>
            
            {/* Order Overview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Order Overview</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600">Name:</span> {formData.firstName} {formData.lastName}</div>
                <div><span className="text-gray-600">Email:</span> {formData.email}</div>
                <div><span className="text-gray-600">Contact:</span> {formData.contactNumber}</div>
                <div><span className="text-gray-600">Pickup:</span> {formData.pickupDate} at {formData.pickupTime}</div>
                <div><span className="text-gray-600">Delivery:</span> {formData.deliveryDate} at {formData.deliveryTime}</div>
                <div><span className="text-gray-600">Services:</span> {formData.services.map(serviceId => {
                  const service = services.find(s => s.id.toString() === serviceId);
                  return service?.displayName || serviceId;
                }).join(", ")}</div>
                {formData.specialInstructions && (
                  <div><span className="text-gray-600">Instructions:</span> {formData.specialInstructions}</div>
                )}
              </div>
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
              {[1, 2, 3, 4].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    stepNum <= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {stepNum}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          {renderGuestStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {step > 1 && (
                <button
                  onClick={handlePrevious}
                  className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
              )}
              {step === 1 && (
                <Link
                  href="/"
                  className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700 transition-colors inline-block"
                >
                  Back to Home
                </Link>
              )}
            </div>
            
            <div>
              {step < 4 && (
                <button
                  onClick={handleNext}
                  className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              )}
              {step === 4 && (
                <button
                  onClick={handleGuestSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 text-white py-2 px-8 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Order & Create Account"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <ScheduleContent />
      </Suspense>
    </MainLayout>
  );
}

