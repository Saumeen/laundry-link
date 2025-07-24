import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/admin/stores/dashboardStore';

interface UseAdminAuthOptions {
  requiredRole?: string;
  redirectTo?: string;
}

export const useAdminAuth = (options: UseAdminAuthOptions = {}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { currentUser, fetchCurrentUser, userForm } = useDashboardStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { requiredRole, redirectTo = '/admin/login' } = options;

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);

      // Check if session exists
      if (status === 'loading') {
        return;
      }

      if (status === 'unauthenticated') {
        router.push(redirectTo);
        return;
      }

      // Fetch current user data if not already loaded
      if (!currentUser && session) {
        await fetchCurrentUser();
      }

      // Check if user has required role
      if (requiredRole && currentUser) {
        const hasRole =
          currentUser.role.name === requiredRole ||
          currentUser.role.permissions.includes(requiredRole);

        if (!hasRole) {
          router.push('/admin/unauthorized');
          return;
        }
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [
    status,
    session,
    currentUser,
    requiredRole,
    redirectTo,
    router,
    fetchCurrentUser,
  ]);

  const logout = async () => {
    // Clear user data from store
    useDashboardStore.getState().resetStats();

    // Redirect to login
    router.push('/admin/login');
  };

  return {
    session,
    user: currentUser,
    isAuthorized,
    isLoading: isLoading || status === 'loading' || userForm.loading,
    error: userForm.error,
    logout,
  };
};

// Role-specific hooks
export const useSuperAdminAuth = () =>
  useAdminAuth({ requiredRole: 'SUPER_ADMIN' });
export const useOperationManagerAuth = () =>
  useAdminAuth({ requiredRole: 'OPERATION_MANAGER' });
export const useDriverAuth = () => useAdminAuth({ requiredRole: 'DRIVER' });
export const useFacilityTeamAuth = () =>
  useAdminAuth({ requiredRole: 'FACILITY_TEAM' });
