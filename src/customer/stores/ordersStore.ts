import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { OrderFilters, FormState } from '@/shared/types/customer';
import type { OrderWithDetails } from '@/shared/types/customer';
import { OrdersApi } from '@/customer/api/orders';
import type { OrderStatus } from '@prisma/client';

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
  createOrderForm: FormState;
  cancelOrderForm: FormState;

  // Actions
  fetchOrders: (filters?: OrderFilters) => Promise<void>;
  selectOrder: (order: OrderWithDetails | null) => void;
  createOrder: (orderData: any) => Promise<void>;
  cancelOrder: (orderId: number) => Promise<void>;
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
  },
  showOrderDetails: false,
  createOrderForm: { loading: false, error: null, success: false },
  cancelOrderForm: { loading: false, error: null, success: false },
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

          if (response.success && response.data && 'orders' in response.data) {
            const data = response.data;
            set({
              orders: data.orders,
              pagination: {
                page: currentFilters.page ?? 1,
                limit: currentFilters.limit ?? 10,
                total: data.total,
                totalPages: Math.ceil(data.total / (currentFilters.limit ?? 10)),
              },
              filters: currentFilters,
            });
          } else {
            console.error('Failed to fetch orders:', response.error);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          set({ loading: false });
        }
      },

      selectOrder: (order: OrderWithDetails | null) => {
        set({ selectedOrder: order });
      },

      createOrder: async (orderData: any) => {
        set((state) => ({
          createOrderForm: { ...state.createOrderForm, loading: true, error: null, success: false }
        }));

        try {
          const response = await OrdersApi.createOrder(orderData);

          if (response.success && response.data && 'order' in response.data) {
            const data = response.data;
            set((state) => ({
              createOrderForm: { loading: false, error: null, success: true },
              orders: [data.order, ...state.orders],
            }));
          } else {
            set((state) => ({
              createOrderForm: { ...state.createOrderForm, loading: false, error: response.error || 'Failed to create order' }
            }));
          }
        } catch (error) {
          console.error('Error creating order:', error);
          set((state) => ({
            createOrderForm: { ...state.createOrderForm, loading: false, error: 'Network error occurred' }
          }));
        }
      },

      cancelOrder: async (orderId: number) => {
        set((state) => ({
          cancelOrderForm: { ...state.cancelOrderForm, loading: true, error: null, success: false }
        }));

        try {
          const response = await OrdersApi.cancelOrder(orderId);

          if (response.success) {
            set((state) => ({
              cancelOrderForm: { loading: false, error: null, success: true },
              orders: state.orders.map(order => 
                order.id === orderId 
                  ? { ...order, status: 'CANCELLED' as OrderStatus }
                  : order
              ),
              selectedOrder: state.selectedOrder?.id === orderId 
                ? { ...state.selectedOrder, status: 'CANCELLED' as OrderStatus }
                : state.selectedOrder,
            }));
          } else {
            set((state) => ({
              cancelOrderForm: { ...state.cancelOrderForm, loading: false, error: response.error || 'Failed to cancel order' }
            }));
          }
        } catch (error) {
          console.error('Error canceling order:', error);
          set((state) => ({
            cancelOrderForm: { ...state.cancelOrderForm, loading: false, error: 'Network error occurred' }
          }));
        }
      },

      setFilters: (filters: Partial<OrderFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters }
        }));
      },

      resetFilters: () => {
        set({ filters: initialState.filters });
      },

      toggleOrderDetails: () => {
        set((state) => ({ showOrderDetails: !state.showOrderDetails }));
      },
    }),
    {
      name: 'customer-orders-store',
    }
  )
); 