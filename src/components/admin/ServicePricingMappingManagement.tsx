"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

interface Service {
  id: number;
  name: string;
  displayName: string;
}

interface PricingItem {
  id: number;
  name: string;
  displayName: string;
  categoryId: number;
}

interface ServicePricingMapping {
  id: number;
  serviceId: number;
  pricingItemId: number;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  service?: Service;
  pricingItem?: PricingItem;
}

export default function ServicePricingMappingManagement() {
  const { showToast } = useToast();
  const [mappings, setMappings] = useState<ServicePricingMapping[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ServicePricingMapping | null>(null);
  const [formData, setFormData] = useState({
    serviceId: "",
    pricingItemId: "",
    isDefault: false,
    sortOrder: 0,
    isActive: true
  });

  useEffect(() => {
    fetchMappings();
    fetchServices();
    fetchPricingItems();
  }, []);

  const fetchMappings = async () => {
    try {
      const response = await fetch('/api/admin/service-pricing-mappings');
      if (response.ok) {
        const data = await response.json() as ServicePricingMapping[];
        setMappings(data);
      }
    } catch (error) {
      showToast('Failed to fetch mappings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      if (response.ok) {
        const data = await response.json() as Service[];
        setServices(data);
      }
    } catch (error) {
      showToast('Failed to fetch services', 'error');
    }
  };

  const fetchPricingItems = async () => {
    try {
      const response = await fetch('/api/admin/pricing-items');
      if (response.ok) {
        const data = await response.json() as PricingItem[];
        setPricingItems(data);
      }
    } catch (error) {
      showToast('Failed to fetch pricing items', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingMapping 
        ? `/api/admin/service-pricing-mappings/${editingMapping.id}`
        : '/api/admin/service-pricing-mappings';
      
      const method = editingMapping ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast(editingMapping ? 'Mapping updated successfully' : 'Mapping created successfully', 'success');
        setShowForm(false);
        setEditingMapping(null);
        resetForm();
        fetchMappings();
      } else {
        const error = await response.json() as { message?: string };
        showToast(error.message || 'Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation failed', 'error');
    }
  };

  const handleEdit = (mapping: ServicePricingMapping) => {
    setEditingMapping(mapping);
    setFormData({
      serviceId: mapping.serviceId.toString(),
      pricingItemId: mapping.pricingItemId.toString(),
      isDefault: mapping.isDefault,
      sortOrder: mapping.sortOrder,
      isActive: mapping.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;
    
    try {
      const response = await fetch(`/api/admin/service-pricing-mappings/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast('Mapping deleted successfully', 'success');
        fetchMappings();
      } else {
        showToast('Failed to delete mapping', 'error');
      }
    } catch (error) {
      showToast('Failed to delete mapping', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      serviceId: "",
      pricingItemId: "",
      isDefault: false,
      sortOrder: 0,
      isActive: true
    });
  };

  const getServiceName = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    return service?.displayName || 'Unknown Service';
  };

  const getPricingItemName = (pricingItemId: number) => {
    const item = pricingItems.find(p => p.id === pricingItemId);
    return item?.displayName || 'Unknown Item';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Service-Pricing Mappings</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingMapping(null);
            resetForm();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Mapping
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service *
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select Service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pricing Item *
                </label>
                <select
                  value={formData.pricingItemId}
                  onChange={(e) => setFormData({...formData, pricingItemId: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select Pricing Item</option>
                  {pricingItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Default Mapping</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMapping(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingMapping ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mappings Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pricing Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sort Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mappings.map((mapping) => (
              <tr key={mapping.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getServiceName(mapping.serviceId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getPricingItemName(mapping.pricingItemId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    mapping.isDefault 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {mapping.isDefault ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {mapping.sortOrder}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    mapping.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {mapping.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(mapping)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(mapping.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {mappings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No mappings found. Create your first mapping to get started.
          </div>
        )}
      </div>
    </div>
  );
} 