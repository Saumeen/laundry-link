"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

interface Service {
  id: number;
  name: string;
  displayName: string;
  description: string;
  pricingType: 'BY_WEIGHT' | 'BY_PIECE';
  pricingUnit: 'KG' | 'PIECE';
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
        const data = await response.json() as Service[];
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
    const formData = new FormData(e.currentTarget);
    const serviceData = {
      name: formData.get('name') as string,
      displayName: formData.get('displayName') as string,
      description: formData.get('description') as string,
      pricingType: formData.get('pricingType') as 'BY_WEIGHT' | 'BY_PIECE',
      pricingUnit: formData.get('pricingUnit') as 'KG' | 'PIECE',
      price: parseFloat(formData.get('price') as string),
      unit: formData.get('unit') as string,
      turnaround: formData.get('turnaround') as string,
      category: formData.get('category') as string,
      features: (formData.get('features') as string).split(',').map(f => f.trim()),
      isActive: formData.get('isActive') === 'true',
      sortOrder: parseInt(formData.get('sortOrder') as string),
    };

    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
      const method = editingService ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });

      if (response.ok) {
        showToast(editingService ? 'Service updated successfully!' : 'Service created successfully!', 'success');
        setShowForm(false);
        setEditingService(null);
        fetchServices();
      } else {
        const data = await response.json() as { error?: string };
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
      const response = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Service deleted successfully!', 'success');
        fetchServices();
      } else {
        const data = await response.json() as { error?: string };
        showToast(data.error || 'Delete failed', 'error');
      }
    } catch (error) {
      showToast('Delete failed', 'error');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Service Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Service
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">{editingService ? 'Edit Service' : 'Add New Service'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                name="name"
                placeholder="Service Name (e.g., wash-fold)"
                defaultValue={editingService?.name}
                className="p-2 border rounded"
                required
              />
              <input
                name="displayName"
                placeholder="Display Name (e.g., Wash & Fold)"
                defaultValue={editingService?.displayName}
                className="p-2 border rounded"
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                defaultValue={editingService?.description}
                className="p-2 border rounded"
                required
              />
              <select name="pricingType" defaultValue={editingService?.pricingType} className="p-2 border rounded" required>
                <option value="BY_WEIGHT">By Weight</option>
                <option value="BY_PIECE">By Piece</option>
              </select>
              <select name="pricingUnit" defaultValue={editingService?.pricingUnit} className="p-2 border rounded" required>
                <option value="KG">KG</option>
                <option value="PIECE">Piece</option>
              </select>
              <input
                name="price"
                type="number"
                step="0.001"
                placeholder="Price"
                defaultValue={editingService?.price}
                className="p-2 border rounded"
                required
              />
              <input
                name="unit"
                placeholder="Unit (e.g., per kg)"
                defaultValue={editingService?.unit}
                className="p-2 border rounded"
                required
              />
              <input
                name="turnaround"
                placeholder="Turnaround (e.g., 24 hours)"
                defaultValue={editingService?.turnaround}
                className="p-2 border rounded"
                required
              />
              <select name="category" defaultValue={editingService?.category} className="p-2 border rounded" required>
                <option value="regular">Regular</option>
                <option value="premium">Premium</option>
              </select>
              <input
                name="features"
                placeholder="Features (comma-separated)"
                defaultValue={editingService?.features?.join(', ')}
                className="p-2 border rounded"
              />
              <input
                name="sortOrder"
                type="number"
                placeholder="Sort Order"
                defaultValue={editingService?.sortOrder}
                className="p-2 border rounded"
                required
              />
              <select name="isActive" defaultValue={editingService?.isActive?.toString()} className="p-2 border rounded" required>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {editingService ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingService(null); }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Display Name</th>
              <th className="px-4 py-2 border">Price</th>
              <th className="px-4 py-2 border">Category</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td className="px-4 py-2 border">{service.name}</td>
                <td className="px-4 py-2 border">{service.displayName}</td>
                <td className="px-4 py-2 border">BD {service.price} {service.unit}</td>
                <td className="px-4 py-2 border capitalize">{service.category}</td>
                <td className="px-4 py-2 border">
                  <span className={`px-2 py-1 rounded text-xs ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => handleEdit(service)}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
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