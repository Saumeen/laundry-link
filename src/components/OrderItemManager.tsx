'use client';

import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/logger';

interface OrderItem {
  id?: number;
  orderServiceMappingId: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
  notes?: string;
}

interface OrderServiceMapping {
  id: number;
  service: {
    id: number;
    name: string;
    displayName: string;
  };
  orderItems: OrderItem[];
}

interface ApiResponse {
  orderItems?: OrderItem[];
  error?: string;
}

interface OrderItemManagerProps {
  orderId: number;
  orderServiceMappings: OrderServiceMapping[];
  onItemsUpdated: () => void;
}

const ITEM_TYPES = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'bedding', label: 'Bedding & Linens' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
];

const COMMON_ITEMS = {
  clothing: [
    'Shirt/T-shirt',
    'Pants/Jeans',
    'Dress',
    'Suit',
    'Jacket',
    'Sweater',
    'Blouse',
    'Shorts',
    'Skirt',
    'Underwear',
    'Socks',
    'Pyjamas',
    'Uniform',
    'Tracksuit',
  ],
  bedding: [
    'Bedsheet',
    'Pillow Case',
    'Duvet',
    'Blanket',
    'Bath Towel',
    'Hand Towel',
    'Bathrobe',
    'Curtains',
    'Tablecloth',
  ],
  accessories: ['Scarf', 'Tie', 'Belt', 'Bag', 'Hat', 'Gloves'],
  other: ['Carpet', 'Rug', 'Stuffed Toy', 'Backpack', 'Shoes'],
};

