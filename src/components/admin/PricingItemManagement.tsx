"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

interface PricingItem {
  id: number;
  name: string;
  displayName: string;
  price: number;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  categoryId: number;
  category?: {
    name: string;
    displayName: string;
  };
}

interface PricingCategory {
  id: number;
  name: string;
  displayName: string;
}

export default function PricingItemManagement() {
  const { showToast } = useToast();
  const [items, setItems] = useState<PricingItem[]>([]);
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/admin/pricing-items'),
        fetch('/api/admin/pricing-categories')
      ]);
      
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json() as PricingItem[];
        setItems(itemsData);
      }
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json() as PricingCategory[];
        setCategories(categoriesData);
      }
    } catch (error) {
      setMessage('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemData = {
      name: formData.get('name') as string,
      displayName: formData.get('displayName') as string,
      price: parseFloat(formData.get('price') as string),
      description: formData.get('description') as string,
      sortOrder: parseInt(formData.get('sortOrder') as string),
      isActive: formData.get('isActive') === 'true',
      categoryId: parseInt(formData.get('categoryId') as string),
    };

    try {
      const url = editingItem ? `/api/admin/pricing-items/${editingItem.id}` : '/api/admin/pricing-items';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        showToast(editingItem ? 'Item updated successfully!' : 'Item created successfully!', 'success');
        setShowForm(false);
        setEditingItem(null);
        fetchData();
      } else {
        const data = await response.json() as { error?: string };
        showToast(data.error || 'Operation failed', 'error');
      }
    } catch (error) {
      showToast('Operation failed', 'error');
    }
  };

  const handleEdit = (item: PricingItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(`/api/admin/pricing-items/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Item deleted successfully!', 'success');
        fetchData();
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
        <h2 className="text-xl font-semibold">Pricing Item Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Item
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                name="name"
                placeholder="Item Name (e.g., SHIRT_TSHIRT)"
                defaultValue={editingItem?.name}
                className="p-2 border rounded"
                required
              />
              <input
                name="displayName"
                placeholder="Display Name (e.g., Shirt / T-shirt)"
                defaultValue={editingItem?.displayName}
                className="p-2 border rounded"
                required
              />
              <input
                name="price"
                type="number"
                step="0.001"
                placeholder="Price"
                defaultValue={editingItem?.price}
                className="p-2 border rounded"
                required
              />
              <select
                name="categoryId"
                defaultValue={editingItem?.categoryId}
                className="p-2 border rounded"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.displayName}
                  </option>
                ))}
              </select>
              <textarea
                name="description"
                placeholder="Description"
                defaultValue={editingItem?.description}
                className="p-2 border rounded"
              />
              <input
                name="sortOrder"
                type="number"
                placeholder="Sort Order"
                defaultValue={editingItem?.sortOrder}
                className="p-2 border rounded"
                required
              />
              <select name="isActive" defaultValue={editingItem?.isActive?.toString()} className="p-2 border rounded" required>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {editingItem ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingItem(null); }}
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
              <th className="px-4 py-2 border">Sort Order</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 border">{item.name}</td>
                <td className="px-4 py-2 border">{item.displayName}</td>
                <td className="px-4 py-2 border">BD {item.price.toFixed(3)}</td>
                <td className="px-4 py-2 border">{item.category?.displayName || '-'}</td>
                <td className="px-4 py-2 border">{item.sortOrder}</td>
                <td className="px-4 py-2 border">
                  <span className={`px-2 py-1 rounded text-xs ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
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