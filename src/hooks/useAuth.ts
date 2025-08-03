'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import logger from '@/lib/logger';

interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  wallet?: {
    balance: number;
    currency: string;
  };
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
  const hasFetchedCustomer = useRef(false);

  // Update loading state based on session status
  useEffect(() => {
    if (status === 'loading') {
      setAuthState(prev => ({ ...prev, isLoading: true }));
    } else {
      // Only set loading to false if we have determined authentication status
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [status]);

  // Handle customer authentication
  useEffect(() => {
    if (status === 'loading') return;

    if (session?.userType === 'customer' && session?.customerId) {
      // Set basic authentication state immediately
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
      }));

      // Fetch complete customer data from API
      fetchCustomerData();
    } else if (!session?.user) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        customer: null,
        isLoading: false,
      }));
      hasFetchedCustomer.current = false;
    }
  }, [session, status]);

  // Fetch customer data from API
  const fetchCustomerData = async () => {
    if (
      !session?.user?.email ||
      session?.userType !== 'customer' ||
      hasFetchedCustomer.current
    )
      return;

    try {
      hasFetchedCustomer.current = true;
      const response = await fetch('/api/customer/profile');
      if (response.ok) {
        const customerData = (await response.json()) as { customer: Customer };
        if (customerData.customer) {
          setAuthState(prev => ({
            ...prev,
            customer: customerData.customer,
          }));
        }
      }
    } catch (error) {
      hasFetchedCustomer.current = false;
    }
  };

  // Fetch additional customer data if needed (legacy - keeping for backward compatibility)
  useEffect(() => {
    if (
      session?.userType === 'customer' &&
      session?.user?.email &&
      !hasFetchedCustomer.current
    ) {
      fetchCustomerData();
    }
  }, [session?.user?.email, session?.userType]);

  return authState;
}

export function useLogout() {
  const logout = async () => {
    try {
      await signOut({ redirect: false });
      window.location.href = '/registerlogin';
    } catch (error) {
      logger.error('Error during logout:', error);
    }
  };

  return logout;
}
