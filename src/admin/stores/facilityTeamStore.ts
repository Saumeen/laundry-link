import type { FormState } from '@/shared/types';
import { OrderStatus } from '@prisma/client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types for the facility team store
export interface OrderItem {
  id: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
  notes?: string;
}

export interface ProcessingItemDetail {
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

export interface Service {
  id: number;
  name: string;
  displayName: string;
  pricingType: string;
  pricingUnit: string;
  price: number;
}

export interface OrderServiceMapping {
  id: number;
  quantity: number;
  service: Service;
  orderItems: OrderItem[];
}

export interface ServicePricing {
  serviceId: number;
  categories: Array<{
    id: number;
    name: string;
    displayName: string;
    items: Array<{
      id: number;
      name: string;
      displayName: string;
      price: number;
      isDefault: boolean;
      sortOrder: number;
    }>;
  }>;
}

export interface Order {
  id: number;
  orderNumber: string;
  customer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
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

export interface NewItemData {
  orderServiceMappingId: number;
  itemName: string;
  itemType: string;
  quantity: number;
  pricePerItem: number;
  notes: string;
}

export interface ItemProcessingData {
  processedQuantity: string;
  status: string;
  processingNotes: string;
  qualityScore: string;
  issueImages?: string[]; // Array of base64 image strings
  issueType?: string;
  issueDescription?: string;
  issueSeverity?: string;
}

export interface FacilityTeamState {
  // Data
  order: Order | null;
  servicePricing: ServicePricing | null;
  selectedItemDetail: ProcessingItemDetail | null;

  // UI State
  loading: boolean;
  activeTab: 'overview' | 'items' | 'add-item';
  showItemModal: boolean;
  showWarningModal: boolean;
  showInvoiceWarningModal: boolean;

  // Form Data
  newItemData: NewItemData;
  itemProcessingData: ItemProcessingData;

  // Form States
  orderForm: FormState;
  processingForm: FormState;
  invoiceForm: FormState;
  itemForm: FormState;

  // Actions
  fetchOrder: (orderId: string) => Promise<void>;
  fetchServicePricing: (serviceId: number) => Promise<void>;
  addOrderItem: (orderId: number, itemData: NewItemData) => Promise<void>;
  updateItemProcessing: (
    orderId: string,
    processingItemDetailId: number,
    data: ItemProcessingData
  ) => Promise<void>;
  uploadIssueImages: (
    processingItemDetailId: number,
    images: string[],
    issueType: string,
    description: string,
    severity: string
  ) => Promise<void>;
  fetchIssueReports: (processingItemDetailId: number) => Promise<void>;
  startProcessing: (orderId: number) => Promise<void>;
  markAsReadyForDelivery: (orderId: number) => Promise<void>;
  generateInvoice: (orderId: number) => Promise<void>;
  markProcessingCompleted: (orderId: number) => Promise<void>;

