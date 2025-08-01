'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import AdminHeader from '@/components/admin/AdminHeader';
import Link from 'next/link';
import { OrderStatus } from '@prisma/client';
import { useFacilityTeamStore } from '@/admin/stores/facilityTeamStore';
import { useFacilityTeamAuth } from '@/admin/hooks/useAdminAuth';

// Types are now imported from the store

export default function ProcessOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const { user, isLoading: authLoading, isAuthorized } = useFacilityTeamAuth();

  // State for image uploads
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  
  // State for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);

  // Zustand store
  const {
    order,
    servicePricing,
    selectedItemDetail,
    activeTab,
    newItemData,
    itemProcessingData,
    showItemModal,
    showWarningModal,
    showInvoiceWarningModal,
    orderForm,
    processingForm,
    invoiceForm,
    itemForm,
    fetchOrder,
    fetchServicePricing,
    addOrderItem,
    deleteOrderItem,
    updateItemProcessing,
    uploadIssueImages,
    fetchIssueReports,
    startProcessing,
    markAsReadyForDelivery,
    generateInvoice,
    markProcessingCompleted,
    setActiveTab,
    setNewItemData,
    setItemProcessingData,
    selectItemDetail,
    openItemModal,
    closeItemModal,
    setShowWarningModal,
    setShowInvoiceWarningModal,
  } = useFacilityTeamStore();

  const orderId = params.orderId as string;

  // Reset item name when service changes and fetch service pricing
  useEffect(() => {
    setNewItemData({
      itemName: '',
      pricePerItem: 0,
    });

    // Fetch pricing for the selected service
    if (newItemData.orderServiceMappingId && order) {
      const selectedService = order.orderServiceMappings.find(
        (mapping: any) => mapping.id === newItemData.orderServiceMappingId
      );
      if (selectedService) {
        fetchServicePricing(selectedService.service.id);
      }
    }
  }, [
    newItemData.orderServiceMappingId,
    order,
    fetchServicePricing,
    setNewItemData,
  ]);

  useEffect(() => {
    console.log('Order fetch effect:', { authLoading, isAuthorized, orderId });

    // Wait for authentication to be determined
    if (authLoading) {
      console.log('Order fetch: Waiting for auth to load...');
      return;
    }

    // If not authorized, redirect to login
    if (!isAuthorized) {
      console.log('Order fetch: Not authorized, redirecting to login');
      router.push('/admin/login');
      return;
    }

    // If authorized and we have an orderId, fetch the order
    if (orderId && isAuthorized) {
      console.log('Order fetch: Authorized, fetching order:', orderId);
      fetchOrder(orderId);
    }
  }, [authLoading, isAuthorized, router, orderId, fetchOrder]);

  // Show error toast when order fetching fails
  useEffect(() => {
    if (orderForm.error && !orderForm.loading) {
      showToast(`Failed to load order: ${orderForm.error}`, 'error');
    }
  }, [orderForm.error, orderForm.loading, showToast]);

  // Auto-populate price when service or item changes
  useEffect(() => {
    if (
      newItemData.itemName &&
      newItemData.orderServiceMappingId &&
      order &&
      servicePricing
    ) {
      const selectedService = order.orderServiceMappings.find(
        (mapping: any) => mapping.id === newItemData.orderServiceMappingId
      );

      if (selectedService) {
        // Find the pricing item that matches the selected item name
        const pricingItem = servicePricing.categories
          .flatMap((category: any) => category.items)
          .find(
            (item: any) =>
              item.displayName.toLowerCase() ===
                newItemData.itemName.toLowerCase() ||
              item.name.toLowerCase() === newItemData.itemName.toLowerCase()
          );

        if (pricingItem) {
          setNewItemData({
            pricePerItem: pricingItem.price,
          });
        } else {
          // If no exact match found, use the service's default price
          setNewItemData({
            pricePerItem: selectedService.service.price || 0,
          });
        }
      }
    }
  }, [
    newItemData.itemName,
    newItemData.orderServiceMappingId,
    servicePricing,
    order,
    setNewItemData,
  ]);

  const handleAddOrderItem = async (e?: React.MouseEvent) => {
    // Prevent default form submission if this is called from a form
    if (e) {
      e.preventDefault();
    }

    // Prevent duplicate submissions
    if (itemForm.loading) {
      return;
    }

    if (
      !newItemData.itemName ||
      !newItemData.orderServiceMappingId ||
      newItemData.quantity <= 0
    ) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!order?.id) {
      showToast('Order not found', 'error');
      return;
    }

    try {
      const result = await addOrderItem(order.id, newItemData);
      showToast('Item added successfully!', 'success');
      setActiveTab('items');
    } catch (error) {
      showToast('Failed to add item. Please try again.', 'error');
    }
  };

  const handleDeleteOrderItem = async (itemId: number, itemName: string) => {
    if (!order?.id) {
      showToast('Order not found', 'error');
      return;
    }

    // Set item to delete and show confirmation modal
    setItemToDelete({ id: itemId, name: itemName });
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete || !order?.id) {
      return;
    }

    try {
      await deleteOrderItem(order.id, itemToDelete.id);
      showToast('Item deleted successfully!', 'success');
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      showToast('Failed to delete item. Please try again.', 'error');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages((prev: File[]) => [...prev, ...files]);

    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreviewUrls((prev: string[]) => [
          ...prev,
          e.target?.result as string,
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev: File[]) =>
      prev.filter((_: File, i: number) => i !== index)
    );
    setImagePreviewUrls((prev: string[]) =>
      prev.filter((_: string, i: number) => i !== index)
    );
  };

  const convertImagesToBase64 = async (files: File[]): Promise<string[]> => {
    return Promise.all(
      files.map(file => {
        return new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = e => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      })
    );
  };

  const handleUpdateItemProcessing = async () => {
    if (!selectedItemDetail || !order?.id) return;

    try {
      // If status is ISSUE_REPORTED and images are selected, upload them first
      if (
        itemProcessingData.status === 'ISSUE_REPORTED' &&
        selectedImages.length > 0
      ) {
        const base64Images = await convertImagesToBase64(selectedImages);
        await uploadIssueImages(
          selectedItemDetail.id,
          base64Images,
          itemProcessingData.issueType || 'damage',
          itemProcessingData.issueDescription ||
            itemProcessingData.processingNotes ||
            'Issue reported',
          itemProcessingData.issueSeverity || 'medium'
        );
        showToast('Issue report with images uploaded successfully!', 'success');
      } else {
        // Regular update without images
        await updateItemProcessing(
          orderId,
          selectedItemDetail.id,
          itemProcessingData
        );
        showToast('Item processing updated successfully!', 'success');
      }

      // Clear image state
      setSelectedImages([]);
      setImagePreviewUrls([]);
    } catch (error) {
      showToast('Failed to update item processing. Please try again.', 'error');
    }
  };

  // Clear image state when modal is closed
  const handleCloseItemModal = () => {
    closeItemModal();
    setSelectedImages([]);
    setImagePreviewUrls([]);
  };

  const handleGenerateInvoice = async () => {
    // Check if there are items added to the order
    if (!hasOrderItems()) {
      setShowInvoiceWarningModal(true);
      return;
    }

    // Check if invoice is already generated
    if (isInvoiceGenerated()) {
      setShowInvoiceWarningModal(true);
      return;
    }

    if (!order?.id) {
      showToast('Order not found', 'error');
      return;
    }

    try {
      await generateInvoice(order.id);
      showToast('Invoice generated and email sent to customer!', 'success');
    } catch (error) {
      showToast('Failed to generate invoice. Please try again.', 'error');
    }
  };

  const handleMarkAsReadyForDelivery = async () => {
    if (!order?.id) {
      showToast('Order not found', 'error');
      return;
    }

    try {
      await markAsReadyForDelivery(order.id);
      showToast('Order marked as ready for delivery!', 'success');
    } catch (error) {
      showToast(
        'Failed to mark order as ready for delivery. Please try again.',
        'error'
      );
    }
  };

  const startProcessingForItem = async (item: any) => {
    if (!order?.id) {
      showToast('Order not found', 'error');
      return;
    }

    try {
      // First, check if processing has been started for this order
      if (!order?.orderProcessing) {
        await startProcessing(order.id);
      }

      // Now refresh the order data to get the new processing items
      await fetchOrder(orderId);

      // Find the processing detail for this item in the updated order data
      const processingDetail = order?.orderProcessing?.processingItems
        .flatMap((pi: any) => pi.processingItemDetails)
        .find((detail: any) => detail.orderItem.id === item.id);

      if (processingDetail) {
        // Open the modal for the newly created processing detail
        openItemModal(processingDetail);
        // Fetch issue reports for this item
        await fetchIssueReports(processingDetail.id);
      } else {
        showToast(
          'Failed to create processing item for this order item',
          'error'
        );
      }
    } catch (error) {
      showToast(
        'Failed to start processing for item. Please try again.',
        'error'
      );
    }
  };

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
      order.orderProcessing.processingStatus !==
        OrderStatus.READY_FOR_DELIVERY &&
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

  const handleStartProcessingClick = () => {
    if (!hasOrderItems()) {
      setShowWarningModal(true);
    } else {
      if (order?.id) {
        startProcessing(order.id);
      }
    }
  };

  const handleMarkProcessingCompleted = async () => {
    if (!order?.id) {
      showToast('Order not found', 'error');
      return;
    }

    try {
      await markProcessingCompleted(order.id);
      showToast('Processing marked as completed!', 'success');
    } catch (error) {
      showToast(
        'Failed to mark processing as completed. Please try again.',
        'error'
      );
    }
  };

  if (authLoading || orderForm.loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <AdminHeader title='Loading Order...' />
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
              <p className='mt-4 text-gray-600'>
                {authLoading
                  ? 'Checking authentication...'
                  : 'Loading order details...'}
              </p>
              {authLoading && (
                <p className='mt-2 text-sm text-gray-500'>
                  Please wait while we verify your access...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <AdminHeader title='Order Not Found' />
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center py-12'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Order Not Found
            </h2>
            <p className='text-gray-600 mb-6'>
              The requested order could not be found.
            </p>
            <Link
              href='/admin/facility-team'
              className='bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700'
            >
              Back to Facility Team
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <AdminHeader
        title={`Process Order #${order.orderNumber}`}
        subtitle={`Customer: ${order.customer?.firstName || 'Unknown'} ${order.customer?.lastName || 'Customer'}`}
        backUrl='/admin/facility-team'
        rightContent={
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              order.orderProcessing?.processingStatus ===
              OrderStatus.READY_FOR_DELIVERY
                ? 'bg-green-100 text-green-800'
                : order.orderProcessing?.processingStatus ===
                    OrderStatus.QUALITY_CHECK
                  ? 'bg-purple-100 text-purple-800'
                  : order.orderProcessing?.processingStatus === 'IN_PROGRESS'
                    ? 'bg-yellow-100 text-yellow-800'
                    : order.status === OrderStatus.READY_FOR_DELIVERY
                      ? 'bg-green-100 text-green-800'
                      : order.status === OrderStatus.PROCESSING_STARTED
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === OrderStatus.PROCESSING_COMPLETED
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
            }`}
          >
            {order.orderProcessing?.processingStatus ===
            OrderStatus.READY_FOR_DELIVERY
              ? 'Ready for Delivery'
              : order.orderProcessing?.processingStatus ===
                  OrderStatus.QUALITY_CHECK
                ? 'Quality Check'
                : order.orderProcessing?.processingStatus === 'IN_PROGRESS'
                  ? 'In Processing'
                  : order.status}
          </span>
        }
      />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
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
                      Customer Information
                    </h3>
                    <p className='text-sm text-gray-600'>
                      {order.customer?.firstName || 'N/A'}{' '}
                      {order.customer?.lastName || 'N/A'}
                    </p>
                  </div>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <h3 className='font-medium text-gray-900 mb-2'>
                      Order Status
                    </h3>
                    <p className='text-sm text-gray-600'>{order.status}</p>
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
                      : `Processing started by facility team. ${order.orderProcessing.processingItems?.length || 0} service(s) being processed.`}
                  </p>
                  {!order.orderProcessing && (
                    <button
                      onClick={handleStartProcessingClick}
                      disabled={processingForm.loading}
                      className='mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {processingForm.loading
                        ? 'Starting...'
                        : 'Start Processing'}
                    </button>
                  )}
                </div>

                <div className='bg-yellow-50 p-4 rounded-lg'>
                  <h3 className='font-medium text-gray-900 mb-2'>
                    Instructions
                  </h3>
                  <ul className='text-sm text-gray-600 space-y-1'>
                    <li>
                      • Use the <strong>Items</strong> tab to process individual
                      items
                    </li>
                    <li>
                      • Update item status, processed quantity, and quality
                      scores
                    </li>
                    <li>
                      • Use the <strong>Add Item</strong> tab to add new items
                      if needed
                    </li>
                    <li>
                      • Processing is complete when all items are marked as
                      completed
                    </li>
                  </ul>
                </div>

                {/* Invoice Generation Section - Always visible when order has items */}
                {hasOrderItems() && (
                  <div className='bg-blue-50 p-4 rounded-lg'>
                    <h3 className='font-medium text-gray-900 mb-2 flex items-center'>
                      <span>Invoice Management</span>
                      {isInvoiceGenerated() && (
                        <span className='ml-2 text-green-600'>
                          <svg
                            className='w-5 h-5'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </span>
                      )}
                    </h3>
                    {isInvoiceGenerated() ? (
                      <div className='text-sm text-gray-600'>
                        <p className='text-green-700 font-medium'>
                          ✅ Invoice has been generated and sent to customer!
                        </p>
                        <p className='mt-1'>
                          Customer has been notified about the invoice and
                          reminded to maintain account balance.
                        </p>
                        <button
                          onClick={handleGenerateInvoice}
                          disabled={invoiceForm.loading}
                          className='mt-3 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                        >
                          {invoiceForm.loading
                            ? 'Generating...'
                            : '🔄 Regenerate Invoice & Send Email'}
                        </button>
                      </div>
                    ) : (
                      <div className='text-sm text-gray-600'>
                        <p className='text-blue-700 font-medium'>
                          🧾 Generate invoice and notify customer
                        </p>
                        <p className='mt-1'>
                          You can generate the invoice at any time during
                          processing. This will send an email to the customer
                          with invoice details and balance reminder.
                        </p>
                        <button
                          onClick={handleGenerateInvoice}
                          disabled={invoiceForm.loading}
                          className='mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                        >
                          {invoiceForm.loading
                            ? 'Generating...'
                            : 'Generate Invoice & Send Email'}
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
                    {order.orderProcessing.processingStatus ===
                    OrderStatus.READY_FOR_DELIVERY ? (
                      <div className='text-sm text-gray-600'>
                        <p className='text-green-700 font-medium'>
                          ✅ Order marked as ready for delivery!
                        </p>
                        <p className='mt-1'>
                          The driver has been notified and can now pick up this
                          order.
                        </p>
                      </div>
                    ) : order.orderProcessing.processingStatus ===
                      'COMPLETED' ? (
                      <div className='text-sm text-gray-600'>
                        <p className='text-green-700 font-medium'>
                          ✅ Processing completed!
                        </p>
                        <p className='mt-1'>
                          All items have been processed. You can now mark the
                          order as ready for delivery.
                        </p>
                        <button
                          onClick={handleMarkAsReadyForDelivery}
                          disabled={itemForm.loading}
                          className='mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                        >
                          {itemForm.loading
                            ? 'Marking...'
                            : 'Mark as Ready for Delivery'}
                        </button>
                      </div>
                    ) : canMarkProcessingCompleted() ? (
                      <div className='text-sm text-gray-600'>
                        <p className='text-blue-700 font-medium'>
                          🎉 All items have been processed successfully!
                        </p>
                        <p className='mt-1'>
                          Mark processing as completed to proceed to the next
                          step.
                        </p>
                        <button
                          onClick={handleMarkProcessingCompleted}
                          disabled={itemForm.loading}
                          className='mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                        >
                          {itemForm.loading
                            ? 'Marking...'
                            : 'Mark Processing as Completed'}
                        </button>
                      </div>
                    ) : canMarkAsReadyForDelivery() ? (
                      <div className='text-sm text-gray-600'>
                        <p className='text-green-700 font-medium'>
                          🎉 All items have been processed successfully!
                        </p>
                        <p className='mt-1'>
                          Mark this order as ready for delivery to notify the
                          driver for pickup.
                        </p>
                        <button
                          onClick={handleMarkAsReadyForDelivery}
                          disabled={itemForm.loading}
                          className='mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
                        >
                          {itemForm.loading
                            ? 'Marking...'
                            : 'Mark as Ready for Delivery'}
                        </button>
                      </div>
                    ) : (
                      <div className='text-sm text-gray-600'>
                        <p>
                          Complete all items in the <strong>Items</strong> tab
                          to mark this order as ready for delivery.
                        </p>
                        {order.orderProcessing.processingItems && (
                          <div className='mt-2 text-xs text-gray-500'>
                            Progress:{' '}
                            {
                              order.orderProcessing.processingItems
                                .flatMap(pi => pi.processingItemDetails)
                                .filter(d => d.status === 'COMPLETED').length
                            }{' '}
                            /{' '}
                            {
                              order.orderProcessing.processingItems.flatMap(
                                pi => pi.processingItemDetails
                              ).length
                            }{' '}
                            items completed
                          </div>
                        )}
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
                        // Find the processing detail for this item
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
                                {processingDetail &&
                                  getStatusIcon(processingDetail.status)}
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
                                    openItemModal(processingDetail);
                                    await fetchIssueReports(
                                      processingDetail.id
                                    );
                                  } else {
                                    await startProcessingForItem(item);
                                  }
                                }}
                                disabled={itemForm.loading}
                                className='text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                              >
                                {itemForm.loading
                                  ? processingDetail
                                    ? 'Updating...'
                                    : 'Starting...'
                                  : processingDetail
                                    ? 'Update'
                                    : 'Start Processing'}
                              </button>
                              <button
                                onClick={() => handleDeleteOrderItem(item.id, item.itemName)}
                                disabled={itemForm.loading}
                                className='text-red-600 hover:text-red-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                                title='Delete this item'
                              >
                                {itemForm.loading ? 'Deleting...' : 'Delete'}
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
            {activeTab === 'add-item' && (
              <div className='space-y-6'>
                {/* Header Section */}
                <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                        Add New Items
                      </h3>
                      <p className='text-sm text-gray-600'>
                        Add individual items to this order. Select a service and
                        choose from available pricing items.
                      </p>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {order.orderServiceMappings?.length || 0}
                      </div>
                      <div className='text-xs text-gray-500'>
                        Services Available
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Items Section */}
                {hasOrderItems() && (
                  <div className='bg-white border border-gray-200 rounded-lg p-6'>
                    <h4 className='text-md font-medium text-gray-900 mb-4 flex items-center justify-between'>
                      <span>Current Items ({order?.orderServiceMappings?.reduce(
                        (total, mapping) => total + (mapping.orderItems?.length || 0),
                        0
                      ) || 0})</span>
                      <span className='text-sm text-gray-500'>
                        Total: BD {order?.orderServiceMappings?.reduce(
                          (total, mapping) => total + (mapping.orderItems?.reduce(
                            (itemTotal, item) => itemTotal + item.totalPrice,
                            0
                          ) || 0),
                          0
                        ).toFixed(2)}
                      </span>
                    </h4>
                    <div className='space-y-3'>
                      {order.orderServiceMappings.map(mapping => (
                        <div key={mapping.id} className='border rounded-lg p-4'>
                          <h5 className='font-medium text-gray-900 mb-2 text-sm'>
                            {mapping.service.displayName}
                          </h5>
                          <div className='space-y-2'>
                            {mapping.orderItems.map(item => (
                              <div
                                key={item.id}
                                className='flex items-center justify-between p-3 bg-gray-50 rounded-md'
                              >
                                <div className='flex-1'>
                                  <div className='flex items-center space-x-2'>
                                    <span className='font-medium text-sm'>
                                      {item.itemName}
                                    </span>
                                    <span className='text-xs text-gray-500'>
                                      ({item.itemType})
                                    </span>
                                  </div>
                                  <div className='text-xs text-gray-600 mt-1'>
                                    Quantity: {item.quantity} | Price: BD {item.pricePerItem.toFixed(2)} | Total: BD {item.totalPrice.toFixed(2)}
                                  </div>
                                  {item.notes && (
                                    <div className='text-xs text-gray-500 mt-1'>
                                      Notes: {item.notes}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteOrderItem(item.id, item.itemName)}
                                  disabled={itemForm.loading}
                                  className='ml-3 text-red-600 hover:text-red-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 border border-red-200 rounded hover:bg-red-50'
                                  title='Delete this item'
                                >
                                  {itemForm.loading ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Item Selection - Only show if service is selected */}
                {newItemData.orderServiceMappingId > 0 && (
                  <div className='bg-white border border-gray-200 rounded-lg p-6'>
                    <h4 className='text-md font-medium text-gray-900 mb-4'>
                      2. Select Item
                    </h4>

                    {!servicePricing ||
                    servicePricing.serviceId !==
                      order.orderServiceMappings?.find(
                        m => m.id === newItemData.orderServiceMappingId
                      )?.service.id ? (
                      <div className='flex items-center justify-center py-8'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                        <span className='ml-3 text-gray-600'>
                          Loading pricing options...
                        </span>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        {/* Quick Selection Grid */}
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                          {servicePricing.categories.flatMap(category =>
                            category.items.map(item => (
                              <button
                                key={item.id}
                                onClick={() =>
                                  setNewItemData({
                                    ...newItemData,
                                    itemName: item.displayName,
                                    pricePerItem: item.price,
                                  })
                                }
                                className={`p-3 border rounded-lg text-left transition-all duration-200 ${
                                  newItemData.itemName === item.displayName
                                    ? 'border-green-500 bg-green-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                              >
                                <div className='font-medium text-gray-900'>
                                  {item.displayName}
                                </div>
                                <div className='text-sm text-gray-500'>
                                  {category.displayName}
                                </div>
                                <div className='text-lg font-semibold text-green-600 mt-1'>
                                  BD {item.price.toFixed(2)}
                                </div>
                                {item.isDefault && (
                                  <span className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1'>
                                    Default
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>

                        {/* Custom Item Input */}
                        <div className='border-t pt-4'>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Or enter custom item name
                          </label>
                          <input
                            type='text'
                            placeholder='Enter custom item name...'
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
                      </div>
                    )}
                  </div>
                )}

                {/* Item Details - Only show if item is selected */}
                {newItemData.itemName && (
                  <div className='bg-white border border-gray-200 rounded-lg p-6'>
                    <h4 className='text-md font-medium text-gray-900 mb-4'>
                      3. Item Details
                    </h4>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      {/* Quantity and Price */}
                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Quantity
                          </label>
                          <div className='flex items-center space-x-2'>
                            <button
                              onClick={() =>
                                setNewItemData({
                                  ...newItemData,
                                  quantity: Math.max(
                                    1,
                                    newItemData.quantity - 1
                                  ),
                                })
                              }
                              className='w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50'
                            >
                              -
                            </button>
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
                              className='flex-1 px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                            <button
                              onClick={() =>
                                setNewItemData({
                                  ...newItemData,
                                  quantity: newItemData.quantity + 1,
                                })
                              }
                              className='w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50'
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Price per Item (BD)
                          </label>
                          <div className='relative'>
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
                            {newItemData.pricePerItem > 0 && (
                              <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                                <span className='text-xs text-green-600 bg-green-100 px-2 py-1 rounded'>
                                  Set
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Total and Notes */}
                      <div className='space-y-4'>
                        {/* Total Calculation */}
                        {newItemData.quantity > 0 &&
                          newItemData.pricePerItem > 0 && (
                            <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200'>
                              <div className='text-sm text-gray-600 mb-1'>
                                Total Amount
                              </div>
                              <div className='text-2xl font-bold text-green-600'>
                                BD{' '}
                                {(
                                  newItemData.quantity *
                                  newItemData.pricePerItem
                                ).toFixed(2)}
                              </div>
                              <div className='text-xs text-gray-500 mt-1'>
                                {newItemData.quantity} × BD{' '}
                                {newItemData.pricePerItem.toFixed(2)}
                              </div>
                            </div>
                          )}

                        {/* Notes */}
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
                {newItemData.itemName &&
                  newItemData.quantity > 0 &&
                  newItemData.pricePerItem > 0 && (
                    <div className='bg-white border border-gray-200 rounded-lg p-6'>
                      <button
                        onClick={handleAddOrderItem}
                        disabled={itemForm.loading}
                        className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all duration-200 shadow-lg hover:shadow-xl'
                      >
                        {itemForm.loading ? (
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

                {/* Existing Issue Reports */}
                {selectedItemDetail.issueReports &&
                  selectedItemDetail.issueReports.length > 0 && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Existing Issue Reports
                      </label>
                      <div className='space-y-3 max-h-32 overflow-y-auto'>
                        {selectedItemDetail.issueReports.map(
                          (report, index) => (
                            <div
                              key={report.id}
                              className='bg-red-50 border border-red-200 rounded-md p-3'
                            >
                              <div className='flex justify-between items-start'>
                                <div className='flex-1'>
                                  <div className='flex items-center space-x-2 mb-1'>
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        report.severity === 'critical'
                                          ? 'bg-red-100 text-red-800'
                                          : report.severity === 'high'
                                            ? 'bg-orange-100 text-orange-800'
                                            : report.severity === 'medium'
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {report.severity.toUpperCase()}
                                    </span>
                                    <span className='text-xs text-gray-500'>
                                      {report.issueType.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className='text-sm text-gray-700 mb-2'>
                                    {report.description}
                                  </p>
                                  <p className='text-xs text-gray-500'>
                                    Reported by {report.staff.firstName}{' '}
                                    {report.staff.lastName} on{' '}
                                    {new Date(
                                      report.reportedAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              {/* Issue Images */}
                              {report.images && report.images.length > 0 && (
                                <div className='mt-2'>
                                  <p className='text-xs text-gray-600 mb-1'>
                                    Images ({report.images.length}):
                                  </p>
                                  <div className='grid grid-cols-3 gap-1'>
                                    {report.images.map((image, imgIndex) => (
                                      <img
                                        key={imgIndex}
                                        src={image}
                                        alt={`Issue ${index + 1} - Image ${imgIndex + 1}`}
                                        className='w-full h-12 object-cover rounded border'
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
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

                {/* Issue Report Fields - Only show when status is ISSUE_REPORTED */}
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
                        Issue Severity
                      </label>
                      <select
                        value={itemProcessingData.issueSeverity || 'medium'}
                        onChange={e =>
                          setItemProcessingData({
                            ...itemProcessingData,
                            issueSeverity: e.target.value,
                          })
                        }
                        className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value='low'>Low</option>
                        <option value='medium'>Medium</option>
                        <option value='high'>High</option>
                        <option value='critical'>Critical</option>
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
                      <p className='mt-1 text-xs text-gray-500'>
                        You can select multiple images. Images will be stored
                        directly in the database.
                      </p>
                    </div>

                    {/* Image Previews */}
                    {imagePreviewUrls.length > 0 && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Selected Images ({imagePreviewUrls.length})
                        </label>
                        <div className='grid grid-cols-2 gap-2 max-h-40 overflow-y-auto'>
                          {imagePreviewUrls.map((url, index) => (
                            <div key={index} className='relative'>
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className='w-full h-20 object-cover rounded border'
                              />
                              <button
                                type='button'
                                onClick={() => removeImage(index)}
                                className='absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600'
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className='flex justify-end space-x-3 mt-6'>
                <button
                  onClick={handleCloseItemModal}
                  disabled={itemForm.loading}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateItemProcessing}
                  disabled={itemForm.loading}
                  className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {itemForm.loading ? 'Updating...' : 'Update'}
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
                    startProcessing(order.id);
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
                {!hasOrderItems()
                  ? 'No Items Added'
                  : 'Invoice Already Generated'}
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
                        generateInvoice(order.id);
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
                      generateInvoice(order.id);
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-4 text-center'>
                Delete Item
              </h3>
              <div className='text-sm text-gray-600 mb-6'>
                <p className='mb-3'>
                  Are you sure you want to delete <strong>"{itemToDelete.name}"</strong>?
                </p>
                <p className='font-medium text-red-600'>
                  This action cannot be undone.
                </p>
              </div>
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                  }}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300'
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteItem}
                  disabled={itemForm.loading}
                  className='px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {itemForm.loading ? 'Deleting...' : 'Delete Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
