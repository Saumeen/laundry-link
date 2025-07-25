'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

interface Service {
  id: number;
  name: string;
  displayName: string;
  description: string;
  pricingType: string;
  pricingUnit: string;
  price: number;
  unit: string;
  turnaround: string;
  category: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export default function ServiceManagement() {
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/services');
      if (response.ok) {
        const data = (await response.json()) as Service[];
        setServices(data);
      } else {
        setMessage('Failed to load services');
      }
    } catch (error) {
      setMessage('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    debugger;
    const formData = new FormData(e.currentTarget);
    const serviceData = {
      name: formData.get('name') as string,
      displayName: formData.get('displayName') as string,
      description: formData.get('description') as string,
      pricingType: formData.get('pricingType') as string,
      pricingUnit: formData.get('pricingUnit') as string,
      price: parseFloat(formData.get('price') as string),
      unit: formData.get('unit') as string,
      turnaround: formData.get('turnaround') as string,
      category: formData.get('category') as string,
      features: (formData.get('features') as string)
        .split(',')
        .map(f => f.trim()),
      isActive: formData.get('isActive') === 'true',
      sortOrder: parseInt(formData.get('sortOrder') as string),
    };

    try {
      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : '/api/admin/services';
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });

      if (response.ok) {
        showToast(
          editingService
            ? 'Service updated successfully!'
            : 'Service created successfully!',
          'success'
        );
        setShowForm(false);
        setEditingService(null);
        fetchServices();
      } else {
        const data = (await response.json()) as { error?: string };
        showToast(data.error || 'Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation failed', 'error');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showToast('Service deleted successfully!', 'success');
        fetchServices();
      } else {
        const data = (await response.json()) as { error?: string };
        showToast(data.error || 'Delete failed', 'error');
      }
    } catch (error) {
      showToast('Delete failed', 'error');
    }
  };

  if (loading) {
    return <div className='p-6 text-center'>Loading...</div>;
  }

  return (
    <div className='p-6'>
      {/* Main Header */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            Service Management
          </h2>
          <p className='text-gray-600 mt-1'>
            Manage laundry services, pricing, and availability
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200'
        >
          Add New Service
        </button>
      </div>

      {/* Breadcrumb for editing */}
      {editingService && (
        <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <div className='flex items-center space-x-2 text-sm'>
            <span className='text-blue-600'>Services</span>
            <span className='text-gray-400'>/</span>
            <span className='text-blue-800 font-medium'>
              Editing: {editingService.displayName}
            </span>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`mb-4 p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {message}
        </div>
      )}

      {showForm && (
        <div className='mb-6 p-4 border rounded-lg bg-gray-50'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='text-xl font-semibold text-gray-900'>
                {editingService
                  ? `Edit Service: ${editingService.displayName}`
                  : 'Add New Service'}
              </h3>
              {editingService && (
                <div className='mt-1 text-sm text-gray-600'>
                  <span className='mr-4'>ID: {editingService.id}</span>
                  <span className='mr-4'>
                    Status: {editingService.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span>Category: {editingService.category}</span>
                </div>
              )}
            </div>
            {editingService && (
              <div className='text-right'>
                <div className='text-sm text-gray-500'>Created</div>
                <div className='text-xs text-gray-400'>
                  {new Date().toLocaleDateString()}{' '}
                  {/* You can add actual creation date if available */}
                </div>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className='border-t border-gray-200 pt-4'>
            <h4 className='text-lg font-medium text-gray-900 mb-4'>
              Service Details
            </h4>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='grid grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Service Name *
                  </label>
                  <input
                    name='name'
                    placeholder='e.g., wash-fold'
                    defaultValue={editingService?.name}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Internal identifier (lowercase, no spaces)
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Display Name *
                  </label>
                  <input
                    name='displayName'
                    placeholder='e.g., Wash & Fold'
                    defaultValue={editingService?.displayName}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Name shown to customers
                  </p>
                </div>

                <div className='col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description *
                  </label>
                  <textarea
                    name='description'
                    placeholder='Brief description of the service'
                    defaultValue={editingService?.description}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    rows={3}
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Detailed description for customers
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Pricing Type
                  </label>
                  <input
                    name='pricingType'
                    type='text'
                    placeholder='e.g., By Weight, By Piece, By Item'
                    defaultValue={editingService?.pricingType}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    How the service is priced
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Pricing Unit
                  </label>
                  <input
                    name='pricingUnit'
                    type='text'
                    placeholder='e.g., KG, Piece, Item, Bag'
                    defaultValue={editingService?.pricingUnit}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Unit of measurement for pricing
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Base Price (BD) *
                  </label>
                  <input
                    name='price'
                    type='number'
                    step='0.001'
                    placeholder='0.00'
                    defaultValue={editingService?.price}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Base price in Bahraini Dinar
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Price Unit *
                  </label>
                  <input
                    name='unit'
                    placeholder='e.g., per kg, per item'
                    defaultValue={editingService?.unit}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    How the price is displayed to customers
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Turnaround Time *
                  </label>
                  <input
                    name='turnaround'
                    placeholder='e.g., 24 hours, 48 hours'
                    defaultValue={editingService?.turnaround}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Expected completion time
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Service Category *
                  </label>
                  <select
                    name='category'
                    defaultValue={editingService?.category}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  >
                    <option value=''>Select category</option>
                    <option value='regular'>Regular</option>
                    <option value='premium'>Premium</option>
                  </select>
                  <p className='text-xs text-gray-500 mt-1'>
                    Service tier classification
                  </p>
                </div>

                <div className='col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Features
                  </label>
                  <input
                    name='features'
                    placeholder='e.g., Stain treatment, Express service, Eco-friendly'
                    defaultValue={editingService?.features?.join(', ')}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Comma-separated list of service features
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Sort Order *
                  </label>
                  <input
                    name='sortOrder'
                    type='number'
                    placeholder='1'
                    defaultValue={editingService?.sortOrder}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Display order (lower numbers first)
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Status *
                  </label>
                  <select
                    name='isActive'
                    defaultValue={editingService?.isActive?.toString()}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  >
                    <option value='true'>Active</option>
                    <option value='false'>Inactive</option>
                  </select>
                  <p className='text-xs text-gray-500 mt-1'>
                    Whether the service is available to customers
                  </p>
                </div>
              </div>

              <div className='border-t border-gray-200 pt-6'>
                <div className='flex justify-end space-x-3'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowForm(false);
                      setEditingService(null);
                    }}
                    className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                  >
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border border-gray-300'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='px-4 py-2 border'>Name</th>
              <th className='px-4 py-2 border'>Display Name</th>
              <th className='px-4 py-2 border'>Price</th>
              <th className='px-4 py-2 border'>Category</th>
              <th className='px-4 py-2 border'>Status</th>
              <th className='px-4 py-2 border'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id}>
                <td className='px-4 py-2 border'>{service.name}</td>
                <td className='px-4 py-2 border'>{service.displayName}</td>
                <td className='px-4 py-2 border'>
                  BD {service.price} {service.unit}
                </td>
                <td className='px-4 py-2 border capitalize'>
                  {service.category}
                </td>
                <td className='px-4 py-2 border'>
                  <span
                    className={`px-2 py-1 rounded text-xs ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className='px-4 py-2 border'>
                  <button
                    onClick={() => handleEdit(service)}
                    className='bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-blue-700'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className='bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700'
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
