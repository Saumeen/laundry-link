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
      sessionCustomerId: session?.customerId,
      sessionWalletBalance: session?.walletBalance
    });

    if (status === 'loading') {
      return;
    }

    // For customer context, any authenticated user is a customer
    if (session?.user) {
      // If we have a session user but no customerId, try to fetch it
      if (!session.customerId && session.userType === 'customer') {
        console.log('Session user exists but no customerId, fetching customer data...');
        // Set loading state while we fetch
        setAuthState(prev => ({ ...prev, isLoading: true }));
        
        // Fetch customer data from API
        fetch('/api/customer/profile')
          .then(res => res.json())
          .then((data) => {
            const response = data as { customer?: Customer };
            if (response.customer) {
              const customer = {
                id: response.customer.id,
                email: response.customer.email,
                firstName: response.customer.firstName,
                lastName: response.customer.lastName,
                phone: response.customer.phone,
                isActive: response.customer.isActive,
                walletBalance: response.customer.walletBalance,
              };
              
              console.log('Fetched customer data:', customer);
              setAuthState({
                isAuthenticated: true,
                customer,
                isLoading: false,
              });
            } else {
              console.log('No customer data found in API response');
              setAuthState({
                isAuthenticated: false,
                customer: null,
                isLoading: false,
              });
            }
          })
          .catch(error => {
            console.error('Error fetching customer data:', error);
            setAuthState({
              isAuthenticated: false,
              customer: null,
              isLoading: false,
            });
          });
        return;
      }
      
      const customer = {
        id: session.customerId || 0,
        email: session.user.email || '',
        firstName: session.user.name?.split(' ')[0] || '',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        phone: undefined,
        isActive: true,
        walletBalance: session.walletBalance || 0,
      };
      
      console.log('Setting authenticated customer from session:', customer);
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