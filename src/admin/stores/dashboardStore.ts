import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DashboardStats, AdminUser, FormState } from '@/shared/types';
import { DashboardApi } from '@/admin/api/dashboard';
import type { DriverStats } from '@/admin/api/driver';
import { DriverApi } from '@/admin/api/driver';

interface DashboardState {
  // Data
  stats: DashboardStats | null;
  currentUser: AdminUser | null;

  // UI State
  loading: boolean;

  // Form States
  statsForm: FormState;
  userForm: FormState;

  // Actions
  fetchSuperAdminStats: () => Promise<void>;
  fetchOperationManagerStats: () => Promise<void>;
  fetchDriverStats: () => Promise<void>;
  fetchFacilityTeamStats: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  resetStats: () => void;
}

const initialState = {
  stats: null,
  currentUser: null,
  loading: false,
  statsForm: { loading: false, error: null, success: false },
  userForm: { loading: false, error: null, success: false },
};

export const useDashboardStore = create<DashboardState>()(
  devtools(
    set => ({
      ...initialState,

      fetchSuperAdminStats: async () => {
        set({
          loading: true,
          statsForm: { loading: true, error: null, success: false },
        });
        try {
          const response = await DashboardApi.getSuperAdminStats();

          if (response.success && response.data) {
            set({
              stats: response.data,
              statsForm: { loading: false, error: null, success: true },
            });
          } else {
            set({
              statsForm: {
                loading: false,
                error: response.error || 'Failed to fetch stats',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error fetching super admin stats:', error);
          set({
            statsForm: {
              loading: false,
              error: 'An error occurred',
              success: false,
            },
          });
        } finally {
          set({ loading: false });
        }
      },

      fetchOperationManagerStats: async () => {
        set({
          loading: true,
          statsForm: { loading: true, error: null, success: false },
        });
        try {
          const response = await DashboardApi.getOperationManagerStats();

          if (response.success && response.data) {
            set({
              stats: response.data,
              statsForm: { loading: false, error: null, success: true },
            });
          } else {
            set({
              statsForm: {
                loading: false,
                error: response.error || 'Failed to fetch stats',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error fetching operation manager stats:', error);
          set({
            statsForm: {
              loading: false,
              error: 'An error occurred',
              success: false,
            },
          });
        } finally {
          set({ loading: false });
        }
      },

      fetchDriverStats: async () => {
        set({
          loading: true,
          statsForm: { loading: true, error: null, success: false },
        });
        try {
          const response = await DriverApi.getStats();

          if (response.success && response.data) {
            // Transform driver stats to match DashboardStats interface
            const driverStats: DashboardStats = {
              totalOrders: 0,
              totalCustomers: 0,
              totalRevenue: 0,
              activeStaff: 0,
              pendingOrders: 0,
              completedOrders: response.data.completedAssignments || 0,
              activeDrivers: 1, // Driver viewing their own stats
            };

            set({
              stats: driverStats,
              statsForm: { loading: false, error: null, success: true },
            });
          } else {
            set({
              statsForm: {
                loading: false,
                error: response.error || 'Failed to fetch driver stats',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error fetching driver stats:', error);
          set({
            statsForm: {
              loading: false,
              error: 'An error occurred',
              success: false,
            },
          });
        } finally {
          set({ loading: false });
        }
      },

      fetchFacilityTeamStats: async () => {
        set({
          loading: true,
          statsForm: { loading: true, error: null, success: false },
        });
        try {
          const response = await DashboardApi.getFacilityTeamStats();

          if (response.success && response.data) {
            // Transform facility team stats to match DashboardStats interface
            const facilityStats: DashboardStats = {
              totalOrders: response.data.totalOrders,
              totalCustomers: 0,
              totalRevenue: 0,
              activeStaff: 0,
              pendingOrders: response.data.pendingOrders,
              completedOrders: response.data.completedOrders,
              activeDrivers: 0,
            };

            set({
              stats: facilityStats,
              statsForm: { loading: false, error: null, success: true },
            });
          } else {
            set({
              statsForm: {
                loading: false,
                error: response.error || 'Failed to fetch facility team stats',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error fetching facility team stats:', error);
          set({
            statsForm: {
              loading: false,
              error: 'An error occurred',
              success: false,
            },
          });
        } finally {
          set({ loading: false });
        }
      },

      fetchCurrentUser: async () => {
        set({ userForm: { loading: true, error: null, success: false } });
        try {
          const response = await DashboardApi.getCurrentAdminUser();

          if (response.success && response.data) {
            set({
              currentUser: response.data,
              userForm: { loading: false, error: null, success: true },
            });
          } else {
            set({
              userForm: {
                loading: false,
                error: response.error || 'Failed to fetch user data',
                success: false,
              },
            });
          }
        } catch (error) {
          console.error('Error fetching current user:', error);
          set({
            userForm: {
              loading: false,
              error: 'An error occurred',
              success: false,
            },
          });
        }
      },

      resetStats: () => {
        set({ stats: null });
      },
    }),
    {
      name: 'dashboard-store',
    }
  )
);
