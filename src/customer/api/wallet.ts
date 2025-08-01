import { apiClient } from '@/shared/api/client';

export interface WalletInfo {
  balance: number;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: number;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT' | 'TRANSFER';
  amount: number;
  description: string;
  reference?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopUpRequest {
  amount: number;
  paymentMethod: 'TAP_PAY' | 'BENEFIT_PAY' | 'BANK_TRANSFER';
  description?: string;
  // Tap payment specific fields
  tokenId?: string;
  customerData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface TopUpResponse {
  success: boolean;
  data?: {
    paymentId?: number;
    paymentRecord?: {
      id: number;
      walletTransactionId: number | null;
      orderId: number | null;
      customerId: number;
      amount: number;
      currency: string;
      paymentMethod: string;
      paymentStatus: string;
      description: string;
      cardBrand: string | null;
      cardExpiry: string | null;
      cardLastFour: string | null;
      failureReason: string | null;
      processedAt: string | null;
      refundAmount: number | null;
      refundReason: string | null;
      tapAuthorizeId: string | null;
      tapChargeId: string | null;
      tapReference: string | null;
      tapResponse: string | null;
      tapTransactionId: string | null;
      createdAt: string;
      updatedAt: string;
    };
    redirectUrl?: string;
    chargeId?: string;
    message?: string;
    tapResponse?: {
      id: string;
      object: string;
      live_mode: boolean;
      customer_initiated: boolean;
      [key: string]: unknown;
    };
  };
  error?: string;
}

export interface TransactionHistoryResponse {
  transactions: WalletTransaction[];
  total: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const walletApi = {
  // Get wallet information including balance and transaction history
  getWalletInfo: async (customerId: number): Promise<WalletInfo> => {
    const response = await apiClient.get<WalletInfo>(`/api/wallet?customerId=${customerId}`);
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch wallet info');
    }
  },

  // Process wallet top-up using dedicated endpoint
  topUpWallet: async (data: TopUpRequest): Promise<TopUpResponse['data']> => {
    const response = await apiClient.post<TopUpResponse['data']>('/api/wallet/top-up', {
      ...data
    });
    
    // Return the data directly since the API now returns the actual data
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to process top-up request');
    }
  },

  // Get transaction history with pagination
  getTransactionHistory: async (
    customerId: number, 
    page: number = 1, 
    limit: number = 20
  ): Promise<TransactionHistoryResponse> => {
    const response = await apiClient.get<TransactionHistoryResponse>(
      `/api/wallet/transactions?customerId=${customerId}&page=${page}&limit=${limit}`
    );
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch transaction history');
    }
  },

  // Get wallet statistics
  getWalletStats: async (customerId: number) => {
    const response = await apiClient.get(`/api/wallet/stats?customerId=${customerId}`);
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch wallet stats');
    }
  }
}; 