export default function OrderItemManager({
  orderId,
  orderServiceMappings,
  onItemsUpdated,
}: OrderItemManagerProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<OrderItem>>({
    orderServiceMappingId: orderServiceMappings[0]?.id || 0,
    itemName: '',
    itemType: 'clothing',
    quantity: 1,
    pricePerItem: 0,
    notes: '',
  });

  const loadOrderItems = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/add-order-items?orderId=${orderId}`
      );
      if (response.ok) {
        const data = (await response.json()) as ApiResponse;
        setItems(data.orderItems || []);
      }
    } catch (error) {
      logger.error('Error loading order items:', error);
    }
  }, [orderId]);

  useEffect(() => {
    // Load existing items
    loadOrderItems();
  }, [loadOrderItems]);

  const handleAddItem = async () => {
    if (
      !newItem.itemName ||
      !newItem.orderServiceMappingId ||
      (newItem.quantity ?? 0) <= 0 ||
      (newItem.pricePerItem ?? 0) <= 0
    ) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const itemToAdd: OrderItem = {
        orderServiceMappingId: newItem.orderServiceMappingId!,
        itemName: newItem.itemName!,
        itemType: newItem.itemType!,
        quantity: newItem.quantity!,
        pricePerItem: newItem.pricePerItem!,
        totalPrice: newItem.quantity! * newItem.pricePerItem!,
        notes: newItem.notes,
      };

      const response = await fetch('/api/admin/add-order-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderItems: [...items, itemToAdd],
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewItem({
          orderServiceMappingId: orderServiceMappings[0]?.id || 0,
          itemName: '',
          itemType: 'clothing',
          quantity: 1,
          pricePerItem: 0,
          notes: '',
        });
        onItemsUpdated();
        loadOrderItems();
      } else {
        const error = (await response.json()) as ApiResponse;
        alert(error.error || 'Failed to add item');
      }
    } catch (error) {
      logger.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const handleEditItem = async () => {
    if (
      !editingItem ||
      !editingItem.itemName ||
      editingItem.quantity <= 0 ||
      editingItem.pricePerItem <= 0
    ) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const updatedItems = items.map(item =>
        item.id === editingItem.id
          ? {
              ...editingItem,
              totalPrice: editingItem.quantity * editingItem.pricePerItem,
            }
          : item
      );

      const response = await fetch('/api/admin/add-order-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderItems: updatedItems,
        }),
      });

      if (response.ok) {
        setEditingItem(null);
        onItemsUpdated();
        loadOrderItems();
      } else {
        const error = (await response.json()) as ApiResponse;
        alert(error.error || 'Failed to update item');
      }
    } catch (error) {
      logger.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const updatedItems = items.filter(item => item.id !== itemId);

      const response = await fetch('/api/admin/add-order-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          orderItems: updatedItems,
        }),
      });

      if (response.ok) {
        onItemsUpdated();
        loadOrderItems();
      } else {
        const error = (await response.json()) as ApiResponse;
        alert(error.error || 'Failed to delete item');
      }
    } catch (error) {
      logger.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const getServiceName = (serviceMappingId: number) => {
    const mapping = orderServiceMappings.find(m => m.id === serviceMappingId);
    return mapping?.service.displayName || 'Unknown Service';
  };

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-medium text-gray-900'>Order Items</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
        >
          Add Item
        </button>
      </div>

      {/* Items List */}
      <div className='bg-white border rounded-lg overflow-hidden'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Service
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Item
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Type
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Qty
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Price
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Total
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {items.map(item => (
              <tr key={item.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {getServiceName(item.orderServiceMappingId)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {item.itemName}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  {item.itemType}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  {item.quantity}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  BD {item.pricePerItem.toFixed(2)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  BD {item.totalPrice.toFixed(2)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                  <button
                    onClick={() => setEditingItem(item)}
                    className='text-blue-600 hover:text-blue-900'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => item.id && handleDeleteItem(item.id)}
                    className='text-red-600 hover:text-red-900'
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Add Order Item
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Service
                  </label>
                  <select
                    value={newItem.orderServiceMappingId}
                    onChange={e =>
                      setNewItem({
                        ...newItem,
                        orderServiceMappingId: parseInt(e.target.value),
                      })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    {orderServiceMappings.map(mapping => (
                      <option key={mapping.id} value={mapping.id}>
                        {mapping.service.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Item Type
                  </label>
                  <select
                    value={newItem.itemType}
                    onChange={e =>
                      setNewItem({ ...newItem, itemType: e.target.value })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    {ITEM_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Item Name
                  </label>
                  <select
                    value={newItem.itemName}
                    onChange={e =>
                      setNewItem({ ...newItem, itemName: e.target.value })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>Select item</option>
                    {COMMON_ITEMS[
                      newItem.itemType as keyof typeof COMMON_ITEMS
                    ]?.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <input
                    type='text'
                    placeholder='Or enter custom item name'
                    value={newItem.itemName}
                    onChange={e =>
                      setNewItem({ ...newItem, itemName: e.target.value })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Quantity
                  </label>
                  <input
                    type='number'
                    min='1'
                    value={newItem.quantity}
                    onChange={e =>
                      setNewItem({
                        ...newItem,
                        quantity: parseInt(e.target.value),
                      })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Price per Item (BD)
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    value={newItem.pricePerItem}
                    onChange={e =>
                      setNewItem({
                        ...newItem,
                        pricePerItem: parseFloat(e.target.value),
                      })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Notes (optional)
                  </label>
                  <textarea
                    value={newItem.notes}
                    onChange={e =>
                      setNewItem({ ...newItem, notes: e.target.value })
                    }
                    rows={2}
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
              <div className='flex justify-end space-x-3 mt-6'>
                <button
                  onClick={() => setShowAddModal(false)}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Edit Order Item
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Service
                  </label>
                  <select
                    value={editingItem.orderServiceMappingId}
                    onChange={e =>
                      setEditingItem({
                        ...editingItem,
                        orderServiceMappingId: parseInt(e.target.value),
                      })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    {orderServiceMappings.map(mapping => (
                      <option key={mapping.id} value={mapping.id}>
                        {mapping.service.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Item Type
                  </label>
                  <select
                    value={editingItem.itemType}
                    onChange={e =>
                      setEditingItem({
                        ...editingItem,
                        itemType: e.target.value,
                      })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    {ITEM_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Item Name
                  </label>
                  <input
                    type='text'
                    value={editingItem.itemName}
                    onChange={e =>
                      setEditingItem({
                        ...editingItem,
                        itemName: e.target.value,
                      })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Quantity
                  </label>
                  <input
                    type='number'
                    min='1'
                    value={editingItem.quantity}
                    onChange={e =>
                      setEditingItem({
                        ...editingItem,
                        quantity: parseInt(e.target.value),
                      })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Price per Item (BD)
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    value={editingItem.pricePerItem}
                    onChange={e =>
                      setEditingItem({
                        ...editingItem,
                        pricePerItem: parseFloat(e.target.value),
                      })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Notes (optional)
                  </label>
                  <textarea
                    value={editingItem.notes || ''}
                    onChange={e =>
                      setEditingItem({ ...editingItem, notes: e.target.value })
                    }
                    rows={2}
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
              <div className='flex justify-end space-x-3 mt-6'>
                <button
                  onClick={() => setEditingItem(null)}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditItem}
                  className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
                >
                  Update Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
