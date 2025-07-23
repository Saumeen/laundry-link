"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

interface PricingCategory {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export default function PricingCategoryManagement() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<PricingCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/pricing-categories');
      if (response.ok) {
        const data = await response.json() as PricingCategory[];
        setCategories(data);
      } else {
        setMessage('Failed to load categories');
      }
    } catch (error) {
      setMessage('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoryData = {
      name: formData.get('name') as string,
      displayName: formData.get('displayName') as string,
      description: formData.get('description') as string,
      sortOrder: parseInt(formData.get('sortOrder') as string),
      isActive: formData.get('isActive') === 'true',
    };

    try {
      const url = editingCategory ? `/api/admin/pricing-categories/${editingCategory.id}` : '/api/admin/pricing-categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        showToast(editingCategory ? 'Category updated successfully!' : 'Category created successfully!', 'success');
        setShowForm(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        const data = await response.json() as { error?: string };
        showToast(data.error || 'Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation failed', 'error');
    }
  };

  const handleEdit = (category: PricingCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const response = await fetch(`/api/admin/pricing-categories/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Category deleted successfully!', 'success');
        fetchCategories();
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
      {/* Main Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pricing Category Management</h2>
          <p className="text-gray-600 mt-1">Manage pricing categories for laundry services</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          Add New Category
        </button>
      </div>

      {/* Breadcrumb for editing */}
      {editingCategory && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-blue-600">Pricing Categories</span>
            <span className="text-gray-400">/</span>
            <span className="text-blue-800 font-medium">Editing: {editingCategory.displayName}</span>
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {editingCategory ? `Edit Category: ${editingCategory.displayName}` : 'Add New Category'}
              </h3>
              {editingCategory && (
                <div className="mt-1 text-sm text-gray-600">
                  <span className="mr-4">ID: {editingCategory.id}</span>
                  <span className="mr-4">Status: {editingCategory.isActive ? 'Active' : 'Inactive'}</span>
                  <span>Sort Order: {editingCategory.sortOrder}</span>
                </div>
              )}
            </div>
            {editingCategory && (
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
            <h4 className="text-lg font-medium text-gray-900 mb-4">Category Details</h4>
            <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    name="name"
                    placeholder="e.g., IRON_PRESS"
                    defaultValue={editingCategory?.name}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Internal identifier (uppercase, underscores)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name *
                  </label>
                  <input
                    name="displayName"
                    placeholder="e.g., Iron / Press"
                    defaultValue={editingCategory?.displayName}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Name shown to customers</p>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Brief description of the category"
                    defaultValue={editingCategory?.description}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional description for internal reference</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order *
                  </label>
                  <input
                    name="sortOrder"
                    type="number"
                    placeholder="1"
                    defaultValue={editingCategory?.sortOrder}
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
                    name="isActive" 
                    defaultValue={editingCategory?.isActive?.toString()} 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    required
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Whether the category is available</p>
                </div>
              </div>
                          <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingCategory(null); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Display Name</th>
              <th className="px-4 py-2 border">Description</th>
              <th className="px-4 py-2 border">Sort Order</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-2 border">{category.name}</td>
                <td className="px-4 py-2 border">{category.displayName}</td>
                <td className="px-4 py-2 border">{category.description || '-'}</td>
                <td className="px-4 py-2 border">{category.sortOrder}</td>
                <td className="px-4 py-2 border">
                  <span className={`px-2 py-1 rounded text-xs ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => handleEdit(category)}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
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