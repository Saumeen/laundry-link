import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FormState } from '@/shared/types';
import type { DriverAssignment, DriverStats } from '@/admin/api/driver';
import { DriverApi } from '@/admin/api/driver';

interface DriverState {
  // Data
  assignments: DriverAssignment[];
  stats: DriverStats | null;

  // UI State
  loading: boolean;
  statsLoading: boolean;

  // Form States
  assignmentForm: FormState;
  photoForm: FormState;
  profileForm: FormState;

  // Actions
  fetchAssignments: () => Promise<void>;
  fetchStats: (period?: string) => Promise<void>;
  updateAssignmentStatus: (
    assignmentId: number,
    status: string,
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  uploadPhoto: (
    assignmentId: number,
    photoData: Record<string, unknown>
  ) => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (profileData: Record<string, unknown>) => Promise<void>;
}

const initialState = {
  assignments: [],
  stats: null,
  loading: false,
  statsLoading: false,
  assignmentForm: { loading: false, error: null, success: false },
  photoForm: { loading: false, error: null, success: false },
  profileForm: { loading: false, error: null, success: false },
};

export const useDriverStore = create<DriverState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchAssignments: async () => {
        set({ loading: true });
        try {
          const response = await DriverApi.getAssignments();
          if (response.success && response.data) {
            set({ assignments: response.data, loading: false });
          } else {
            set({ assignments: [], loading: false });
          }
        } catch (error) {
          console.error('Error fetching assignments:', error);
          set({ assignments: [], loading: false });
        }
      },

      fetchStats: async (period = 'today') => {
        set({ statsLoading: true });
        try {
          const response = await DriverApi.getStats(period);
          if (response.success && response.data) {
            set({ stats: response.data, statsLoading: false });
          } else {
            set({ stats: null, statsLoading: false });
          }
        } catch (error) {
          console.error('Error fetching driver stats:', error);
          set({ stats: null, statsLoading: false });
        }
      },

      updateAssignmentStatus: async (
        assignmentId: number,
        status: string,
        notes?: string
      ) => {
        set(state => ({
          assignmentForm: {
            ...state.assignmentForm,
            loading: true,
            error: null,
          },
        }));
        try {
          const response = await DriverApi.updateAssignmentStatus(
            assignmentId,
            status,
            notes
          );
          if (response.success && response.data) {
            set(state => ({
              assignments: state.assignments.map(assignment =>
                assignment.id === assignmentId ? response.data! : assignment
              ),
              assignmentForm: { loading: false, success: true, error: null },
            }));
            return { success: true };
          } else {
            const errorMessage =
              response.error || 'Failed to update assignment';
            set({
              assignmentForm: {
                loading: false,
                success: false,
                error: errorMessage,
              },
            });
            return { success: false, error: errorMessage };
          }
        } catch (error) {
          console.error('Error updating assignment status:', error);
          const errorMessage = 'An unexpected error occurred.';
          set({
            assignmentForm: {
              loading: false,
              success: false,
              error: errorMessage,
            },
          });
          return { success: false, error: errorMessage };
        }
      },

      uploadPhoto: async (
        assignmentId: number,
        photoData: Record<string, unknown>
      ) => {
        set(state => ({
          photoForm: { ...state.photoForm, loading: true, error: null },
        }));
        try {
          const response = await DriverApi.uploadPhoto(
            assignmentId,
            photoData as {
              photoUrl: string;
              photoType: string;
              description?: string;
            }
          );
          if (response.success) {
            set({ photoForm: { loading: false, success: true, error: null } });
            // Refresh assignments to get updated photos
            get().fetchAssignments();
          } else {
            set({
              photoForm: {
                loading: false,
                success: false,
                error: response.error || 'Failed to upload photo',
              },
            });
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
          set({
            photoForm: {
              loading: false,
              success: false,
              error: 'An unexpected error occurred.',
            },
          });
        }
      },

      fetchProfile: async () => {
        set(state => ({
          profileForm: { ...state.profileForm, loading: true, error: null },
        }));
        try {
          const response = await DriverApi.getProfile();
          if (response.success && response.data) {
            set({
              profileForm: { loading: false, success: true, error: null },
            });
          } else {
            set({
              profileForm: {
                loading: false,
                success: false,
                error: response.error || 'Failed to fetch profile',
              },
            });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          set({
            profileForm: {
              loading: false,
              success: false,
              error: 'An unexpected error occurred.',
            },
          });
        }
      },

      updateProfile: async (profileData: Record<string, unknown>) => {
        set(state => ({
          profileForm: { ...state.profileForm, loading: true, error: null },
        }));
        try {
          const response = await DriverApi.updateProfile(profileData);
          if (response.success && response.data) {
            set({
              profileForm: { loading: false, success: true, error: null },
            });
          } else {
            set({
              profileForm: {
                loading: false,
                success: false,
                error: response.error || 'Failed to update profile',
              },
            });
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          set({
            profileForm: {
              loading: false,
              success: false,
              error: 'An unexpected error occurred.',
            },
          });
        }
      },
    }),
    { name: 'driver-store' }
  )
);
