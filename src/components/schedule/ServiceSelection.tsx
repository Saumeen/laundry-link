'use client';

import { Service } from '@/types/schedule';

interface ServiceSelectionProps {
  services: Service[];
  loading: boolean;
  selectedServices: string[];
  onServiceToggle: (serviceId: string) => void;
}

export default function ServiceSelection({
  services,
  loading,
  selectedServices,
  onServiceToggle,
}: ServiceSelectionProps) {
  if (loading) {
    return (
      <div className='text-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
        <p className='mt-2 text-gray-600'>Loading services...</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold text-gray-900'>Select Services</h2>
      <p className='text-gray-600'>Choose the services you need for your laundry</p>
      
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {services.map(service => (
          <div
            key={service.id}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedServices.includes(service.id.toString())
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
            onClick={() => onServiceToggle(service.id.toString())}
          >
            <div className='flex items-start space-x-3'>
              <div className='text-2xl'>{service.icon}</div>
              <div className='flex-1'>
                <h3 className='font-medium text-gray-900'>
                  {service.displayName}
                </h3>
                <p className='text-sm text-gray-600 mt-1'>
                  {service.description}
                </p>
                <p className='text-sm text-blue-600 mt-1 font-medium'>
                  {service.pricingType && service.pricingUnit && (
                    <>
                      {service.pricingType && `Pricing: ${service.pricingType}`}{' '}
                      {service.pricingUnit && `(${service.pricingUnit})`}
                    </>
                  )}
                </p>
              </div>
              <div className='flex-shrink-0'>
                <input
                  type='checkbox'
                  checked={selectedServices.includes(service.id.toString())}
                  onChange={() => onServiceToggle(service.id.toString())}
                  className='w-5 h-5 text-blue-600'
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 