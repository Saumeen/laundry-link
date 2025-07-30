import { create } from 'zustand';
import { walletApi, type WalletTransaction } from '@/customer/api/wallet';

interface WalletState {
  balance: number;
  transactions: WalletTransaction[];
  loading: boolean;
  error: string | null;
  fetchWalletInfo: (customerId: number) => Promise<void>;
  fetchTransactionHistory: (customerId: number, page?: number) => Promise<void>;
  updateBalance: (newBalance: number) => void;
  addTransaction: (transaction: WalletTransaction) => void;
  clearError: () => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: 0,
  transactions: [],
  loading: false,
  error: null,

  fetchWalletInfo: async (customerId: number) => {
    set({ loading: true, error: null });
    try {
      const data = await walletApi.getWalletInfo(customerId);
      set({ 
        balance: data.balance, 
        transactions: data.transactions,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch wallet info',
        loading: false 
      });
    }
  },

  fetchTransactionHistory: async (customerId: number, page = 1) => {
    set({ loading: true, error: null });
    try {
      const data = await walletApi.getTransactionHistory(customerId, page, 20);
      if (page === 1) {
        set({ transactions: data.transactions, loading: false });
      } else {
        set(state => ({ 
          transactions: [...state.transactions, ...data.transactions],
          loading: false 
        }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch transaction history',
        loading: false 
      });
    }
  },

  updateBalance: (newBalance: number) => {
    set({ balance: newBalance });
  },

  addTransaction: (transaction: WalletTransaction) => {
    set(state => ({ 
      transactions: [transaction, ...state.transactions],
      balance: transaction.transactionType === 'DEPOSIT' || transaction.transactionType === 'REFUND'
        ? state.balance + transaction.amount
        : transaction.transactionType === 'WITHDRAWAL' || transaction.transactionType === 'PAYMENT'
        ? state.balance - transaction.amount
        : state.balance
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({ balance: 0, transactions: [], loading: false, error: null });
  },
})); 