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
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      {/* Main Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service-Pricing Mappings</h2>
          <p className="text-gray-600 mt-1">Manage relationships between services and pricing items</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingMapping(null);
            resetForm();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          Add New Mapping
        </button>
      </div>

      {/* Breadcrumb for editing */}
      {editingMapping && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-blue-600">Service-Pricing Mappings</span>
            <span className="text-gray-400">/</span>
            <span className="text-blue-800 font-medium">
              Editing: {getServiceName(editingMapping.serviceId)} → {getPricingItemName(editingMapping.pricingItemId)}
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {editingMapping ? `Edit Mapping: ${getServiceName(editingMapping.serviceId)} → ${getPricingItemName(editingMapping.pricingItemId)}` : 'Add New Mapping'}
              </h3>
              {editingMapping && (
                <div className="mt-1 text-sm text-gray-600">
                  <span className="mr-4">ID: {editingMapping.id}</span>
                  <span className="mr-4">Status: {editingMapping.isActive ? 'Active' : 'Inactive'}</span>
                  <span className="mr-4">Default: {editingMapping.isDefault ? 'Yes' : 'No'}</span>
                  <span>Sort Order: {editingMapping.sortOrder}</span>
                </div>
              )}
            </div>
            {editingMapping && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Created</div>
                <div className="text-xs text-gray-400">
                  {new Date().toLocaleDateString()} {/* You can add actual creation date if available */}
                </div>
              </div>
            )}
          </div>
          
          {/* Form Section */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Mapping Details</h4>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service *
                  </label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.displayName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select the service to map</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pricing Item *
                  </label>
                  <select
                    value={formData.pricingItemId}
                    onChange={(e) => setFormData({...formData, pricingItemId: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Pricing Item</option>
                    {pricingItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.displayName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select the pricing item to map</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order *
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                    placeholder="1"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Display order (lower numbers first)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select 
                    value={formData.isActive.toString()} 
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})} 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    required
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Whether this mapping is available</p>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Default Mapping</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mark as default mapping for this service</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingMapping(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    {editingMapping ? 'Update Mapping' : 'Create Mapping'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mappings Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Service</th>
              <th className="px-4 py-2 border">Pricing Item</th>
              <th className="px-4 py-2 border">Default</th>
              <th className="px-4 py-2 border">Sort Order</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping) => (
              <tr key={mapping.id}>
                <td className="px-4 py-2 border">{getServiceName(mapping.serviceId)}</td>
                <td className="px-4 py-2 border">{getPricingItemName(mapping.pricingItemId)}</td>
                <td className="px-4 py-2 border">
                  <span className={`px-2 py-1 rounded text-xs ${mapping.isDefault ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {mapping.isDefault ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-2 border">{mapping.sortOrder}</td>
                <td className="px-4 py-2 border">
                  <span className={`px-2 py-1 rounded text-xs ${mapping.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {mapping.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => handleEdit(mapping)}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(mapping.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
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