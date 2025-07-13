/**
 * Utility functions for making authenticated API calls
 */

/**
 * Make an authenticated API call with proper error handling
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    // Handle authentication errors
    if (response.status === 401) {
      // Redirect to login page if not authenticated
      window.location.href = '/registerlogin';
      throw new Error('Authentication required');
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

/**
 * Make a GET request to an authenticated endpoint
 */
export async function authenticatedGet(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'GET' });
}

/**
 * Make a POST request to an authenticated endpoint
 */
export async function authenticatedPost(
  url: string, 
  data: any
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Make a PUT request to an authenticated endpoint
 */
export async function authenticatedPut(
  url: string, 
  data: any
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Make a DELETE request to an authenticated endpoint
 */
export async function authenticatedDelete(url: string): Promise<Response> {
  return authenticatedFetch(url, { method: 'DELETE' });
}

/**
 * Parse JSON response with error handling
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Customer API endpoints
 */
export const customerApi = {
  // Addresses
  getAddresses: () => authenticatedGet('/api/customer/addresses'),
  createAddress: (data: any) => authenticatedPost('/api/customer/addresses', data),
  updateAddress: (id: string | number, data: any) => authenticatedPut(`/api/customer/addresses/${id}`, data),
  deleteAddress: (id: string | number) => authenticatedDelete(`/api/customer/addresses/${id}`),
  setDefaultAddress: (id: string | number) => authenticatedPut(`/api/customer/addresses/${id}/default`, {}),
  
  // Orders
  getOrders: () => authenticatedGet('/api/customer/orders'),
  createOrder: (data: any) => authenticatedPost('/api/orders', data),
  
  // Profile
  getProfile: () => authenticatedGet('/api/customer/profile'),
  updateProfile: (data: any) => authenticatedPut('/api/customer/profile', data),
  
  // Payment methods
  getPaymentMethods: () => authenticatedGet('/api/payment-methods'),
  addPaymentMethod: (data: any) => authenticatedPost('/api/payment-methods', data),
  deletePaymentMethod: (id: string | number) => authenticatedDelete(`/api/payment-methods/${id}`),
  
  // Phone verification
  checkPhoneVerification: (phoneNumber: string) => authenticatedPost('/api/customer/check-phone-verification', { phoneNumber }),
  markPhoneVerified: (phoneNumber: string) => authenticatedPost('/api/customer/mark-phone-verified', { phoneNumber }),
}; 