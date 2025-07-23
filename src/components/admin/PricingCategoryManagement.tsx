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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Pricing Category Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Category
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                name="name"
                placeholder="Category Name (e.g., IRON_PRESS)"
                defaultValue={editingCategory?.name}
                className="p-2 border rounded"
                required
              />
              <input
                name="displayName"
                placeholder="Display Name (e.g., Iron / Press)"
                defaultValue={editingCategory?.displayName}
                className="p-2 border rounded"
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                defaultValue={editingCategory?.description}
                className="p-2 border rounded"
              />
              <input
                name="sortOrder"
                type="number"
                placeholder="Sort Order"
                defaultValue={editingCategory?.sortOrder}
                className="p-2 border rounded"
                required
              />
              <select name="isActive" defaultValue={editingCategory?.isActive?.toString()} className="p-2 border rounded" required>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {editingCategory ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingCategory(null); }}
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