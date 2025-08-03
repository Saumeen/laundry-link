import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { OrderFilters, FormState } from '@/shared/types';
import type { OrderWithDetails } from '@/admin/api/orders';
import { OrdersApi } from '@/admin/api/orders';
import type { OrderStatus, PaymentStatus } from '@prisma/client';
import logger from '@/lib/logger';

interface OrdersState {
  // Data
  orders: OrderWithDetails[];
  selectedOrder: OrderWithDetails | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;

  // UI State
  loading: boolean;
  filters: OrderFilters;
  showOrderDetails: boolean;

  // Form States
  statusUpdateForm: FormState;
  processingForm: FormState;
  invoiceForm: FormState;

  // Actions
  fetchOrders: (filters?: OrderFilters) => Promise<void>;
  selectOrder: (order: OrderWithDetails | null) => void;
  updateOrderStatus: (orderId: number, status: OrderStatus) => Promise<void>;
  updateProcessingData: (
    orderId: number,
    data: {
      totalPieces: string;
      totalWeight: string;
      processingNotes: string;
    }
  ) => Promise<void>;
  addInvoiceItem: (
    orderId: number,
    item: {
      orderServiceMappingId: number;
      quantity: number;
      unitPrice: number;
      notes: string;
    }
  ) => Promise<void>;
  deleteInvoiceItem: (itemId: number) => Promise<void>;
  updatePaymentStatus: (
    orderId: number,
    paymentStatus: PaymentStatus
  ) => Promise<void>;
  setFilters: (filters: Partial<OrderFilters>) => void;
  resetFilters: () => void;
  toggleOrderDetails: () => void;
}

const initialState = {
  orders: [],
  selectedOrder: null,
  pagination: null,
  loading: false,
  filters: {
    page: 1,
    limit: 10,
    serviceType: 'ALL' as 'EXPRESS' | 'REGULAR' | 'ALL',
  },
  showOrderDetails: false,
  statusUpdateForm: { loading: false, error: null, success: false },
  processingForm: { loading: false, error: null, success: false },
  invoiceForm: { loading: false, error: null, success: false },
};

export const useOrdersStore = create<OrdersState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchOrders: async (filters?: OrderFilters) => {
        set({ loading: true });
        try {
          const currentFilters = { ...get().filters, ...filters };
          const response = await OrdersApi.getOrders(currentFilters);

          if (response.success && response.data) {
            set({
              orders: response.data.data,
              pagination: response.data.pagination,
              filters: currentFilters,
            });
          } else {
            logger.error('Failed to fetch orders:', response.error);
          }
        } catch (error) {
          logger.error('Error fetching orders:', error);
        } finally {
          set({ loading: false });
        }
      },

      selectOrder: order => {
        set({ selectedOrder: order });
      },

      updateOrderStatus: async (orderId, status) => {
        set({
          statusUpdateForm: { loading: true, error: null, success: false },
        });
        try {
          const response = await OrdersApi.updateOrderStatus(orderId, status);

          if (response.success) {
            // Update the order in the list
            set(state => ({
              orders: state.orders.map(order =>
                order.id === orderId ? { ...order, status } : order
              ),
              selectedOrder:
                state.selectedOrder?.id === orderId
                  ? { ...state.selectedOrder, status }
                  : state.selectedOrder,
              statusUpdateForm: { loading: false, error: null, success: true },
            }));
          } else {
            set({
              statusUpdateForm: {
                loading: false,
                error: response.error || 'Failed to update status',
                success: false,
              },
            });
          }
        } catch (error) {
          logger.error('Error updating order status:', error);
          set({
            statusUpdateForm: {
              loading: false,
              error: 'An error occurred',
              success: false,
            },
          });
        }
      },

      updateProcessingData: async (orderId, data) => {
        set({ processingForm: { loading: true, error: null, success: false } });
        try {
          const response = await OrdersApi.updateProcessingData(orderId, data);

          if (response.success) {
            set({
              processingForm: { loading: false, error: null, success: true },
            });
            // Refresh orders to get updated data
            await get().fetchOrders();
          } else {
            set({
              processingForm: {
                loading: false,
                error: response.error || 'Failed to update processing data',
                success: false,
              },
            });
          }
        } catch (error) {
          logger.error('Error updating processing data:', error);
          set({
            processingForm: {
              loading: false,
              error: 'An error occurred',
              success: false,
            },
          });
        }
      },

      addInvoiceItem: async (orderId, item) => {
        set({ invoiceForm: { loading: true, error: null, success: false } });
        try {
          const response = await OrdersApi.addInvoiceItem(orderId, item);

          if (response.success) {
            set({
              invoiceForm: { loading: false, error: null, success: true },
            });
            // Refresh orders to get updated data
            await get().fetchOrders();
          } else {
            set({
              invoiceForm: {
                loading: false,
                error: response.error || 'Failed to add invoice item',
                success: false,
              },
            });
          }
        } catch (error) {
          logger.error('Error adding invoice item:', error);
          set({
            invoiceForm: {
              loading: false,
              error: 'An error occurred',
              success: false,
            },
          });
        }
      },

      deleteInvoiceItem: async itemId => {
        try {
          const response = await OrdersApi.deleteInvoiceItem(itemId);

          if (response.success) {
            // Refresh orders to get updated data
            await get().fetchOrders();
          }
        } catch (error) {
          logger.error('Error deleting invoice item:', error);
        }
      },

      updatePaymentStatus: async (orderId, paymentStatus) => {
        try {
          const response = await OrdersApi.updatePaymentStatus(
            orderId,
            paymentStatus
          );

          if (response.success) {
            // Update the order in the list
            set(state => ({
              orders: state.orders.map(order =>
                order.id === orderId ? { ...order, paymentStatus } : order
              ),
              selectedOrder:
                state.selectedOrder?.id === orderId
                  ? { ...state.selectedOrder, paymentStatus }
                  : state.selectedOrder,
            }));
          }
        } catch (error) {
          logger.error('Error updating payment status:', error);
        }
      },

      setFilters: filters => {
        set(state => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      resetFilters: () => {
        set({ filters: { page: 1, limit: 10, serviceType: 'ALL' } });
      },

      toggleOrderDetails: () => {
        set(state => ({ showOrderDetails: !state.showOrderDetails }));
      },
    }),
    {
      name: 'orders-store',
    }
  )
);
