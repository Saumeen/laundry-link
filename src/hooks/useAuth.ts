'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  walletBalance: number;
}

interface AuthState {
  isAuthenticated: boolean;
  customer: Customer | null;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const { data: session, status } = useSession();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    customer: null,
    isLoading: true,
  });

  useEffect(() => {
    console.log('useAuth effect:', { 
      status, 
      hasSession: !!session, 
      sessionUser: !!session?.user,
      sessionUserType: session?.userType,
      sessionCustomerId: session?.customerId
    });

    if (status === 'loading') {
      return;
    }

    // For customer context, any authenticated user is a customer
    if (session?.user) {
      const customer = {
        id: session.customerId || 0,
        email: session.user.email || '',
        firstName: session.user.name?.split(' ')[0] || '',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        isActive: true,
        walletBalance: session.walletBalance || 0,
      };
      
      console.log('Setting authenticated customer:', customer);
      setAuthState({
        isAuthenticated: true,
        customer,
        isLoading: false,
      });
    } else {
      console.log('No session user, setting unauthenticated');
      setAuthState({
        isAuthenticated: false,
        customer: null,
        isLoading: false,
      });
    }
  }, [session, status]);

  return authState;
}

export function useLogout() {
  const logout = async () => {
    try {
      await signOut({ redirect: false });
      window.location.href = '/registerlogin';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return logout;
} 