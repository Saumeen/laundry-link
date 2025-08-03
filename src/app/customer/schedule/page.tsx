'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useServices } from '@/hooks/useServices';
import { useSession } from 'next-auth/react';
import { useProfileStore } from '@/customer';
import { useLogout } from '@/hooks/useAuth';
import { useScheduleStore } from '@/customer/stores/scheduleStore';

import ServiceSelection from '@/components/schedule/ServiceSelection';
import TimeSelection from '@/components/schedule/TimeSelection';
import AddressSelection from '@/components/schedule/AddressSelection';
import OrderSummary from '@/components/schedule/OrderSummary';
import CustomerNavigation from '@/components/CustomerNavigation';
import logger from '@/lib/logger';
import {
  ScheduleFormData,
  CustomerData,
  Address,
  ApiAddressesResponse,
  ApiOrderResponse,
} from '@/types/schedule';

function ScheduleContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { services, loading: servicesLoading } = useServices();
  const { profile, fetchProfile } = useProfileStore();
  const logout = useLogout();

  // Zustand store
  const {
    formData,
    customerData,
    addresses,
    currentStep,
    isLoading,
    isSubmitting,
    submitError,
    timeValidationError,
    isExpressService,
    setFormData,
    setCustomerData,
    setAddresses,
    setServices,
    setCurrentStep,
    setIsLoading,
    setIsSubmitting,
    setSubmitError,
    setTimeValidationError,
    toggleService,
    nextStep,
    previousStep,
    selectAddress,
    addAddress,
  } = useScheduleStore();

  // Type guard for custom session.user fields
  function isCustomUser(user: Record<string, unknown>): user is {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  } {
    return (
      typeof user?.firstName === 'string' &&
      typeof user?.lastName === 'string' &&
      typeof user?.phone === 'string' &&
      typeof user?.email === 'string'
    );
  }

  // Set services in store when loaded
  useEffect(() => {
    if (services && services.length > 0) {
      setServices(services);
    }
  }, [services, setServices]);

  // Fetch profile data
  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn, fetchProfile]);

  // Handle login status
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }
    if (session && session.user) {
      let firstName = '';
      let lastName = '';
      let phone = '';
      let email = '';
      if (isCustomUser(session.user)) {
        firstName = session.user.firstName;
        lastName = session.user.lastName;
        phone = session.user.phone;
        email = session.user.email;
      } else {
        firstName = session.user.name ?? '';
        lastName = '';
        phone = '';
        email = session.user.email ?? '';
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
  }, [session, status, setCustomerData, setIsLoading]);

  // Fetch customer addresses for logged-in users
  const fetchCustomerAddresses = useCallback(async () => {
    try {
      const response = await fetch('/api/customer/addresses');
      const result: ApiAddressesResponse = await response.json();
      if (response.ok) {
        setAddresses(result.addresses || []);
      }
    } catch (error) {
      logger.error('Error fetching addresses:', error);
    }
  }, [setAddresses]);

  // Handle form field changes
  const handleFormChange = useCallback(
    (field: string, value: string | any) => {
      setFormData({ [field]: value });

      // Clear validation errors when user makes changes
      if (timeValidationError) {
        setTimeValidationError('');
      }
    },
    [timeValidationError, setFormData, setTimeValidationError]
  );

  // Handle service toggle
  const handleServiceToggle = useCallback(
    (serviceId: string) => {
      toggleService(serviceId);
    },
    [toggleService]
  );

  // Handle address selection
  const handleAddressSelect = useCallback(
    (addressId: string) => {
      selectAddress(addressId);
    },
    [selectAddress]
  );

  // Handle address creation
  const handleAddressCreate = useCallback(
    (newAddress: Address) => {
      addAddress(newAddress);
      fetchCustomerAddresses();
    },
    [addAddress, fetchCustomerAddresses]
  );

  // Get selected address for display
  const selectedAddress = addresses.find(
    addr => addr.id.toString() === formData.selectedAddressId
  );

  // Navigation functions
  const handleNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handlePrevious = useCallback(() => {
    previousStep();
  }, [previousStep]);

  // Submit order
  const handleSubmit = useCallback(async () => {
    if (!formData.selectedAddressId) {
      alert('Please select an address');
      return;
    }

    // For express service, skip time slot validation
    if (!isExpressService) {
      if (!formData.pickupDate || !formData.pickupTimeSlot) {
        alert('Please select pickup date and time slot');
        return;
      }
      if (!formData.deliveryDate || !formData.deliveryTimeSlot) {
        alert('Please select delivery date and time slot');
        return;
      }
    }

    if (formData.services.length === 0) {
      alert('Please select at least one service');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const orderData = {
        // Customer info
        firstName: customerData?.firstName,
        lastName: customerData?.lastName,
        email: customerData?.email,
        phone: customerData?.phone,

        // Address info
        addressId: formData.selectedAddressId,
        locationType: selectedAddress?.locationType || '',
        contactNumber: selectedAddress?.contactNumber || customerData?.phone,

        // Time info
        pickupDate: formData.pickupDate,
        pickupTimeSlot: formData.pickupTimeSlot,
        pickupStartTime: formData.pickupStartTimeUTC,
        pickupEndTime: formData.pickupEndTimeUTC,
        deliveryDate: formData.deliveryDate,
        deliveryTimeSlot: formData.deliveryTimeSlot,
        deliveryStartTime: formData.deliveryStartTimeUTC,
        deliveryEndTime: formData.deliveryEndTimeUTC,

        // Services
        services: formData.services,

        // Special instructions
        specialInstructions: formData.specialInstructions,

        // Flag to indicate this is from a logged-in customer
        isLoggedInCustomer: true,

        // Express service flag
        isExpressService,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result: ApiOrderResponse = await response.json();

      if (response.ok) {
        // Redirect to success page
        window.location.href = `/order-success/${result.orderNumber}`;
      } else {
        setSubmitError(result.error || 'Failed to submit order');
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    customerData,
    selectedAddress,
    isExpressService,
    setIsSubmitting,
    setSubmitError,
  ]);

  // Show loading while checking login status
  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <div>Checking login status...</div>
        </div>
      </div>
    );
  }

  // Login prompt for non-logged-in users
  if (showLoginPrompt && !isLoggedIn) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Schedule Pickup
          </h2>
          <p className='text-gray-600 mb-6'>
            Please log in to schedule a pickup
          </p>
          <div className='space-y-3'>
            <Link
              href='/registerlogin'
              className='block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors'
            >
              Log in or Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} BD`;
  };

  // Main schedule flow for logged-in users
  if (isLoggedIn && customerData) {
    const steps = isExpressService
      ? [
          { id: 1, title: 'Services', description: 'Choose your services' },
          { id: 2, title: 'Address', description: 'Choose pickup address' },
          { id: 3, title: 'Confirm', description: 'Review & submit order' },
        ]
      : [
          { id: 1, title: 'Services', description: 'Choose your services' },
          {
            id: 2,
            title: 'Time',
            description: 'Select pickup & delivery time',
          },
          { id: 3, title: 'Address', description: 'Choose pickup address' },
          { id: 4, title: 'Confirm', description: 'Review & submit order' },
        ];

    const renderStepContent = () => {
      if (isExpressService) {
        // Express service flow: Services -> Address -> Confirm
        switch (currentStep) {
          case 1:
            return (
              <ServiceSelection
                services={services}
                loading={servicesLoading}
                selectedServices={formData.services}
                onServiceToggle={handleServiceToggle}
              />
            );
          case 2:
            return (
              <AddressSelection
                selectedAddressId={formData.selectedAddressId}
                onAddressSelect={handleAddressSelect}
                onAddressCreate={handleAddressCreate}
              />
            );
          case 3:
            return (
              <OrderSummary
                customerData={customerData}
                selectedAddress={selectedAddress}
                services={services}
                selectedServices={formData.services}
                pickupDate={formData.pickupDate}
                deliveryDate={formData.deliveryDate}
                pickupTimeSlot={formData.pickupTimeSlot}
                deliveryTimeSlot={formData.deliveryTimeSlot}
                specialInstructions={formData.specialInstructions}
                onSpecialInstructionsChange={value =>
                  handleFormChange('specialInstructions', value)
                }
                isExpressService={true}
              />
            );
          default:
            return null;
        }
      } else {
        // Regular service flow: Services -> Time -> Address -> Confirm
        switch (currentStep) {
          case 1:
            return (
              <ServiceSelection
                services={services}
                loading={servicesLoading}
                selectedServices={formData.services}
                onServiceToggle={handleServiceToggle}
              />
            );
          case 2:
            return (
              <TimeSelection
                pickupDate={formData.pickupDate}
                deliveryDate={formData.deliveryDate}
                pickupTimeSlot={formData.pickupTimeSlot}
                deliveryTimeSlot={formData.deliveryTimeSlot}
                onTimeChange={handleFormChange}
                validationError={timeValidationError}
              />
            );
          case 3:
            return (
              <AddressSelection
                selectedAddressId={formData.selectedAddressId}
                onAddressSelect={handleAddressSelect}
                onAddressCreate={handleAddressCreate}
              />
            );
          case 4:
            return (
              <OrderSummary
                customerData={customerData}
                selectedAddress={selectedAddress}
                services={services}
                selectedServices={formData.services}
                pickupDate={formData.pickupDate}
                deliveryDate={formData.deliveryDate}
                pickupTimeSlot={formData.pickupTimeSlot}
                deliveryTimeSlot={formData.deliveryTimeSlot}
                specialInstructions={formData.specialInstructions}
                onSpecialInstructionsChange={value =>
                  handleFormChange('specialInstructions', value)
                }
                isExpressService={false}
              />
            );
          default:
            return null;
        }
      }
    };

    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
        <CustomerNavigation
          currentPage='schedule'
          title='Schedule Pickup'
          subtitle='Book your laundry pickup and delivery'
          icon='📅'
        />

        {/* Main Content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='max-w-4xl mx-auto'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              {/* Header */}
              <div className='mb-8'>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Schedule Pickup
                </h1>
                <p className='text-gray-600 mt-2'>
                  Welcome back, {customerData?.firstName}! Let's get your
                  laundry scheduled.
                </p>
              </div>

              {/* Progress Steps */}
              <div className='mb-8'>
                <div className='flex items-center justify-between mb-4'>
                  {steps.map((step, index) => (
                    <div key={step.id} className='flex items-center'>
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${(() => {
                          if (step.id <= currentStep) {
                            return 'bg-blue-600 text-white';
                          } else {
                            return 'bg-gray-300 text-gray-600';
                          }
                        })()}`}
                      >
                        {step.id}
                      </div>
                      <div className='ml-3'>
                        <div className='text-sm font-medium text-gray-900'>
                          {step.title}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {step.description}
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-4 ${(() => {
                            if (step.id < currentStep) {
                              return 'bg-blue-600';
                            } else {
                              return 'bg-gray-300';
                            }
                          })()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className='mb-8'>{renderStepContent()}</div>

              {/* Error Message */}
              {submitError && (
                <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
                  {submitError}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className='flex justify-between'>
                <div>
                  {currentStep > 1 && (
                    <button
                      onClick={handlePrevious}
                      className='bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors'
                    >
                      Previous
                    </button>
                  )}
                  {currentStep === 1 && (
                    <Link
                      href='/customer/dashboard'
                      className='bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors inline-block'
                    >
                      Back to Dashboard
                    </Link>
                  )}
                </div>

                <div>
                  {currentStep < (isExpressService ? 3 : 4) && (
                    <button
                      onClick={handleNext}
                      disabled={currentStep === 1 && formData.services.length === 0}
                      className='bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Next
                    </button>
                  )}
                  {currentStep === (isExpressService ? 3 : 4) && (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className='bg-green-600 text-white py-3 px-8 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50'
                    >
                      {(() => {
                        if (isSubmitting) {
                          return 'Confirming Pickup...';
                        } else {
                          return 'Confirm Pickup';
                        }
                      })()}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScheduleContent />
    </Suspense>
  );
}
