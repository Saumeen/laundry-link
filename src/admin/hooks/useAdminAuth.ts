import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/admin/stores/dashboardStore';
import logger from '@/lib/logger';

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
        logger.info('Auth: Session loading...');
        return;
      }

      if (status === 'unauthenticated') {
        logger.info('Auth: User unauthenticated, redirecting to login');
        router.push(redirectTo);
        return;
      }

      // If we have a session, try to fetch current user data if not already loaded
      if (session && !currentUser) {
        logger.info('Auth: Session exists, fetching current user...');
        try {
          await fetchCurrentUser();
        } catch (error) {
          logger.error('Error fetching current user:', error);
          // If fetching user fails, redirect to login
          router.push(redirectTo);
          return;
        }
      }

      // If we have a session but no currentUser yet, wait for it to load
      if (session && !currentUser) {
        logger.info('Auth: Session exists but no currentUser yet, waiting...');
        return; // Keep loading state
      }

      // If we have a session and currentUser, check role requirements
      if (session && currentUser) {
        logger.info('Auth: Session and currentUser exist, checking role...', {
          userRole: currentUser.role.name,
          requiredRole,
          permissions: currentUser.role.permissions,
        });

        // If no required role is specified, any admin user is authorized
        if (!requiredRole) {
          logger.info('Auth: No required role, user authorized');
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // Check if user has the required role
        const hasRole =
          currentUser.role.name === requiredRole ||
          currentUser.role.permissions.includes(requiredRole);

        if (hasRole) {
          logger.info('Auth: User has required role, authorized');
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        } else {
          logger.info('Auth: User does not have required role, redirecting to unauthorized'
          );
          router.push('/admin/unauthorized');
          return;
        }
      }
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

    // Sign out from NextAuth
    await signOut({ callbackUrl: '/admin/login' });
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
