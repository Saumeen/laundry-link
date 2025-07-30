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
  paymentMethod: 'TAP_PAY' | 'CARD' | 'BANK_TRANSFER';
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
    paymentId: number;
    redirectUrl?: string;
    chargeId?: string;
    message?: string;
  };
  error?: string;
}

export interface TransactionHistoryResponse {
  transactions: WalletTransaction[];
  total: number;
  hasMore: boolean;
}

export const walletApi = {
  // Get wallet information including balance and transaction history
  getWalletInfo: async (customerId: number): Promise<WalletInfo> => {
    const response = await apiClient.get(`/api/wallet?customerId=${customerId}`);
    return response.data as WalletInfo;
  },

  // Process wallet top-up using dedicated endpoint
  topUpWallet: async (data: TopUpRequest): Promise<TopUpResponse> => {
    const response = await apiClient.post('/api/wallet/top-up', {
      ...data,
      customerId: data.customerData ? undefined : undefined // Will be set from auth context
    });
    return response.data as TopUpResponse;
  },

  // Get transaction history with pagination
  getTransactionHistory: async (
    customerId: number, 
    page: number = 1, 
    limit: number = 20
  ): Promise<TransactionHistoryResponse> => {
    const response = await apiClient.get(
      `/api/wallet/transactions?customerId=${customerId}&page=${page}&limit=${limit}`
    );
    return response.data as TransactionHistoryResponse;
  },

  // Get wallet statistics
  getWalletStats: async (customerId: number) => {
    const response = await apiClient.get(`/api/wallet/stats?customerId=${customerId}`);
    return response.data;
  }
}; 