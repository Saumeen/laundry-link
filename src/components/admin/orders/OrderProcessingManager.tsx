'use client';

import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { OrderStatus, ProcessingStatus, ItemStatus } from '@prisma/client';

// Types
interface OrderItem {
  id: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
  notes?: string;
}

interface ProcessingItemDetail {
  id: number;
  quantity: number;
  processedQuantity: number;
  status: string;
  processingNotes?: string;
  qualityScore?: number;
  orderItem: OrderItem;
  issueReports?: Array<{
    id: number;
    issueType: string;
    description: string;
    severity: string;
    status: string;
    images: string[];
    reportedAt: string;
    staff: {
      firstName: string;
      lastName: string;
    };
  }>;
}

interface Service {
  id: number;
  name: string;
  displayName: string;
  pricingType: string;
  pricingUnit: string;
  price: number;
}

interface OrderServiceMapping {
  id: number;
  quantity: number;
  service: Service;
  orderItems: OrderItem[];
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  invoiceGenerated?: boolean;
  orderServiceMappings: OrderServiceMapping[];
  orderProcessing?: {
    id: number;
    processingStatus: string;
    totalPieces?: number;
    totalWeight?: number;
    processingNotes?: string;
    qualityScore?: number;
    processingItems: Array<{
      id: number;
      quantity: number;
      status: string;
      orderServiceMapping: {
        service: Service;
        orderItems: OrderItem[];
      };
      processingItemDetails: ProcessingItemDetail[];
    }>;
  };
}

interface OrderProcessingManagerProps {
  order: Order;
  onRefresh: () => void;
  isSuperAdmin?: boolean;
  onAddOrderItem?: (orderId: number, itemData: any) => Promise<void>;
  onUpdateItemProcessing?: (orderId: string, processingItemDetailId: number, data: any) => Promise<void>;
  onStartProcessing?: (orderId: number) => Promise<void>;
  onMarkAsReadyForDelivery?: (orderId: number) => Promise<void>;
  onGenerateInvoice?: (orderId: number) => Promise<void>;
  onMarkProcessingCompleted?: (orderId: number) => Promise<void>;
  onUploadIssueImages?: (processingItemDetailId: number, images: string[], issueType: string, description: string, severity: string) => Promise<void>;
  onFetchIssueReports?: (processingItemDetailId: number) => Promise<void>;
  loading?: boolean;
}

