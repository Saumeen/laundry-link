'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useProfileStore } from '@/customer';
import { CustomerLayout } from '@/customer/components/CustomerLayout';

interface PaymentStatus {
  id: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  isWalletTopUp: boolean;
  tapTransactionId?: string;
  walletTransaction?: {
    id: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    amount: number;
    description: string;
    metadata?: string;
  };
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { profile } = useProfileStore();
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentId = searchParams.get('payment_id');
  const tapId = searchParams.get('tap_id');

  useEffect(() => {
    if (!paymentId) {
      setError('Payment ID not found');
      setLoading(false);
      return;
    }

    // Check payment status
    checkPaymentStatus();
  }, [paymentId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/payment/status?payment_id=${paymentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json() as {
        success: boolean;
        payment?: PaymentStatus;
        error?: string;
      };
      
      if (data.success && data.payment) {
        setPaymentStatus(data.payment);
        
        // Show appropriate message based on status
        if (data.payment.paymentStatus === 'PAID') {
          showToast('Payment completed successfully!', 'success');
        } else if (data.payment.paymentStatus === 'FAILED') {
          showToast('Payment failed. Please try again.', 'error');
        } else {
          showToast('Payment is being processed...', 'info');
        }
      } else {
        setError(data.error || 'Failed to check payment status');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setError('Failed to check payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (paymentStatus?.isWalletTopUp) {
      router.push('/customer/wallet');
    } else {
      router.push('/customer/dashboard');
    }
  };

  const handleRetry = () => {
    if (paymentStatus?.isWalletTopUp) {
      router.push('/customer/wallet');
    } else {
      router.push('/customer/dashboard');
    }
  };

  const getTransactionStatusInfo = (transaction?: PaymentStatus['walletTransaction']) => {
    if (!transaction) return null;
    
    try {
      const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};
      return {
        tapTransactionId: metadata.tapTransactionId,
        tapChargeId: metadata.tapChargeId,
        failureReason: metadata.failureReason
      };
    } catch (error) {
      return null;
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Checking payment status...</p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (!paymentStatus) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-gray-500 text-6xl mb-4">❓</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Not Found</h1>
              <p className="text-gray-600 mb-6">The payment you're looking for could not be found.</p>
              <button
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const transactionInfo = getTransactionStatusInfo(paymentStatus.walletTransaction);
  const displayTapId = tapId || paymentStatus.tapTransactionId || transactionInfo?.tapTransactionId;

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {paymentStatus.paymentStatus === 'PAID' ? (
              <>
                <div className="text-green-500 text-6xl mb-4">✅</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 font-medium">
                    Amount: {paymentStatus.amount} {paymentStatus.currency}
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    {paymentStatus.description}
                  </p>
                </div>
                <p className="text-gray-600 mb-6">
                  {paymentStatus.isWalletTopUp 
                    ? 'Your wallet top-up has been processed successfully! The amount has been added to your wallet balance.' 
                    : 'Your payment has been processed successfully!'}
                </p>
                {paymentStatus.isWalletTopUp && paymentStatus.walletTransaction && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      💡 <strong>Wallet Transaction:</strong> {paymentStatus.walletTransaction.status === 'COMPLETED' 
                        ? 'Your wallet has been credited successfully!' 
                        : 'Your wallet transaction is being processed...'}
                    </p>
                  </div>
                )}
              </>
            ) : paymentStatus.paymentStatus === 'FAILED' ? (
              <>
                <div className="text-red-500 text-6xl mb-4">❌</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Failed</h1>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-medium">
                    Amount: {paymentStatus.amount} {paymentStatus.currency}
                  </p>
                  <p className="text-red-600 text-sm mt-1">
                    {paymentStatus.description}
                  </p>
                  {transactionInfo?.failureReason && (
                    <p className="text-red-600 text-sm mt-2">
                      Reason: {transactionInfo.failureReason}
                    </p>
                  )}
                </div>
                <p className="text-gray-600 mb-6">
                  Your payment could not be processed. Please try again.
                </p>
              </>
            ) : (
              <>
                <div className="text-yellow-500 text-6xl mb-4">⏳</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Processing</h1>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 font-medium">
                    Amount: {paymentStatus.amount} {paymentStatus.currency}
                  </p>
                  <p className="text-yellow-600 text-sm mt-1">
                    {paymentStatus.description}
                  </p>
                </div>
                <p className="text-gray-600 mb-6">
                  Your payment is being processed. You will receive a confirmation shortly.
                </p>
                {paymentStatus.isWalletTopUp && paymentStatus.walletTransaction && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      💡 <strong>Note:</strong> Your wallet transaction is currently in pending status. 
                      You can view the pending transaction in your wallet section.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {paymentStatus.isWalletTopUp ? 'Go to Wallet' : 'Go to Dashboard'}
              </button>
              
              {paymentStatus.paymentStatus === 'FAILED' && (
                <button
                  onClick={handleRetry}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Try Again
                </button>
              )}
            </div>

            {displayTapId && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Transaction ID: {displayTapId}
                </p>
                {transactionInfo?.tapChargeId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Charge ID: {transactionInfo.tapChargeId}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
} 