  // UI Actions
  setActiveTab: (tab: 'overview' | 'items' | 'add-item') => void;
  setNewItemData: (data: Partial<NewItemData>) => void;
  setItemProcessingData: (data: Partial<ItemProcessingData>) => void;
  selectItemDetail: (itemDetail: ProcessingItemDetail | null) => void;
  openItemModal: (itemDetail: ProcessingItemDetail) => void;
  closeItemModal: () => void;
  setShowWarningModal: (show: boolean) => void;
  setShowInvoiceWarningModal: (show: boolean) => void;
  resetForm: () => void;
}

const initialState = {
  order: null,
  servicePricing: null,
  selectedItemDetail: null,
  loading: false,
  activeTab: 'overview' as const,
  showItemModal: false,
  showWarningModal: false,
  showInvoiceWarningModal: false,
  newItemData: {
    orderServiceMappingId: 0,
    itemName: '',
    itemType: 'clothing',
    quantity: 1,
    pricePerItem: 0,
    notes: '',
  },
  itemProcessingData: {
    processedQuantity: '',
    status: 'PENDING',
    processingNotes: '',
    qualityScore: '',
  },
  orderForm: { loading: false, error: null, success: false },
  processingForm: { loading: false, error: null, success: false },
  invoiceForm: { loading: false, error: null, success: false },
  itemForm: { loading: false, error: null, success: false },
};

export const useFacilityTeamStore = create<FacilityTeamState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchOrder: async (orderId: string) => {
        console.log('Store: Fetching order:', orderId);
        set({ orderForm: { loading: true, error: null, success: false } });
        try {
          const response = await fetch(`/api/admin/order-details/${orderId}`);
          console.log('Store: Order fetch response status:', response.status);
          
          if (response.ok) {
            const data = await response.json() as { order: Order };
            console.log('Store: Order fetched successfully:', data.order?.orderNumber);
            set({
              order: data.order,
              orderForm: { loading: false, error: null, success: true },
            });
            
            // Set default service mapping if available
            if (data.order?.orderServiceMappings?.length > 0) {
              set({
                newItemData: {
                  ...get().newItemData,
                  orderServiceMappingId: data.order.orderServiceMappings[0].id,
                },
              });
            }
          } else {
            const errorText = await response.text();
            console.error('Store: Order fetch failed:', response.status, errorText);
            set({
              orderForm: {
                loading: false,
                error: 'Failed to fetch order details',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Store: Error fetching order:', error);
          set({
            orderForm: {
              loading: false,
              error: 'An error occurred while fetching order',
              success: false,
            },
          });
        }
      },

      fetchServicePricing: async (serviceId: number) => {
        try {
          const response = await fetch(
            `/api/admin/service-pricing?serviceId=${serviceId}`
          );
          if (response.ok) {
            const data = await response.json() as { data: ServicePricing | null };
            set({ servicePricing: data.data || null });
          }
        } catch (error) {
          console.error('Error fetching service pricing:', error);
        }
      },

      addOrderItem: async (orderId: number, itemData: NewItemData) => {
        set({ itemForm: { loading: true, error: null, success: false } });
        try {
          const response = await fetch('/api/admin/add-order-item', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              ...itemData,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            set({
              itemForm: { loading: false, error: null, success: true },
            });
            
            // Refresh order data
            await get().fetchOrder(orderId.toString());
            
            // Reset form
            set({
              newItemData: {
                orderServiceMappingId: get().order?.orderServiceMappings[0]?.id || 0,
                itemName: '',
                itemType: 'clothing',
                quantity: 1,
                pricePerItem: 0,
                notes: '',
              },
            });
            
            return result;
          } else {
            const errorData = await response.json() as { error?: string };
            set({
              itemForm: {
                loading: false,
                error: errorData.error || 'Failed to add item',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error adding order item:', error);
          set({
            itemForm: {
              loading: false,
              error: 'An error occurred while adding item',
              success: false,
            },
          });
        }
      },

      updateItemProcessing: async (
        orderId: string,
        processingItemDetailId: number,
        data: ItemProcessingData
      ) => {
        set({ itemForm: { loading: true, error: null, success: false } });
        try {
          const response = await fetch(
            `/api/admin/facility-team/processing?orderId=${orderId}&action=updateItem`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                processingItemDetailId,
                processedQuantity: parseInt(data.processedQuantity) || 0,
                status: data.status,
                processingNotes: data.processingNotes,
                qualityScore: data.qualityScore
                  ? parseInt(data.qualityScore)
                  : undefined,
                updateParentStatus: true,
              }),
            }
          );

          if (response.ok) {
            set({
              itemForm: { loading: false, error: null, success: true },
              showItemModal: false,
            });
            await get().fetchOrder(orderId);
          } else {
            const errorData = await response.json() as { error?: string };
            set({
              itemForm: {
                loading: false,
                error: errorData.error || 'Failed to update item processing',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error updating item processing:', error);
          set({
            itemForm: {
              loading: false,
              error: 'An error occurred while updating item processing',
              success: false,
            },
          });
        }
      },

      uploadIssueImages: async (
        processingItemDetailId: number,
        images: string[],
        issueType: string,
        description: string,
        severity: string
      ) => {
        set({ itemForm: { loading: true, error: null, success: false } });
        try {
          const response = await fetch('/api/admin/facility-team/issue-images', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              processingItemDetailId,
              images,
              issueType,
              description,
              severity,
            }),
          });

          if (response.ok) {
            set({
              itemForm: { loading: false, error: null, success: true },
              showItemModal: false,
            });
            // Refresh the order to get updated data
            const order = get().order;
            if (order) {
              await get().fetchOrder(order.id.toString());
            }
          } else {
            const errorData = await response.json() as { error?: string };
            set({
              itemForm: {
                loading: false,
                error: errorData.error || 'Failed to upload issue images',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error uploading issue images:', error);
          set({
            itemForm: {
              loading: false,
              error: 'An error occurred while uploading issue images',
              success: false,
            },
          });
        }
      },

      fetchIssueReports: async (processingItemDetailId: number) => {
        try {
          const response = await fetch(`/api/admin/facility-team/issue-reports/${processingItemDetailId}`);
          
          if (response.ok) {
            const data = await response.json() as { issueReports: any[] };
            // Update the selected item detail with issue reports
            const currentSelectedItemDetail = get().selectedItemDetail;
            if (currentSelectedItemDetail && currentSelectedItemDetail.id === processingItemDetailId) {
              set({
                selectedItemDetail: {
                  ...currentSelectedItemDetail,
                  issueReports: data.issueReports,
                },
              });
            }
          }
        } catch (error) {
          console.error('Error fetching issue reports:', error);
        }
      },

      startProcessing: async (orderId: number) => {
        set({ processingForm: { loading: true, error: null, success: false } });
        try {
          const response = await fetch('/api/admin/facility-team/processing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              processingStatus: 'IN_PROGRESS',
              totalPieces: 0,
              totalWeight: 0,
              processingNotes: 'Processing started by facility team',
            }),
          });

          if (response.ok) {
            set({
              processingForm: { loading: false, error: null, success: true },
            });
            await get().fetchOrder(orderId.toString());
          } else {
            const errorData = await response.json() as { error?: string };
            set({
              processingForm: {
                loading: false,
                error: errorData.error || 'Failed to start processing',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error starting processing:', error);
          set({
            processingForm: {
              loading: false,
              error: 'An error occurred while starting processing',
              success: false,
            },
          });
        }
      },

      markAsReadyForDelivery: async (orderId: number) => {
        set({ processingForm: { loading: true, error: null, success: false } });
        try {
          const response = await fetch('/api/admin/facility/actions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              action: 'ready_for_delivery',
              notes: 'Order marked as ready for delivery by facility team',
            }),
          });

          if (response.ok) {
            set({
              processingForm: { loading: false, error: null, success: true },
            });
            await get().fetchOrder(orderId.toString());
          } else {
            const errorData = await response.json() as { error?: string };
            set({
              processingForm: {
                loading: false,
                error: errorData.error || 'Failed to mark order as ready for delivery',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error marking order as ready for delivery:', error);
          set({
            processingForm: {
              loading: false,
              error: 'An error occurred while marking order as ready for delivery',
              success: false,
            },
          });
        }
      },

      generateInvoice: async (orderId: number) => {
        set({ invoiceForm: { loading: true, error: null, success: false } });
        try {
          const response = await fetch('/api/admin/facility/actions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              action: 'generate_invoice',
              notes: 'Invoice generated by facility team',
            }),
          });

          if (response.ok) {
            set({
              invoiceForm: { loading: false, error: null, success: true },
              showInvoiceWarningModal: false,
            });
            await get().fetchOrder(orderId.toString());
          } else {
            const errorData = await response.json() as { error?: string };
            set({
              invoiceForm: {
                loading: false,
                error: errorData.error || 'Failed to generate invoice',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error generating invoice:', error);
          set({
            invoiceForm: {
              loading: false,
              error: 'An error occurred while generating invoice',
              success: false,
            },
          });
        }
      },

      markProcessingCompleted: async (orderId: number) => {
        set({ processingForm: { loading: true, error: null, success: false } });
        try {
          const response = await fetch('/api/admin/facility/actions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              action: 'complete_processing',
              notes: 'Processing completed by facility team',
            }),
          });

          if (response.ok) {
            set({
              processingForm: { loading: false, error: null, success: true },
            });
            await get().fetchOrder(orderId.toString());
          } else {
            const errorData = await response.json() as { error?: string };
            set({
              processingForm: {
                loading: false,
                error: errorData.error || 'Failed to mark processing as completed',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error marking processing as completed:', error);
          set({
            processingForm: {
              loading: false,
              error: 'An error occurred while marking processing as completed',
              success: false,
            },
          });
        }
      },

      // UI Actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      setNewItemData: (data) =>
        set({ newItemData: { ...get().newItemData, ...data } }),
      
      setItemProcessingData: (data) =>
        set({ itemProcessingData: { ...get().itemProcessingData, ...data } }),
      
      selectItemDetail: (itemDetail) => set({ selectedItemDetail: itemDetail }),
      
      openItemModal: (itemDetail) => {
        set({
          selectedItemDetail: itemDetail,
          itemProcessingData: {
            processedQuantity: itemDetail.processedQuantity.toString(),
            status: itemDetail.status,
            processingNotes: itemDetail.processingNotes || '',
            qualityScore: itemDetail.qualityScore?.toString() || '',
          },
          showItemModal: true,
        });
      },
      
      closeItemModal: () => set({ showItemModal: false }),
      
      setShowWarningModal: (show) => set({ showWarningModal: show }),
      
      setShowInvoiceWarningModal: (show) => set({ showInvoiceWarningModal: show }),
      
      resetForm: () => set({ ...initialState }),
    }),
    {
      name: 'facility-team-store',
    }
  )
); 