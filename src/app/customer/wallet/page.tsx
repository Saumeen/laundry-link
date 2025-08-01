'use client';

import { useState, useEffect } from 'react';
import { useProfileStore } from '@/customer';
import { walletApi, type WalletTransaction, type TopUpRequest } from '@/customer/api/wallet';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import TapCardForm from '@/components/ui/TapCardForm';
import BenefitPayButton from '@/components/ui/BenefitPayButton';
import { CustomerLayout } from '@/customer/components/CustomerLayout';

// Enhanced state interface for card verification
interface CardVerificationState {
  isVerified: boolean;
  token: string | null;
  cardDetails: {
    lastFour?: string;
    brand?: string;
    expiryMonth?: string;
    expiryYear?: string;
  } | null;
  verificationTimestamp: number | null;
}

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
  const [showTopUpForm, setShowTopUpForm] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'TAP_PAY' | 'BENEFIT_PAY' | 'BANK_TRANSFER'>('TAP_PAY');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [refreshingWallet, setRefreshingWallet] = useState(false);
  
  // Enhanced card verification state
  const [cardVerification, setCardVerification] = useState<CardVerificationState>({
    isVerified: false,
    token: null,
    cardDetails: null,
    verificationTimestamp: null
  });

  // Benefit Pay verification state
  const [benefitPayVerification, setBenefitPayVerification] = useState<{
    isVerified: boolean;
    token: string | null;
    verificationTimestamp: number | null;
  }>({
    isVerified: false,
    token: null,
    verificationTimestamp: null
  });

  // Card form state
  const [cardFormKey, setCardFormKey] = useState(0); // Key to force re-render when needed

  useEffect(() => {
    if (profile?.id) {
      fetchWalletInfo();
      fetchTransactionHistory();
      
      // Check for pending payments and payments in progress
      const pendingPayment = localStorage.getItem(`pendingPayment_${profile.id}`);
      const paymentInProgress = localStorage.getItem(`paymentInProgress_${profile.id}`);
      
      if (pendingPayment || paymentInProgress) {
        try {
          const payment = pendingPayment ? JSON.parse(pendingPayment) : JSON.parse(paymentInProgress!);
          const timeDiff = Date.now() - payment.timestamp;
          
          // If payment was initiated within the last 30 minutes, refresh wallet
          if (timeDiff < 30 * 60 * 1000) {
            showToast('Checking payment status...', 'info');
            // Refresh wallet after a short delay to allow for webhook processing
            setTimeout(() => {
              fetchWalletInfo();
              fetchTransactionHistory(1);
            }, 2000);
          }
          
          // Clear the payment records
          localStorage.removeItem(`pendingPayment_${profile.id}`);
          localStorage.removeItem(`paymentInProgress_${profile.id}`);
        } catch (error) {
          console.warn('Failed to parse payment data:', error);
          localStorage.removeItem(`pendingPayment_${profile.id}`);
          localStorage.removeItem(`paymentInProgress_${profile.id}`);
        }
      }
    }
  }, [profile?.id]);

  // Load saved card verification state from localStorage
  useEffect(() => {
    if (profile?.id) {
      const savedState = localStorage.getItem(`cardVerification_${profile.id}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          // Check if the verification is still valid (within 30 minutes)
          const isValid = parsed.verificationTimestamp && 
            (Date.now() - parsed.verificationTimestamp) < 30 * 60 * 1000;
          
          if (isValid) {
            setCardVerification(parsed);
          } else {
            // Clear expired verification
            localStorage.removeItem(`cardVerification_${profile.id}`);
          }
        } catch (error) {
          console.warn('Failed to parse saved card verification state:', error);
          localStorage.removeItem(`cardVerification_${profile.id}`);
        }
      }
    }
  }, [profile?.id]);

  // Load saved Benefit Pay verification state from localStorage
  useEffect(() => {
    if (profile?.id) {
      const savedState = localStorage.getItem(`benefitPayVerification_${profile.id}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          // Check if the verification is still valid (within 30 minutes)
          const isValid = parsed.verificationTimestamp && 
            (Date.now() - parsed.verificationTimestamp) < 30 * 60 * 1000;
          
          if (isValid) {
            setBenefitPayVerification(parsed);
          } else {
            // Clear expired verification
            localStorage.removeItem(`benefitPayVerification_${profile.id}`);
          }
        } catch (error) {
          console.warn('Failed to parse saved Benefit Pay verification state:', error);
          localStorage.removeItem(`benefitPayVerification_${profile.id}`);
        }
      }
    }
  }, [profile?.id]);

  // Save card verification state to localStorage
  useEffect(() => {
    if (profile?.id && cardVerification.isVerified && cardVerification.token) {
      localStorage.setItem(`cardVerification_${profile.id}`, JSON.stringify(cardVerification));
    }
  }, [cardVerification, profile?.id]);

  // Save Benefit Pay verification state to localStorage
  useEffect(() => {
    if (profile?.id && benefitPayVerification.isVerified && benefitPayVerification.token) {
      localStorage.setItem(`benefitPayVerification_${profile.id}`, JSON.stringify(benefitPayVerification));
    }
  }, [benefitPayVerification, profile?.id]);

  const fetchWalletInfo = async () => {
    try {
      if (!profile?.id) return;
      setRefreshingWallet(true);
      const response = await walletApi.getWalletInfo(profile.id);
      setWalletInfo(response);
    } catch (error) {
      console.error('Error fetching wallet info:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load wallet information';
      showToast(errorMessage, 'error');
    } finally {
      setRefreshingWallet(false);
    }
  };

  const fetchTransactionHistory = async (page = 1) => {
    try {
      if (!profile?.id) return;
      const response = await walletApi.getTransactionHistory(profile.id, page, 20);
      
      if (page === 1) {
        setTransactions(response.transactions);
      } else {
        setTransactions(prev => [...prev, ...response.transactions]);
      }
      setHasMore(response.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load transaction history';
      showToast(errorMessage, 'error');
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

    // For TAP_PAY, we need to wait for the token to be generated
    if (selectedPaymentMethod === 'TAP_PAY' && !cardVerification.isVerified) {
      showToast('Please complete the payment form verification first', 'error');
      return;
    }

    // For BENEFIT_PAY, we need to wait for the token to be generated
    if (selectedPaymentMethod === 'BENEFIT_PAY' && !benefitPayVerification.isVerified) {
      showToast('Please complete the Benefit Pay verification first', 'error');
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
      if (selectedPaymentMethod === 'TAP_PAY' && profile && cardVerification.token) {
        topUpData.customerData = {
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
          phone: profile.phone || ''
        };

        topUpData.tokenId = cardVerification.token;
      }

      // Add customer data for Benefit Pay payments
      if (selectedPaymentMethod === 'BENEFIT_PAY' && profile && benefitPayVerification.token) {
        topUpData.customerData = {
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
          phone: profile.phone || ''
        };

        topUpData.tokenId = benefitPayVerification.token;
      }

      const response = await walletApi.topUpWallet(topUpData);
      if (response) {
        if (response.redirectUrl) {
          // Handle redirect to payment gateway
          handlePaymentRedirect(response.redirectUrl);
        } else if (response.message) {
          showToast(response.message, 'success');
          handleTopUpSuccess();
        } else {
          showToast('Top-up request submitted successfully', 'success');
          handleTopUpSuccess();
        }
      } else {
        showToast('Failed to process top-up request', 'error');
        setTopUpLoading(false);
      }
    } catch (error) {
      console.error('Error processing top-up:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process top-up request';
      showToast(errorMessage, 'error');
      setTopUpLoading(false);
    }
  };

  const handleTopUpSuccess = () => {
    setShowTopUpForm(false);
    setTopUpAmount('');
    setTopUpLoading(false);
    setTopUpSuccess(true);
    // Don't clear card verification state - keep it for future use
    // Only clear if user explicitly wants to change payment method
    
    // Add a small delay to ensure the payment is processed
    setTimeout(() => {
      fetchWalletInfo();
      fetchTransactionHistory(1); // Refresh transaction history
    }, 1000);
    
    // Reset success state after 5 seconds
    setTimeout(() => {
      setTopUpSuccess(false);
    }, 5000);
  };

  const handlePaymentRedirect = (redirectUrl: string) => {
    showToast('Redirecting to payment gateway...', 'info');
    // Store current state for when user returns
    if (profile?.id) {
      localStorage.setItem(`paymentInProgress_${profile.id}`, JSON.stringify({
        amount: topUpAmount,
        paymentMethod: selectedPaymentMethod,
        timestamp: Date.now()
      }));
    }
    
    // Redirect to payment gateway
    window.location.href = redirectUrl;
  };

  const handleTokenReceived = (token: string, cardDetails?: {
    lastFour?: string;
    brand?: string;
    expiryMonth?: string;
    expiryYear?: string;
  }) => {
    const verificationState: CardVerificationState = {
      isVerified: true,
      token,
      cardDetails: cardDetails ? {
        lastFour: cardDetails.lastFour,
        brand: cardDetails.brand,
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear
      } : null,
      verificationTimestamp: Date.now()
    };
    
    setCardVerification(verificationState);
    showToast('Payment method verified successfully', 'success');
  };

  const handleBenefitPayTokenReceived = (token: string, paymentDetails?: Record<string, unknown>) => {
    const verificationState = {
      isVerified: true,
      token,
      verificationTimestamp: Date.now()
    };
    
    setBenefitPayVerification(verificationState);
    showToast('Benefit Pay verified successfully', 'success');
  };

  const handlePaymentError = (error: string) => {
    // Don't show toast for validation feedback messages
    if (!error.includes('Invalid input') && !error.includes('validation')) {
      showToast(error, 'error');
    }
    // Don't clear verification state on error - let user retry
  };

  const clearCardVerification = () => {
    setCardVerification({
      isVerified: false,
      token: null,
      cardDetails: null,
      verificationTimestamp: null
    });
    if (profile?.id) {
      localStorage.removeItem(`cardVerification_${profile.id}`);
    }
    // Force re-render of card form
    setCardFormKey(prev => prev + 1);
  };

  const clearBenefitPayVerification = () => {
    setBenefitPayVerification({
      isVerified: false,
      token: null,
      verificationTimestamp: null
    });
    if (profile?.id) {
      localStorage.removeItem(`benefitPayVerification_${profile.id}`);
    }
  };

  const handlePaymentMethodChange = (method: 'TAP_PAY' | 'BENEFIT_PAY' | 'BANK_TRANSFER') => {
    setSelectedPaymentMethod(method);
    // Only clear card verification if switching away from TAP_PAY
    if (method !== 'TAP_PAY') {
      clearCardVerification();
    }
    // Only clear Benefit Pay verification if switching away from BENEFIT_PAY
    if (method !== 'BENEFIT_PAY') {
      clearBenefitPayVerification();
    }
  };

  const handleTopUpCancel = () => {
    setShowTopUpForm(false);
    setTopUpAmount('');
    // Don't clear card verification - keep it for next time
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

  // Show loading state if profile is not loaded yet
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

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
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
                <p className="text-gray-600">Manage your wallet balance and view transaction history</p>
              </div>
              <button
                onClick={() => router.push('/customer/dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>

        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Balance</h2>
              <div className="flex items-center">
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(walletInfo?.balance || 0, 'BHD')}
                </p>
                {refreshingWallet && (
                  <div className="ml-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                )}
              </div>
              {topUpSuccess && (
                <div className="mt-2 flex items-center text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Top-up successful!</span>
                </div>
              )}
            </div>
            {!showTopUpForm && (
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowTopUpForm(true);
                    setTopUpSuccess(false);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Top Up Wallet
                </button>
                <button
                  onClick={() => {
                    fetchWalletInfo();
                    fetchTransactionHistory(1);
                  }}
                  disabled={refreshingWallet}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {refreshingWallet ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
                      Refreshing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Top-up Form - Conditional Rendering */}
        {showTopUpForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Top Up Your Wallet</h2>
              <button
                onClick={handleTopUpCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Amount and Payment Method */}
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
                    onChange={(e) => handlePaymentMethodChange(e.target.value as 'TAP_PAY' | 'BENEFIT_PAY' | 'BANK_TRANSFER')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="TAP_PAY">Tap Pay (Card)</option>
                    <option value="BENEFIT_PAY">Benefit Pay</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                {/* Card Verification Status */}
                {selectedPaymentMethod === 'TAP_PAY' && cardVerification.isVerified && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-800">Card Verified ✓</p>
                        {cardVerification.cardDetails?.lastFour && (
                          <p className="text-xs text-green-600">
                            Card ending in {cardVerification.cardDetails.lastFour} - Ready to process payment
                          </p>
                        )}
                      </div>
                      <button
                        onClick={clearCardVerification}
                        className="ml-auto text-xs text-green-600 hover:text-green-800 underline"
                      >
                        Change Card
                      </button>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'TAP_PAY' && !cardVerification.isVerified && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      💳 <strong>Step 1:</strong> Verify your card details using the form on the right. 
                      <br />
                      <span className="text-xs text-blue-600 mt-1 block">
                        • Enter your card information to verify it's valid
                        <br />
                        • Click "Verify Card" to complete the verification
                        <br />
                        • After verification, you'll see a "Pay" button to process the payment
                      </span>
                    </p>
                  </div>
                )}

                {selectedPaymentMethod === 'BENEFIT_PAY' && benefitPayVerification.isVerified && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-800">Benefit Pay Verified ✓</p>
                        <p className="text-xs text-green-600">
                          Ready to process payment
                        </p>
                      </div>
                      <button
                        onClick={clearBenefitPayVerification}
                        className="ml-auto text-xs text-green-600 hover:text-green-800 underline"
                      >
                        Change Method
                      </button>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'BENEFIT_PAY' && !benefitPayVerification.isVerified && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      📱 <strong>Step 1:</strong> Verify your Benefit Pay account using the button on the right.
                      <br />
                      <span className="text-xs text-blue-600 mt-1 block">
                        • Click the Benefit Pay button to verify your account
                        <br />
                        • After verification, you'll see a "Pay" button to process the payment
                      </span>
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

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  {selectedPaymentMethod === 'BANK_TRANSFER' && (
                    <button
                      type="button"
                      disabled={topUpLoading || !topUpAmount || parseFloat(topUpAmount) <= 0}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      onClick={handleTopUp}
                    >
                      {topUpLoading ? 'Processing...' : 'Top Up'}
                    </button>
                  )}
                  
                  {selectedPaymentMethod === 'TAP_PAY' && cardVerification.isVerified && (
                    <button
                      type="button"
                      disabled={topUpLoading || !topUpAmount || parseFloat(topUpAmount) <= 0}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      onClick={handleTopUp}
                    >
                      {topUpLoading ? 'Processing Payment...' : `Pay ${formatCurrency(parseFloat(topUpAmount), 'BHD')}`}
                    </button>
                  )}

                  {selectedPaymentMethod === 'BENEFIT_PAY' && benefitPayVerification.isVerified && (
                    <button
                      type="button"
                      disabled={topUpLoading || !topUpAmount || parseFloat(topUpAmount) <= 0}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      onClick={handleTopUp}
                    >
                      {topUpLoading ? 'Processing Payment...' : `Pay ${formatCurrency(parseFloat(topUpAmount), 'BHD')}`}
                    </button>
                  )}
                  
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    onClick={handleTopUpCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Right Column - Payment Form */}
              <div>
                {selectedPaymentMethod === 'TAP_PAY' && profile && !cardVerification.isVerified && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
                    <TapCardForm
                      key={cardFormKey}
                      amount={parseFloat(topUpAmount) || 0}
                      currency="BHD"
                      customerData={{
                        firstName: profile.firstName || '',
                        lastName: profile.lastName || '',
                        email: profile.email || '',
                        phone: profile.phone || ''
                      }}
                      onTokenReceived={handleTokenReceived}
                      onError={handlePaymentError}
                      isLoading={topUpLoading}
                    />
                  </div>
                )}

                {selectedPaymentMethod === 'BENEFIT_PAY' && profile && !benefitPayVerification.isVerified && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Benefit Pay</h3>
                    <BenefitPayButton
                      amount={parseFloat(topUpAmount) || 0}
                      currency="BHD"
                      customerData={{
                        firstName: profile.firstName || '',
                        lastName: profile.lastName || '',
                        email: profile.email || '',
                        phone: profile.phone || ''
                      }}
                      onTokenReceived={handleBenefitPayTokenReceived}
                      onError={handlePaymentError}
                      isLoading={topUpLoading}
                      transactionReference={`wallet_topup_${Date.now()}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                  onClick={() => setShowTopUpForm(true)}
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
    </div>
    </CustomerLayout>
  );
} 