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
import logger from '@/lib/logger';

// Step enum for the wizard flow
enum WalletStep {
  OVERVIEW = 'overview',
  AMOUNT = 'amount',
  PAYMENT_METHOD = 'payment_method',
  CARD_VERIFICATION = 'card_verification',
  PAYMENT = 'payment',
  SUCCESS = 'success'
}

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
  const { profile, fetchProfile, loading: profileLoading } = useProfileStore();
  const { showToast } = useToast();
  const router = useRouter();
  
  // Main state
  const [walletInfo, setWalletInfo] = useState<{
    balance: number;
    transactions: WalletTransaction[];
  } | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingWallet, setRefreshingWallet] = useState(false);
  
  // Wizard flow state
  const [currentStep, setCurrentStep] = useState<WalletStep>(WalletStep.OVERVIEW);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'TAP_PAY' | 'BENEFIT_PAY' | 'BANK_TRANSFER'>('TAP_PAY');
  
  // Payment processing state
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [cardFormKey, setCardFormKey] = useState(0);
  
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

  useEffect(() => {
    // Fetch profile if not already loaded
    if (!profile && !profileLoading) {
      fetchProfile();
    }
  }, [profile, profileLoading, fetchProfile]);

  useEffect(() => {
    if (profile?.id) {
      fetchWalletInfo();
      fetchTransactionHistory();
      loadSavedVerificationStates();
    }
  }, [profile?.id]);

  const loadSavedVerificationStates = () => {
    if (!profile?.id) return;
    
    // Load card verification
    const savedCardState = localStorage.getItem(`cardVerification_${profile.id}`);
    if (savedCardState) {
      try {
        const parsed = JSON.parse(savedCardState);
        const isValid = parsed.verificationTimestamp && 
          (Date.now() - parsed.verificationTimestamp) < 30 * 60 * 1000;
        
        if (isValid) {
          setCardVerification(parsed);
        } else {
          localStorage.removeItem(`cardVerification_${profile.id}`);
        }
      } catch (error) {
        localStorage.removeItem(`cardVerification_${profile.id}`);
      }
    }
    
    // Load Benefit Pay verification
    const savedBenefitState = localStorage.getItem(`benefitPayVerification_${profile.id}`);
    if (savedBenefitState) {
      try {
        const parsed = JSON.parse(savedBenefitState);
        const isValid = parsed.verificationTimestamp && 
          (Date.now() - parsed.verificationTimestamp) < 30 * 60 * 1000;
        
        if (isValid) {
          setBenefitPayVerification(parsed);
        } else {
          localStorage.removeItem(`benefitPayVerification_${profile.id}`);
        }
      } catch (error) {
        localStorage.removeItem(`benefitPayVerification_${profile.id}`);
      }
    }
  };

  const fetchWalletInfo = async () => {
    try {
      if (!profile?.id) return;
      setRefreshingWallet(true);
      const response = await walletApi.getWalletInfo(profile.id);
      setWalletInfo(response);
    } catch (error) {
      logger.error('Error fetching wallet info:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load wallet information';
      showToast(errorMessage, 'error');
    } finally {
      setRefreshingWallet(false);
    }
  };

  const fetchTransactionHistory = async (page = 1) => {
    try {
      if (!profile?.id) return;
      const response = await walletApi.getTransactionHistory(profile.id, page, 10);
      
      if (page === 1) {
        setTransactions(response.transactions);
      } else {
        setTransactions(prev => [...prev, ...response.transactions]);
      }
    } catch (error) {
      logger.error('Error fetching transaction history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load transaction history';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Wizard navigation functions
  const startTopUp = () => {
    setCurrentStep(WalletStep.AMOUNT);
  };

  const goToPaymentMethod = () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    setCurrentStep(WalletStep.PAYMENT_METHOD);
  };

  const goToCardVerification = () => {
    setCurrentStep(WalletStep.CARD_VERIFICATION);
  };

  const goToPayment = () => {
    if (selectedPaymentMethod === 'TAP_PAY' && !cardVerification.isVerified) {
      showToast('Please verify your card first', 'error');
      return;
    }
    if (selectedPaymentMethod === 'BENEFIT_PAY' && !benefitPayVerification.isVerified) {
      showToast('Please verify your Benefit Pay account first', 'error');
      return;
    }
    setCurrentStep(WalletStep.PAYMENT);
  };

  const goBack = () => {
    switch (currentStep) {
      case WalletStep.AMOUNT:
        setCurrentStep(WalletStep.OVERVIEW);
        break;
      case WalletStep.PAYMENT_METHOD:
        setCurrentStep(WalletStep.AMOUNT);
        break;
      case WalletStep.CARD_VERIFICATION:
        setCurrentStep(WalletStep.PAYMENT_METHOD);
        break;
      case WalletStep.PAYMENT:
        setCurrentStep(WalletStep.CARD_VERIFICATION);
        break;
      default:
        setCurrentStep(WalletStep.OVERVIEW);
    }
  };

  const resetFlow = () => {
    setCurrentStep(WalletStep.OVERVIEW);
    setTopUpAmount('');
    setSelectedPaymentMethod('TAP_PAY');
    setTopUpLoading(false);
  };

  // Payment processing
  const handleTopUp = async () => {
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

      if (selectedPaymentMethod === 'TAP_PAY' && profile && cardVerification.token) {
        topUpData.customerData = {
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
          phone: profile.phone || ''
        };
        topUpData.tokenId = cardVerification.token;
      }

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
          handlePaymentRedirect(response.redirectUrl);
        } else {
          showToast('Top-up successful!', 'success');
          setCurrentStep(WalletStep.SUCCESS);
          setTimeout(() => {
            fetchWalletInfo();
            fetchTransactionHistory(1);
          }, 1000);
        }
      }
    } catch (error) {
      logger.error('Error processing top-up:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process top-up request';
      showToast(errorMessage, 'error');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handlePaymentRedirect = (redirectUrl: string) => {
    showToast('Redirecting to payment gateway...', 'info');
    if (profile?.id) {
      localStorage.setItem(`paymentInProgress_${profile.id}`, JSON.stringify({
        amount: topUpAmount,
        paymentMethod: selectedPaymentMethod,
        timestamp: Date.now()
      }));
    }
    window.location.href = redirectUrl;
  };

  // Card verification handlers
  const handleTokenReceived = (token: string, cardDetails?: {
    lastFour?: string;
    brand?: string;
    expiryMonth?: string;
    expiryYear?: string;
  }) => {
    const verificationState: CardVerificationState = {
      isVerified: true,
      token,
      cardDetails: cardDetails || null,
      verificationTimestamp: Date.now()
    };
    
    setCardVerification(verificationState);
    if (profile?.id) {
      localStorage.setItem(`cardVerification_${profile.id}`, JSON.stringify(verificationState));
    }
    showToast('Card verified successfully!', 'success');
    goToPayment();
  };

  const handleBenefitPayTokenReceived = (token: string) => {
    const verificationState = {
      isVerified: true,
      token,
      verificationTimestamp: Date.now()
    };
    
    setBenefitPayVerification(verificationState);
    if (profile?.id) {
      localStorage.setItem(`benefitPayVerification_${profile.id}`, JSON.stringify(verificationState));
    }
    showToast('Benefit Pay verified successfully!', 'success');
    goToPayment();
  };

  const handlePaymentError = (error: string) => {
    if (!error.includes('Invalid input') && !error.includes('validation')) {
      showToast(error, 'error');
    }
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

  // Utility functions
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
      case 'DEPOSIT': return '💰';
      case 'WITHDRAWAL': return '💸';
      case 'PAYMENT': return '💳';
      case 'REFUND': return '↩️';
      case 'ADJUSTMENT': return '⚖️';
      case 'TRANSFER': return '🔄';
      default: return '📊';
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

  const getTransactionStatusInfo = (transaction: WalletTransaction) => {
    try {
      const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};
      return {
        tapTransactionId: metadata.tapTransactionId,
        tapChargeId: metadata.tapChargeId,
        tapPaymentInProgress: metadata.tapPaymentInProgress,
        failureReason: metadata.failureReason,
        paymentRecordId: metadata.paymentRecordId
      };
    } catch (error) {
      return null;
    }
  };

  const getTransactionStatusBadge = (transaction: WalletTransaction) => {
    const statusInfo = getTransactionStatusInfo(transaction);
    
    if (transaction.status === 'PENDING' && statusInfo?.tapPaymentInProgress) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent mr-1"></div>
          PAYMENT IN PROGRESS
        </span>
      );
    }
    
    switch (transaction.status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            PENDING
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            COMPLETED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {transaction.status}
          </span>
        );
    }
  };

  // Loading states
  if (profileLoading || !profile) {
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

  // Step indicator component
  const StepIndicator = () => {
    const steps = [
      { key: WalletStep.OVERVIEW, label: 'Overview', icon: '🏠' },
      { key: WalletStep.AMOUNT, label: 'Amount', icon: '💰' },
      { key: WalletStep.PAYMENT_METHOD, label: 'Payment Method', icon: '💳' },
      { key: WalletStep.CARD_VERIFICATION, label: 'Verification', icon: '✅' },
      { key: WalletStep.PAYMENT, label: 'Payment', icon: '🔒' },
      { key: WalletStep.SUCCESS, label: 'Success', icon: '🎉' }
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-2 md:space-x-4">
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = index < currentIndex;
            const isUpcoming = index > currentIndex;

            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex flex-col items-center ${isUpcoming ? 'opacity-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg scale-110' 
                      : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render different steps
  const renderStep = () => {
    switch (currentStep) {
      case WalletStep.OVERVIEW:
        return <OverviewStep onStartTopUp={startTopUp} />;
      case WalletStep.AMOUNT:
        return <AmountStep onNext={goToPaymentMethod} onBack={goBack} />;
      case WalletStep.PAYMENT_METHOD:
        return <PaymentMethodStep onNext={goToCardVerification} onBack={goBack} />;
      case WalletStep.CARD_VERIFICATION:
        return <CardVerificationStep onNext={goToPayment} onBack={goBack} />;
      case WalletStep.PAYMENT:
        return <PaymentStep onBack={goBack} />;
      case WalletStep.SUCCESS:
        return <SuccessStep onReset={resetFlow} />;
      default:
        return <OverviewStep onStartTopUp={startTopUp} />;
    }
  };

  // Step components
  const OverviewStep = ({ onStartTopUp }: { onStartTopUp: () => void }) => (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium opacity-90">Current Balance</h2>
            <p className="text-4xl font-bold mt-2">
              {formatCurrency(walletInfo?.balance || 0, 'BHD')}
            </p>
            {refreshingWallet && (
              <div className="mt-2 flex items-center text-sm opacity-90">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Updating...
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onStartTopUp}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:scale-105"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
              <span className="text-xl">➕</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Top Up Wallet</h3>
              <p className="text-sm opacity-90">Add funds to your wallet</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            fetchWalletInfo();
            fetchTransactionHistory(1);
          }}
          disabled={refreshingWallet}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg disabled:opacity-50"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-xl">🔄</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Refresh</h3>
              <p className="text-sm opacity-90">Update wallet information</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h4>
              <p className="text-gray-600 mb-4">Your transaction history will appear here</p>
              <button
                onClick={onStartTopUp}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Make Your First Top-up
              </button>
            </div>
          ) : (
            transactions.slice(0, 5).map((transaction) => {
              const statusInfo = getTransactionStatusInfo(transaction);
              return (
                <div key={transaction.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{getTransactionIcon(transaction.transactionType)}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                        <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
                        {statusInfo?.tapTransactionId && (
                          <p className="text-xs text-gray-500 mt-1">
                            TAP ID: {statusInfo.tapTransactionId}
                          </p>
                        )}
                        {statusInfo?.failureReason && (
                          <p className="text-xs text-red-500 mt-1">
                            Failed: {statusInfo.failureReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.transactionType)}`}>
                        {transaction.transactionType === 'WITHDRAWAL' || transaction.transactionType === 'PAYMENT' ? '-' : '+'}
                        {formatCurrency(transaction.amount, 'BHD')}
                      </p>
                      {getTransactionStatusBadge(transaction)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {transactions.length > 5 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => router.push('/customer/wallet?view=transactions')}
              className="w-full text-center text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Transactions
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const AmountStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💰</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How much would you like to add?</h2>
          <p className="text-gray-600">Enter the amount you want to top up your wallet with</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (BHD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                BD
              </span>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="0.000"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                min="0.001"
                step="0.001"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Select
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 20, 50, 100, 200].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTopUpAmount(amount.toString())}
                  className={`py-3 px-4 rounded-lg border-2 transition-all duration-200 ${
                    topUpAmount === amount.toString()
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {formatCurrency(amount, 'BHD')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={onNext}
              disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const PaymentMethodStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Payment Method</h2>
          <p className="text-gray-600">Select how you'd like to pay {formatCurrency(parseFloat(topUpAmount), 'BHD')}</p>
        </div>

        <div className="space-y-4 mb-8">
          {[
            { value: 'TAP_PAY', label: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, American Express' },
            { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦', description: 'Direct bank transfer (manual processing)' }
          ].map((method) => (
            <button
              key={method.value}
              onClick={() => setSelectedPaymentMethod(method.value as any)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedPaymentMethod === method.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-xl">{method.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{method.label}</h3>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
                {selectedPaymentMethod === method.value && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  const CardVerificationStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
    if (selectedPaymentMethod === 'BANK_TRANSFER') {
      return (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏦</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank Transfer</h2>
              <p className="text-gray-600">Contact support for bank transfer details</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onBack}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={onNext}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Payment Method</h2>
            <p className="text-gray-600">
              {selectedPaymentMethod === 'TAP_PAY' 
                ? 'Enter your card details to verify your payment method'
                : 'Verify your Benefit Pay account to proceed'
              }
            </p>
          </div>

          <div className="space-y-6">
            {selectedPaymentMethod === 'TAP_PAY' && (
              <div>
                {cardVerification.isVerified ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-800">Card Verified ✓</h3>
                        {cardVerification.cardDetails?.lastFour && (
                          <p className="text-sm text-green-600">
                            Card ending in {cardVerification.cardDetails.lastFour}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={clearCardVerification}
                        className="text-sm text-green-600 hover:text-green-800 underline"
                      >
                        Change Card
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Card Details</h3>
                    {profile && (
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
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedPaymentMethod === 'BENEFIT_PAY' && (
              <div>
                {benefitPayVerification.isVerified ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-800">Benefit Pay Verified ✓</h3>
                        <p className="text-sm text-green-600">Ready to process payment</p>
                      </div>
                      <button
                        onClick={clearBenefitPayVerification}
                        className="text-sm text-green-600 hover:text-green-800 underline"
                      >
                        Change Method
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Benefit Pay Verification</h3>
                    {profile && (
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
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={onBack}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={onNext}
                disabled={
                  (selectedPaymentMethod === 'TAP_PAY' && !cardVerification.isVerified) ||
                  (selectedPaymentMethod === 'BENEFIT_PAY' && !benefitPayVerification.isVerified)
                }
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PaymentStep = ({ onBack }: { onBack: () => void }) => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
          <p className="text-gray-600">Review and confirm your payment</p>
        </div>

        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">{formatCurrency(parseFloat(topUpAmount), 'BHD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold">
                  {selectedPaymentMethod === 'TAP_PAY' ? 'Credit/Debit Card' : 'Bank Transfer'}
                </span>
              </div>
              {selectedPaymentMethod === 'TAP_PAY' && cardVerification.cardDetails?.lastFour && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Card:</span>
                  <span className="font-semibold">•••• {cardVerification.cardDetails.lastFour}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={handleTopUp}
              disabled={topUpLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {topUpLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Pay ${formatCurrency(parseFloat(topUpAmount), 'BHD')}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const SuccessStep = ({ onReset }: { onReset: () => void }) => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your wallet has been topped up with {formatCurrency(parseFloat(topUpAmount), 'BHD')}
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-800">
            Your new balance will be updated shortly. You can refresh the page to see the latest balance.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onReset}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Top Up Again
          </button>
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
                <p className="text-gray-600">Manage your wallet balance and transactions</p>
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

          {/* Step Indicator */}
          {currentStep !== WalletStep.OVERVIEW && <StepIndicator />}

          {/* Step Content */}
          {renderStep()}
        </div>
      </div>
    </CustomerLayout>
  );
} 