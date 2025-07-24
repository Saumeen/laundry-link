'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

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
        fetch('/api/admin/pricing-categories'),
      ]);

      if (itemsResponse.ok) {
        const itemsData = (await itemsResponse.json()) as PricingItem[];
        setItems(itemsData);
      }
      if (categoriesResponse.ok) {
        const categoriesData =
          (await categoriesResponse.json()) as PricingCategory[];
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
      const url = editingItem
        ? `/api/admin/pricing-items/${editingItem.id}`
        : '/api/admin/pricing-items';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        showToast(
          editingItem
            ? 'Item updated successfully!'
            : 'Item created successfully!',
          'success'
        );
        setShowForm(false);
        setEditingItem(null);
        fetchData();
      } else {
        const data = (await response.json()) as { error?: string };
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
      const response = await fetch(`/api/admin/pricing-items/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showToast('Item deleted successfully!', 'success');
        fetchData();
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
            Pricing Item Management
          </h2>
          <p className='text-gray-600 mt-1'>
            Manage individual pricing items within categories
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200'
        >
          Add New Item
        </button>
      </div>

      {/* Breadcrumb for editing */}
      {editingItem && (
        <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <div className='flex items-center space-x-2 text-sm'>
            <span className='text-blue-600'>Pricing Items</span>
            <span className='text-gray-400'>/</span>
            <span className='text-blue-800 font-medium'>
              Editing: {editingItem.displayName}
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
                {editingItem
                  ? `Edit Item: ${editingItem.displayName}`
                  : 'Add New Item'}
              </h3>
              {editingItem && (
                <div className='mt-1 text-sm text-gray-600'>
                  <span className='mr-4'>ID: {editingItem.id}</span>
                  <span className='mr-4'>
                    Status: {editingItem.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className='mr-4'>
                    Category: {editingItem.category?.displayName}
                  </span>
                  <span>Sort Order: {editingItem.sortOrder}</span>
                </div>
              )}
            </div>
            {editingItem && (
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
              Item Details
            </h4>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='grid grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Item Name *
                  </label>
                  <input
                    name='name'
                    placeholder='e.g., SHIRT_TSHIRT'
                    defaultValue={editingItem?.name}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Internal identifier (uppercase, underscores)
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Display Name *
                  </label>
                  <input
                    name='displayName'
                    placeholder='e.g., Shirt / T-shirt'
                    defaultValue={editingItem?.displayName}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Name shown to customers
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Price (BD) *
                  </label>
                  <input
                    name='price'
                    type='number'
                    step='0.001'
                    placeholder='0.000'
                    defaultValue={editingItem?.price}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Price in Bahraini Dinar
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Category *
                  </label>
                  <select
                    name='categoryId'
                    defaultValue={editingItem?.categoryId}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  >
                    <option value=''>Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.displayName}
                      </option>
                    ))}
                  </select>
                  <p className='text-xs text-gray-500 mt-1'>
                    Pricing category this item belongs to
                  </p>
                </div>

                <div className='col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  <textarea
                    name='description'
                    placeholder='Brief description of the item'
                    defaultValue={editingItem?.description}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    rows={3}
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Optional description for internal reference
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
                    defaultValue={editingItem?.sortOrder}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Display order within category (lower numbers first)
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Status *
                  </label>
                  <select
                    name='isActive'
                    defaultValue={editingItem?.isActive?.toString()}
                    className='w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    required
                  >
                    <option value='true'>Active</option>
                    <option value='false'>Inactive</option>
                  </select>
                  <p className='text-xs text-gray-500 mt-1'>
                    Whether the item is available for pricing
                  </p>
                </div>
              </div>
              <div className='border-t border-gray-200 pt-6'>
                <div className='flex justify-end space-x-3'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                    }}
                    className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'
                  >
                    {editingItem ? 'Update Item' : 'Create Item'}
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
              <th className='px-4 py-2 border'>Sort Order</th>
              <th className='px-4 py-2 border'>Status</th>
              <th className='px-4 py-2 border'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className='px-4 py-2 border'>{item.name}</td>
                <td className='px-4 py-2 border'>{item.displayName}</td>
                <td className='px-4 py-2 border'>BD {item.price.toFixed(3)}</td>
                <td className='px-4 py-2 border'>
                  {item.category?.displayName || '-'}
                </td>
                <td className='px-4 py-2 border'>{item.sortOrder}</td>
                <td className='px-4 py-2 border'>
                  <span
                    className={`px-2 py-1 rounded text-xs ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className='px-4 py-2 border'>
                  <button
                    onClick={() => handleEdit(item)}
                    className='bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-blue-700'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
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
