'use client';

import { useState, useEffect } from 'react';
import { PaymentMethod } from '@prisma/client';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/customer/stores/walletStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useToast } from '@/components/ui/Toast';

interface TopUpAndPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  orderId: number;
  amount: number;
  onPaymentComplete: () => void;
  returnUrl?: string; // Add return URL for seamless redirect
  orderPaymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'; // Add payment status
}

export default function TopUpAndPayModal({
  isOpen,
  onClose,
  orderNumber,
  orderId,
  amount,
  onPaymentComplete,
  returnUrl,
  orderPaymentStatus = 'PENDING',
}: TopUpAndPayModalProps) {
  const { customer } = useAuth();
  const { balance, fetchWalletInfo } = useWalletStore();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    if (customer?.id) {
      fetchWalletInfo(customer.id);
    }
  }, [customer?.id, fetchWalletInfo]);

  useEffect(() => {
    setWalletBalance(balance);
  }, [balance]);

  const handlePayment = async () => {
    const currentBalance = walletBalance;
    const needsTopUp = amount > currentBalance;
    
    if (needsTopUp) {
      // Should not reach here if needsTopUp is true
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/customer/manual-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          paymentMethod: 'WALLET',
          paymentReference: `Wallet payment for order ${orderNumber}`,
        }),
      });

      const data = await response.json() as { error?: string; success?: boolean; message?: string };

      if (data.error) {
        showToast(data.error, 'error');
      } else if (data.success) {
        showToast(data.message ?? 'Payment completed successfully!', 'success');
        onPaymentComplete();
        onClose();
      } else {
        showToast('Payment completed successfully!', 'success');
        onPaymentComplete();
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      showToast('Payment failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const totalRequired = amount;
  const currentBalance = walletBalance;
  const needsTopUp = totalRequired > currentBalance;
  const topUpNeeded = Math.max(0, totalRequired - currentBalance);
  const balanceAfterPayment = currentBalance - totalRequired;
  const isOrderPaid = orderPaymentStatus === 'PAID';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isOrderPaid ? 'Payment Complete' : needsTopUp ? 'Top Up & Pay' : 'Complete Payment'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Order #{orderNumber} - {formatCurrency(amount)}
          </p>
        </div>

        <div className="px-6 py-4">
          {/* Wallet Information */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Wallet Balance</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-900">
                {formatCurrency(currentBalance)}
              </span>
              <span className="text-sm text-blue-600">Current Balance</span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order Total:</span>
                <span className="font-medium">{formatCurrency(totalRequired)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Balance:</span>
                <span className="font-medium">{formatCurrency(currentBalance)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className={needsTopUp ? 'text-orange-600' : 'text-green-600'}>
                    {needsTopUp ? 'Top-up Required:' : 'Sufficient Balance'}
                  </span>
                  <span className={needsTopUp ? 'text-orange-600' : 'text-green-600'}>
                    {needsTopUp ? formatCurrency(topUpNeeded) : '✓'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isOrderPaid ? (
            // Show payment complete message when order is already paid
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-green-600 mr-2">✓</span>
                <h3 className="text-sm font-semibold text-green-900">Payment Complete</h3>
              </div>
              <p className="text-sm text-green-700">
                This order has been paid successfully. No further payment is required.
              </p>
            </div>
          ) : needsTopUp ? (
            // Show top-up guidance when insufficient balance
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-orange-600 mr-2">⚠️</span>
                <h3 className="text-sm font-semibold text-orange-900">Insufficient Balance</h3>
              </div>
              <p className="text-sm text-orange-700">
                Your wallet balance is insufficient. You need to add {formatCurrency(topUpNeeded)} to your wallet before making this payment.
              </p>
              <div className="mt-4">
                <a
                  href={`/customer/wallet?returnUrl=${encodeURIComponent(returnUrl || `/customer/orders/${orderId}?tab=invoice&topup=true`)}`}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
                >
                  Go to Wallet to Top Up
                </a>
              </div>
            </div>
          ) : (
            // Show payment confirmation when sufficient balance
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-green-600 mr-2">✓</span>
                <h3 className="text-sm font-semibold text-green-900">Sufficient Balance</h3>
              </div>
              <p className="text-sm text-green-700">
                Your wallet has sufficient balance to complete this payment. The amount will be deducted from your wallet.
              </p>
            </div>
          )}

          {/* Final Summary - Only show if sufficient balance */}
          {!needsTopUp && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-semibold text-green-900 mb-2">After Payment</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">New Balance:</span>
                  <span className="font-medium text-green-900">{formatCurrency(balanceAfterPayment)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handlePayment}
            disabled={loading || needsTopUp || isOrderPaid}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              loading || needsTopUp || isOrderPaid
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </div>
            ) : isOrderPaid ? (
              'Done'
            ) : needsTopUp ? (
              'Top Up Wallet First'
            ) : (
              `Pay ${formatCurrency(amount)} from Wallet`
            )}
          </button>

          {needsTopUp && !isOrderPaid && (
            <div className="mt-4 text-center">
              <button
                onClick={() => window.location.href = `/customer/wallet?returnUrl=${encodeURIComponent(returnUrl || `/customer/orders/${orderId}?tab=invoice&topup=true`)}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Go to Wallet to Top Up →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 