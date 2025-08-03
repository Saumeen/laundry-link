import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import logger from '@/lib/logger';
import type {
  CustomerProfile,
  UpdateProfileData,
  FormState,
} from '@/shared/types/customer';
import { ProfileApi } from '@/customer/api/profile';

interface ProfileState {
  // Data
  profile: CustomerProfile | null;
  loading: boolean;

  // Form States
  updateProfileForm: FormState;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (profileData: UpdateProfileData) => Promise<void>;
  setProfile: (profile: CustomerProfile) => void;
}

const initialState = {
  profile: null,
  loading: false,
  updateProfileForm: { loading: false, error: null, success: false },
};

export const useProfileStore = create<ProfileState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchProfile: async () => {
        set({ loading: true });
        try {
          const response = await ProfileApi.getProfile();

          if (response.success && response.data) {
            set({
              profile: response.data.customer,
            });
          } else {
            logger.error('Failed to fetch profile:', response.error);
          }
        } catch (error) {
          logger.error('Error fetching profile:', error);
        } finally {
          set({ loading: false });
        }
      },

      updateProfile: async (profileData: UpdateProfileData) => {
        set(state => ({
          updateProfileForm: {
            ...state.updateProfileForm,
            loading: true,
            error: null,
            success: false,
          },
        }));

        try {
          const response = await ProfileApi.updateProfile(profileData);

          if (response.success && response.data) {
            set(state => ({
              profile: response.data.customer,
              updateProfileForm: { loading: false, error: null, success: true },
            }));
          } else {
            set(state => ({
              updateProfileForm: {
                ...state.updateProfileForm,
                loading: false,
                error: response.error || 'Failed to update profile',
              },
            }));
          }
        } catch (error) {
          logger.error('Error updating profile:', error);
          set(state => ({
            updateProfileForm: {
              ...state.updateProfileForm,
              loading: false,
              error: 'Network error occurred',
            },
          }));
        }
      },

      setProfile: (profile: CustomerProfile) => {
        set({ profile });
      },
    }),
    {
      name: 'customer-profile-store',
    }
  )
);
