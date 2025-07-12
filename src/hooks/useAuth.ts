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
  isNextAuthUser: boolean;
}

export function useAuth(): AuthState {
  const { data: session, status } = useSession();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    customer: null,
    isLoading: true,
    isNextAuthUser: false,
  });

  useEffect(() => {
    // Only run when NextAuth status changes
    if (status === 'loading') {
      return;
    }

    // Check NextAuth session first
    if (session?.user) {
      setAuthState({
        isAuthenticated: true,
        customer: {
          id: session.customerId || 0,
          email: session.user.email || '',
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          isActive: true,
          walletBalance: session.walletBalance || 0,
        },
        isLoading: false,
        isNextAuthUser: true,
      });
      return;
    }

    // Check localStorage for existing auth
    try {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const customerData = localStorage.getItem('customer');

      if (isLoggedIn === 'true' && customerData) {
        const customer = JSON.parse(customerData);
        setAuthState({
          isAuthenticated: true,
          customer,
          isLoading: false,
          isNextAuthUser: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          customer: null,
          isLoading: false,
          isNextAuthUser: false,
        });
      }
    } catch (error) {
      console.error('Error parsing customer data:', error);
      localStorage.removeItem('customer');
      localStorage.removeItem('isLoggedIn');
      setAuthState({
        isAuthenticated: false,
        customer: null,
        isLoading: false,
        isNextAuthUser: false,
      });
    }
  }, [session, status]);

  // Listen for auth state changes from your existing system
  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const customerData = localStorage.getItem('customer');

        if (isLoggedIn === 'true' && customerData) {
          const customer = JSON.parse(customerData);
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            customer,
            isNextAuthUser: false,
          }));
        } else {
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: false,
            customer: null,
            isNextAuthUser: false,
          }));
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    return () => window.removeEventListener('authStateChanged', handleAuthChange);
  }, []);

  return authState;
}

export function useLogout() {
  const logout = async () => {
    try {
      // Clear NextAuth session
      await signOut({ redirect: false });
      
      // Clear localStorage
      localStorage.removeItem('customer');
      localStorage.removeItem('isLoggedIn');
      
      // Trigger auth state change event
      window.dispatchEvent(new Event('authStateChanged'));
      
      // Redirect to login page
      window.location.href = '/registerlogin';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return logout;
} 