export default function OrderProcessingManager({
  order,
  onRefresh,
  isSuperAdmin = false,
  onAddOrderItem,
  onUpdateItemProcessing,
  onStartProcessing,
  onMarkAsReadyForDelivery,
  onGenerateInvoice,
  onMarkProcessingCompleted,
  onUploadIssueImages,
  onFetchIssueReports,
  loading = false
}: OrderProcessingManagerProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'add-item'>('overview');
  const [selectedItemDetail, setSelectedItemDetail] = useState<ProcessingItemDetail | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showInvoiceWarningModal, setShowInvoiceWarningModal] = useState(false);
  
  // State for image uploads
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Form data
  const [newItemData, setNewItemData] = useState({
    orderServiceMappingId: order?.orderServiceMappings?.[0]?.id || 0,
    itemName: '',
    itemType: 'clothing',
    quantity: 1,
    pricePerItem: 0,
    notes: '',
  });

  const [itemProcessingData, setItemProcessingData] = useState({
    processedQuantity: '',
    status: 'PENDING',
    processingNotes: '',
    qualityScore: '',
    issueType: 'damage',
    issueDescription: '',
    issueSeverity: 'medium',
  });

  const [formLoading, setFormLoading] = useState(false);

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'IN_PROGRESS':
        return <Clock className='w-4 h-4 text-blue-600' />;
      case 'ISSUE_REPORTED':
        return <AlertCircle className='w-4 h-4 text-red-600' />;
      default:
        return <Clock className='w-4 h-4 text-gray-400' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'ISSUE_REPORTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isAllItemsCompleted = () => {
    if (!order?.orderProcessing?.processingItems) return false;
    return order.orderProcessing.processingItems.every(processingItem =>
      processingItem.processingItemDetails.every(
        detail => detail.status === 'COMPLETED'
      )
    );
  };

  const canMarkAsReadyForDelivery = () => {
    return (
      order?.orderProcessing &&
      order.orderProcessing.processingStatus !== OrderStatus.READY_FOR_DELIVERY &&
      isAllItemsCompleted()
    );
  };

  const hasOrderItems = () => {
    if (!order?.orderServiceMappings) return false;
    return order.orderServiceMappings.some(
      mapping => mapping.orderItems && mapping.orderItems.length > 0
    );
  };

  const isInvoiceGenerated = () => {
    return order?.invoiceGenerated === true;
  };

  const canMarkProcessingCompleted = () => {
    return (
      order?.orderProcessing &&
      order.orderProcessing.processingStatus === 'IN_PROGRESS' &&
      isAllItemsCompleted()
    );
  };

  // Event handlers
  const handleAddOrderItem = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (formLoading || !onAddOrderItem) return;

    if (!newItemData.itemName || !newItemData.orderServiceMappingId || newItemData.quantity <= 0) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!order?.id) {
      showToast('Order not found', 'error');
      return;
    }

    setFormLoading(true);
    try {
      await onAddOrderItem(order.id, newItemData);
      showToast('Item added successfully!', 'success');
      setActiveTab('items');
      onRefresh();
    } catch (error) {
      showToast('Failed to add item. Please try again.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const convertImagesToBase64 = async (files: File[]): Promise<string[]> => {
    return Promise.all(
      files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      })
    );
  };

  const handleUpdateItemProcessing = async () => {
    if (!selectedItemDetail || !order?.id || !onUpdateItemProcessing) return;

    setFormLoading(true);
    try {
      if (itemProcessingData.status === 'ISSUE_REPORTED' && selectedImages.length > 0 && onUploadIssueImages) {
        const base64Images = await convertImagesToBase64(selectedImages);
        await onUploadIssueImages(
          selectedItemDetail.id,
          base64Images,
          itemProcessingData.issueType || 'damage',
          itemProcessingData.issueDescription || itemProcessingData.processingNotes || 'Issue reported',
          itemProcessingData.issueSeverity || 'medium'
        );
        showToast('Issue report with images uploaded successfully!', 'success');
      } else if (onUpdateItemProcessing) {
        await onUpdateItemProcessing(
          order.id.toString(),
          selectedItemDetail.id,
          itemProcessingData
        );
        showToast('Item processing updated successfully!', 'success');
      }
      
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setShowItemModal(false);
      onRefresh();
    } catch (error) {
      showToast('Failed to update item processing. Please try again.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseItemModal = () => {
    setShowItemModal(false);
    setSelectedImages([]);
    setImagePreviewUrls([]);
  };

  const handleGenerateInvoice = async () => {
    if (!hasOrderItems()) {
      setShowInvoiceWarningModal(true);
      return;
    }

    if (isInvoiceGenerated()) {
      setShowInvoiceWarningModal(true);
      return;
    }

    if (!order?.id || !onGenerateInvoice) {
      showToast('Order not found', 'error');
      return;
    }

    setFormLoading(true);
    try {
      await onGenerateInvoice(order.id);
      showToast('Invoice generated and email sent to customer!', 'success');
      onRefresh();
    } catch (error) {
      showToast('Failed to generate invoice. Please try again.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleMarkAsReadyForDelivery = async () => {
    if (!order?.id || !onMarkAsReadyForDelivery) {
      showToast('Order not found', 'error');
      return;
    }

    setFormLoading(true);
    try {
      await onMarkAsReadyForDelivery(order.id);
      showToast('Order marked as ready for delivery!', 'success');
      onRefresh();
    } catch (error) {
      showToast('Failed to mark order as ready for delivery. Please try again.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const startProcessingForItem = async (item: OrderItem) => {
    if (!order?.id || !onStartProcessing) {
      showToast('Order not found', 'error');
      return;
    }

    setFormLoading(true);
    try {
      if (!order?.orderProcessing) {
        await onStartProcessing(order.id);
      }

      await onRefresh();

      const processingDetail = order?.orderProcessing?.processingItems
        .flatMap((pi: any) => pi.processingItemDetails)
        .find((detail: any) => detail.orderItem.id === item.id);

      if (processingDetail) {
        setSelectedItemDetail(processingDetail);
        setShowItemModal(true);
        if (onFetchIssueReports) {
          await onFetchIssueReports(processingDetail.id);
        }
      } else {
        showToast('Failed to create processing item for this order item', 'error');
      }
    } catch (error) {
      showToast('Failed to start processing for item. Please try again.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStartProcessingClick = () => {
    if (!hasOrderItems()) {
      setShowWarningModal(true);
    } else if (order?.id && onStartProcessing) {
      onStartProcessing(order.id);
    }
  };

  const handleMarkProcessingCompleted = async () => {
    if (!order?.id || !onMarkProcessingCompleted) {
      showToast('Order not found', 'error');
      return;
    }

    setFormLoading(true);
    try {
      await onMarkProcessingCompleted(order.id);
      showToast('Processing marked as completed!', 'success');
      onRefresh();
    } catch (error) {
      showToast('Failed to mark processing as completed. Please try again.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading order processing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Tabs */}
      <div className='bg-white rounded-lg shadow mb-6'>
        <div className='border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8 px-6'>
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'items'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Items (
              {order?.orderServiceMappings?.reduce(
                (total, mapping) => total + (mapping.orderItems?.length || 0),
                0
              ) || 0}
              )
            </button>
            <button
              onClick={() => setActiveTab('add-item')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'add-item'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Add Item
            </button>
          </nav>
        </div>

        <div className='p-6'>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <h3 className='font-medium text-gray-900 mb-2'>
                    Order Status
                  </h3>
                  <p className='text-sm text-gray-600'>{order.status}</p>
                </div>
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <h3 className='font-medium text-gray-900 mb-2'>
                    Processing Status
                  </h3>
                  <p className='text-sm text-gray-600'>
                    {order.orderProcessing?.processingStatus || 'Not Started'}
                  </p>
                </div>
              </div>

              <div className='bg-blue-50 p-4 rounded-lg'>
                <h3 className='font-medium text-gray-900 mb-2'>
                  Processing Summary
                </h3>
                <p className='text-sm text-gray-600'>
                  {!order.orderProcessing
                    ? hasOrderItems()
                      ? 'Processing has not started yet. Use the Items tab to begin processing individual items.'
                      : 'No items are added to this order. Please add items using the Add Item tab before starting processing.'
                    : `Processing started. ${order.orderProcessing.processingItems?.length || 0} service(s) being processed.`}
                </p>
                {!order.orderProcessing && (
                  <button
                    onClick={handleStartProcessingClick}
                    disabled={formLoading}
                    className='mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {formLoading ? 'Starting...' : 'Start Processing'}
                  </button>
                )}
              </div>

              {/* Invoice Generation Section */}
              {hasOrderItems() && (
                <div className='bg-blue-50 p-4 rounded-lg'>
                  <h3 className='font-medium text-gray-900 mb-2 flex items-center'>
                    <span>Invoice Management</span>
                    {isInvoiceGenerated() && (
                      <span className='ml-2 text-green-600'>
                        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                        </svg>
                      </span>
                    )}
                  </h3>
                  {isInvoiceGenerated() ? (
                    <div className='text-sm text-gray-600'>
                      <p className='text-green-700 font-medium'>
                        ✅ Invoice has been generated and sent to customer!
                      </p>
                      <button
                        onClick={handleGenerateInvoice}
                        disabled={formLoading}
                        className='mt-3 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                      >
                        {formLoading ? 'Generating...' : '🔄 Regenerate Invoice & Send Email'}
                      </button>
                    </div>
                  ) : (
                    <div className='text-sm text-gray-600'>
                      <p className='text-blue-700 font-medium'>
                        🧾 Generate invoice and notify customer
                      </p>
                      <button
                        onClick={handleGenerateInvoice}
                        disabled={formLoading}
                        className='mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                      >
                        {formLoading ? 'Generating...' : 'Generate Invoice & Send Email'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Completion Section */}
              {order.orderProcessing && (
                <div className='bg-green-50 p-4 rounded-lg'>
                  <h3 className='font-medium text-gray-900 mb-2'>
                    Order Completion
                  </h3>
                  {order.orderProcessing.processingStatus === OrderStatus.READY_FOR_DELIVERY ? (
                    <div className='text-sm text-gray-600'>
                      <p className='text-green-700 font-medium'>
                        ✅ Order marked as ready for delivery!
                      </p>
                    </div>
                  ) : canMarkAsReadyForDelivery() ? (
                    <div className='text-sm text-gray-600'>
                      <p className='text-green-700 font-medium'>
                        🎉 All items have been processed successfully!
                      </p>
                      <button
                        onClick={handleMarkAsReadyForDelivery}
                        disabled={formLoading}
                        className='mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                      >
                        {formLoading ? 'Marking...' : 'Mark as Ready for Delivery'}
                      </button>
                    </div>
                  ) : canMarkProcessingCompleted() ? (
                    <div className='text-sm text-gray-600'>
                      <p className='text-blue-700 font-medium'>
                        🎉 All items have been processed successfully!
                      </p>
                      <button
                        onClick={handleMarkProcessingCompleted}
                        disabled={formLoading}
                        className='mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                      >
                        {formLoading ? 'Marking...' : 'Mark Processing as Completed'}
                      </button>
                    </div>
                  ) : (
                    <div className='text-sm text-gray-600'>
                      <p>
                        Complete all items in the <strong>Items</strong> tab
                        to mark this order as ready for delivery.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className='space-y-6'>
              {order.orderServiceMappings.map(mapping => (
                <div key={mapping.id} className='border rounded-lg p-4'>
                  <h4 className='font-medium text-gray-900 mb-3'>
                    {mapping.service.displayName}
                  </h4>
                  <div className='space-y-3'>
                    {mapping.orderItems.map(item => {
                      const processingDetail =
                        order.orderProcessing?.processingItems
                          .flatMap(pi => pi.processingItemDetails)
                          .find(detail => detail.orderItem.id === item.id);

                      return (
                        <div
                          key={item.id}
                          className='flex items-center justify-between p-4 bg-gray-50 rounded-md'
                        >
                          <div className='flex-1'>
                            <div className='flex items-center space-x-2'>
                              {processingDetail && getStatusIcon(processingDetail.status)}
                              <span className='font-medium'>
                                {item.itemName}
                              </span>
                              <span className='text-sm text-gray-500'>
                                ({item.itemType})
                              </span>
                            </div>
                            <div className='text-sm text-gray-600 mt-1'>
                              Quantity: {item.quantity} | Price: BD{' '}
                              {item.pricePerItem.toFixed(2)} | Total: BD{' '}
                              {item.totalPrice.toFixed(2)}
                            </div>
                            {item.notes && (
                              <div className='text-sm text-gray-500 mt-1'>
                                Notes: {item.notes}
                              </div>
                            )}
                            {processingDetail && (
                              <div className='text-sm text-gray-600 mt-1'>
                                Processed:{' '}
                                {processingDetail.processedQuantity}/
                                {item.quantity}
                                {processingDetail.qualityScore &&
                                  ` | Quality: ${processingDetail.qualityScore}/10`}
                              </div>
                            )}
                          </div>
                          <div className='flex items-center space-x-3'>
                            {processingDetail && (
                              <span
                                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(processingDetail.status)}`}
                              >
                                {processingDetail.status.replace('_', ' ')}
                              </span>
                            )}
                            <button
                              onClick={async () => {
                                if (processingDetail) {
                                  setSelectedItemDetail(processingDetail);
                                  setShowItemModal(true);
                                  if (onFetchIssueReports) {
                                    await onFetchIssueReports(processingDetail.id);
                                  }
                                } else {
                                  await startProcessingForItem(item);
                                }
                              }}
                              disabled={formLoading}
                              className='text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              {formLoading
                                ? processingDetail
                                  ? 'Updating...'
                                  : 'Starting...'
                                : processingDetail
                                  ? 'Update'
                                  : 'Start Processing'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Item Tab */}
          {activeTab === 'add-item' && onAddOrderItem && (
            <div className='space-y-6'>
              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200'>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  Add New Items
                </h3>
                <p className='text-sm text-gray-600'>
                  Add individual items to this order. Select a service and choose from available pricing items.
                </p>
              </div>

              {/* Service Selection */}
              <div className='bg-white border border-gray-200 rounded-lg p-6'>
                <h4 className='text-md font-medium text-gray-900 mb-4'>
                  1. Select Service
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {order.orderServiceMappings?.map(mapping => (
                    <button
                      key={mapping.id}
                      onClick={() =>
                        setNewItemData({
                          ...newItemData,
                          orderServiceMappingId: mapping.id,
                        })
                      }
                      className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                        newItemData.orderServiceMappingId === mapping.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className='font-medium text-gray-900'>
                        {mapping.service.displayName}
                      </div>
                      <div className='text-sm text-gray-500 mt-1'>
                        {mapping.service.pricingType}{' '}
                        {mapping.service.pricingUnit &&
                          `(${mapping.service.pricingUnit})`}
                      </div>
                      <div className='text-sm text-blue-600 mt-1'>
                        Base Price: BD {mapping.service.price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Item Details */}
              {newItemData.orderServiceMappingId > 0 && (
                <div className='bg-white border border-gray-200 rounded-lg p-6'>
                  <h4 className='text-md font-medium text-gray-900 mb-4'>
                    2. Item Details
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Item Name
                        </label>
                        <input
                          type='text'
                          value={newItemData.itemName}
                          onChange={e =>
                            setNewItemData({
                              ...newItemData,
                              itemName: e.target.value,
                            })
                          }
                          className='block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Quantity
                        </label>
                        <input
                          type='number'
                          min='1'
                          value={newItemData.quantity}
                          onChange={e =>
                            setNewItemData({
                              ...newItemData,
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          className='block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Price per Item (BD)
                        </label>
                        <input
                          type='number'
                          step='0.01'
                          min='0'
                          value={newItemData.pricePerItem}
                          onChange={e =>
                            setNewItemData({
                              ...newItemData,
                              pricePerItem: parseFloat(e.target.value) || 0,
                            })
                          }
                          className='block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                      </div>
                    </div>
                    <div className='space-y-4'>
                      {newItemData.quantity > 0 && newItemData.pricePerItem > 0 && (
                        <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200'>
                          <div className='text-sm text-gray-600 mb-1'>
                            Total Amount
                          </div>
                          <div className='text-2xl font-bold text-green-600'>
                            BD {(newItemData.quantity * newItemData.pricePerItem).toFixed(2)}
                          </div>
                        </div>
                      )}
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Notes (optional)
                        </label>
                        <textarea
                          value={newItemData.notes}
                          onChange={e =>
                            setNewItemData({
                              ...newItemData,
                              notes: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder='Any special instructions for this item...'
                          className='block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Button */}
              {newItemData.itemName && newItemData.quantity > 0 && newItemData.pricePerItem > 0 && (
                <div className='bg-white border border-gray-200 rounded-lg p-6'>
                  <button
                    onClick={handleAddOrderItem}
                    disabled={formLoading}
                    className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all duration-200 shadow-lg hover:shadow-xl'
                  >
                    {formLoading ? (
                      <div className='flex items-center justify-center'>
                        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                        Adding Item...
                      </div>
                    ) : (
                      <div className='flex items-center justify-center'>
                        <Plus className='w-5 h-5 mr-2' />
                        Add Item to Order
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Item Processing Modal */}
      {showItemModal && selectedItemDetail && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Update Item Processing
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Item
                  </label>
                  <p className='mt-1 text-sm text-gray-900'>
                    {selectedItemDetail.orderItem.itemName}
                  </p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Processed Quantity
                  </label>
                  <input
                    type='number'
                    min='0'
                    max={selectedItemDetail.quantity}
                    value={itemProcessingData.processedQuantity}
                    onChange={e =>
                      setItemProcessingData({
                        ...itemProcessingData,
                        processedQuantity: e.target.value,
                      })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                  <p className='mt-1 text-xs text-gray-500'>
                    Total: {selectedItemDetail.quantity}
                  </p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Status
                  </label>
                  <select
                    value={itemProcessingData.status}
                    onChange={e =>
                      setItemProcessingData({
                        ...itemProcessingData,
                        status: e.target.value,
                      })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='PENDING'>Pending</option>
                    <option value='IN_PROGRESS'>In Progress</option>
                    <option value='COMPLETED'>Completed</option>
                    <option value='ISSUE_REPORTED'>Issue Reported</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Processing Notes
                  </label>
                  <textarea
                    value={itemProcessingData.processingNotes}
                    onChange={e =>
                      setItemProcessingData({
                        ...itemProcessingData,
                        processingNotes: e.target.value,
                      })
                    }
                    rows={2}
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Quality Score (1-10)
                  </label>
                  <input
                    type='number'
                    min='1'
                    max='10'
                    value={itemProcessingData.qualityScore}
                    onChange={e =>
                      setItemProcessingData({
                        ...itemProcessingData,
                        qualityScore: e.target.value,
                      })
                    }
                    className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                {/* Issue Report Fields */}
                {itemProcessingData.status === 'ISSUE_REPORTED' && (
                  <>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Issue Type
                      </label>
                      <select
                        value={itemProcessingData.issueType || 'damage'}
                        onChange={e =>
                          setItemProcessingData({
                            ...itemProcessingData,
                            issueType: e.target.value,
                          })
                        }
                        className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value='damage'>Damage</option>
                        <option value='stain'>Stain</option>
                        <option value='missing_item'>Missing Item</option>
                        <option value='wrong_item'>Wrong Item</option>
                        <option value='other'>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Issue Description
                      </label>
                      <textarea
                        value={itemProcessingData.issueDescription || ''}
                        onChange={e =>
                          setItemProcessingData({
                            ...itemProcessingData,
                            issueDescription: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder='Describe the issue in detail...'
                        className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Upload Issue Images
                      </label>
                      <input
                        type='file'
                        multiple
                        accept='image/*'
                        onChange={handleImageUpload}
                        className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  </>
                )}
              </div>
              <div className='flex justify-end space-x-3 mt-6'>
                <button
                  onClick={handleCloseItemModal}
                  disabled={formLoading}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateItemProcessing}
                  disabled={formLoading}
                  className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {formLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal for No Items */}
      {showWarningModal && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4'>
                <AlertCircle className='h-6 w-6 text-yellow-600' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-4 text-center'>
                No Items Added
              </h3>
              <div className='text-sm text-gray-600 mb-6'>
                <p className='mb-3'>
                  This order doesn&apos;t have any items added yet. Starting
                  processing without items may affect the order workflow.
                </p>
                <p className='font-medium'>
                  Do you want to continue with processing anyway?
                </p>
              </div>
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => setShowWarningModal(false)}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowWarningModal(false);
                    if (order?.id && onStartProcessing) {
                      onStartProcessing(order.id);
                    }
                  }}
                  className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Warning Modal */}
      {showInvoiceWarningModal && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4'>
                <AlertCircle className='h-6 w-6 text-orange-600' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-4 text-center'>
                {!hasOrderItems() ? 'No Items Added' : 'Invoice Already Generated'}
              </h3>
              <div className='text-sm text-gray-600 mb-6'>
                {!hasOrderItems() ? (
                  <div>
                    <p className='mb-3'>
                      This order doesn&apos;t have any items added yet.
                      Generating an invoice without items will result in an
                      empty invoice.
                    </p>
                    <p className='font-medium'>
                      Do you want to add items first or generate an empty
                      invoice?
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className='mb-3'>
                      An invoice has already been generated and sent to the
                      customer for this order.
                    </p>
                    <p className='font-medium'>
                      Do you want to regenerate the invoice and send it again?
                    </p>
                  </div>
                )}
              </div>
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => setShowInvoiceWarningModal(false)}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
                >
                  Cancel
                </button>
                {!hasOrderItems() ? (
                  <>
                    <button
                      onClick={() => {
                        setShowInvoiceWarningModal(false);
                        setActiveTab('add-item');
                      }}
                      className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
                    >
                      Add Items First
                    </button>
                    <button
                      onClick={() => {
                        setShowInvoiceWarningModal(false);
                        if (order?.id && onGenerateInvoice) {
                          onGenerateInvoice(order.id);
                        }
                      }}
                      className='px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700'
                    >
                      Generate Empty Invoice
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowInvoiceWarningModal(false);
                      if (order?.id && onGenerateInvoice) {
                        onGenerateInvoice(order.id);
                      }
                    }}
                    className='px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700'
                  >
                    Regenerate Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 