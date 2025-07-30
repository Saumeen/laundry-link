'use client';

import { useState, useEffect } from 'react';
import { useProfileStore } from '@/customer';
import { walletApi, type WalletTransaction, type TopUpRequest } from '@/customer/api/wallet';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

export default function WalletPage() {
  const { profile } = useProfileStore();
  const { showToast } = useToast();
  const router = useRouter();
  const [walletInfo, setWalletInfo] = useState<{
    balance: number;
    transactions: WalletTransaction[];
  } | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'TAP_PAY' | 'CARD' | 'BANK_TRANSFER'>('TAP_PAY');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Tap payment specific states
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    name: ''
  });

  useEffect(() => {
    if (profile?.id) {
      fetchWalletInfo();
      fetchTransactionHistory();
    }
  }, [profile?.id]);

  const fetchWalletInfo = async () => {
    try {
      if (!profile?.id) return;
      const data = await walletApi.getWalletInfo(profile.id);
      setWalletInfo(data);
    } catch (error) {
      console.error('Error fetching wallet info:', error);
      showToast('Failed to load wallet information', 'error');
    }
  };

  const fetchTransactionHistory = async (page = 1) => {
    try {
      if (!profile?.id) return;
      const data = await walletApi.getTransactionHistory(profile.id, page, 20);
      if (page === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }
      setHasMore(data.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      showToast('Failed to load transaction history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (!profile?.id) {
      showToast('Please log in to top up your wallet', 'error');
      return;
    }

    setTopUpLoading(true);
    try {
      const topUpData: TopUpRequest = {
        amount: parseFloat(topUpAmount),
        paymentMethod: selectedPaymentMethod,
        description: `Wallet top-up - ${formatCurrency(parseFloat(topUpAmount), 'BHD')}`
      };

      // Add customer data for Tap payments
      if (selectedPaymentMethod === 'TAP_PAY' && profile) {
        topUpData.customerData = {
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
          phone: profile.phone || ''
        };

        // For now, we'll use a placeholder token ID
        // In a real implementation, you would create a token from card details
        topUpData.tokenId = 'tok_test_placeholder'; // This should be created from card details
      }

      const response = await walletApi.topUpWallet(topUpData);
      
      if (response.success && response.data) {
        if (response.data.redirectUrl) {
          // Redirect to payment gateway (external URL)
          window.location.href = response.data.redirectUrl;
      } else if (response.data.message) {
          showToast(response.data.message, 'success');
          setShowTopUpModal(false);
          setTopUpAmount('');
          // Refresh wallet info
          await fetchWalletInfo();
        } else {
          showToast('Top-up request submitted successfully', 'success');
          setShowTopUpModal(false);
          setTopUpAmount('');
          // Refresh wallet info
          await fetchWalletInfo();
        }
      } else {
        showToast(response.error || 'Failed to process top-up request', 'error');
      }
    } catch (error) {
      console.error('Error processing top-up:', error);
      showToast('Failed to process top-up request', 'error');
    } finally {
      setTopUpLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return '💰';
      case 'WITHDRAWAL':
        return '💸';
      case 'PAYMENT':
        return '💳';
      case 'REFUND':
        return '↩️';
      case 'ADJUSTMENT':
        return '⚖️';
      case 'TRANSFER':
        return '🔄';
      default:
        return '📊';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'REFUND':
        return 'text-green-600';
      case 'WITHDRAWAL':
      case 'PAYMENT':
        return 'text-red-600';
      case 'ADJUSTMENT':
      case 'TRANSFER':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600">Manage your wallet balance and view transaction history</p>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Balance</h2>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(walletInfo?.balance || 0, 'BHD')}
              </p>
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Top Up Wallet
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deposits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    transactions
                      .filter(t => t.transactionType === 'DEPOSIT')
                      .reduce((sum, t) => sum + t.amount, 0),
                    'BHD'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💸</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    transactions
                      .filter(t => t.transactionType === 'PAYMENT')
                      .reduce((sum, t) => sum + t.amount, 0),
                    'BHD'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No transactions yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Your transaction history will appear here
                </p>
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Make Your First Top-up
                </button>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{getTransactionIcon(transaction.transactionType)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {transaction.description}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(transaction.createdAt)}
                        </p>
                        {transaction.reference && (
                          <p className="text-xs text-gray-500">
                            Ref: {transaction.reference}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getTransactionColor(transaction.transactionType)}`}>
                        {transaction.transactionType === 'WITHDRAWAL' || transaction.transactionType === 'PAYMENT' ? '-' : '+'}
                        {formatCurrency(transaction.amount, 'BHD')}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.transactionType === 'DEPOSIT' || transaction.transactionType === 'REFUND'
                          ? 'bg-green-100 text-green-800'
                          : transaction.transactionType === 'WITHDRAWAL' || transaction.transactionType === 'PAYMENT'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.transactionType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {hasMore && (
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => fetchTransactionHistory(currentPage + 1)}
                className="w-full text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Load More Transactions
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top-up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowTopUpModal(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Top Up Your Wallet
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount (BD)
                        </label>
                        <input
                          type="number"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0.001"
                          step="0.001"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method
                        </label>
                        <select
                          value={selectedPaymentMethod}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="TAP_PAY">Tap Pay (Card/Apple Pay/Google Pay)</option>
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                        </select>
                      </div>

                      {selectedPaymentMethod === 'TAP_PAY' && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm text-blue-800">
                            💳 You'll be redirected to Tap's secure payment gateway to complete your payment.
                          </p>
                        </div>
                      )}

                      {selectedPaymentMethod === 'BANK_TRANSFER' && (
                        <div className="bg-yellow-50 p-3 rounded-md">
                          <p className="text-sm text-yellow-800">
                            🏦 Bank transfer details will be provided. Please contact support after completing the transfer.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={topUpLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleTopUp}
                >
                  {topUpLoading ? 'Processing...' : 'Top Up'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowTopUpModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 