'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/customer/stores/walletStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useToast } from '@/components/ui/Toast';
import CardPaymentForm from '@/components/CardPaymentForm';
import SplitPaymentForm from '@/components/SplitPaymentForm';

interface DirectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  orderId: number;
  amount: number;
  onPaymentComplete: () => void;
}

type PaymentMethod = 'WALLET' | 'CARD' | 'SPLIT';

export default function DirectPaymentModal({
  isOpen,
  onClose,
  orderNumber,
  orderId,
  amount,
  onPaymentComplete,
}: DirectPaymentModalProps) {
  const { customer } = useAuth();
  const { balance, fetchWalletInfo } = useWalletStore();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('WALLET');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [splitPaymentAmounts, setSplitPaymentAmounts] = useState({
    walletAmount: 0,
    cardAmount: 0,
  });

  useEffect(() => {
    if (customer?.id) {
      fetchWalletInfo(customer.id);
    }
  }, [customer?.id, fetchWalletInfo]);

  useEffect(() => {
    setWalletBalance(balance);
    
    // Auto-select payment method based on balance
    if (balance >= amount) {
      setSelectedPaymentMethod('WALLET');
    } else if (balance > 0) {
      setSelectedPaymentMethod('SPLIT');
      // Pre-fill split payment amounts - use full wallet balance
      setSplitPaymentAmounts({
        walletAmount: balance,
        cardAmount: amount - balance,
      });
    } else {
      setSelectedPaymentMethod('CARD');
    }
  }, [balance, amount]);

  // Update split payment amounts when payment method changes
  useEffect(() => {
    if (selectedPaymentMethod === 'SPLIT' && walletBalance > 0) {
      setSplitPaymentAmounts({
        walletAmount: walletBalance,
        cardAmount: amount - walletBalance,
      });
    }
  }, [selectedPaymentMethod, walletBalance, amount]);

  const canPayWithWallet = walletBalance >= amount;
  const balanceAfterPayment = walletBalance - amount;

  const handleWalletPayment = async () => {
    if (!canPayWithWallet) {
      showToast('Insufficient wallet balance', 'error');
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

      const data = await response.json() as { 
        error?: string; 
        success?: boolean; 
        message?: string;
        paymentRecord?: any;
        walletTransaction?: any;
      };

      if (data.error) {
        showToast(data.error, 'error');
      } else {
        // Refresh wallet balance after successful payment
        if (customer?.id) {
          await fetchWalletInfo(customer.id);
        }
        
        showToast(data.message || 'Payment completed successfully!', 'success');
        onPaymentComplete();
        onClose();
      }
    } catch (error) {
      console.error('Wallet payment error:', error);
      showToast('Payment failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPaymentSuccess = () => {
    showToast('Payment completed successfully!', 'success');
    onPaymentComplete();
    onClose();
  };

  const handleCardPaymentPending = () => {
    showToast('Payment initiated successfully! We are verifying your payment status. This may take a few moments. You will receive a confirmation once it\'s completed.', 'info');
    onPaymentComplete();
    onClose();
  };

  const handleCardPaymentError = (error: string) => {
    showToast(error || 'Payment failed. Please try again.', 'error');
  };

  const handleSplitPayment = async (tokenId: string) => {
    if (!customer) {
      showToast('Customer information not available', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/customer/direct-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          walletAmount: splitPaymentAmounts.walletAmount,
          cardAmount: splitPaymentAmounts.cardAmount,
          tokenId,
          customerData: {
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            email: customer.email || '',
            phone: customer.phone || '',
          },
          isSplitPayment: true,
        }),
      });

      const data = await response.json() as { 
        error?: string; 
        success?: boolean; 
        message?: string;
        status?: string;
        redirectUrl?: string;
        paymentRecord?: any;
        walletPayment?: any;
        order?: any;
      };

      if (data.error) {
        showToast(data.error, 'error');
      } else if (data.success) {
        // Check if payment requires redirect (3D Secure/Authentication)
        if (data.status === 'redirect_required' && data.redirectUrl) {
          showToast('Redirecting to payment gateway for authentication...', 'info');
          
          // Store additional payment context
          if (customer?.id) {
            localStorage.setItem(`splitPaymentInProgress_${customer.id}`, JSON.stringify({
              orderId,
              orderNumber,
              amount,
              walletAmount: splitPaymentAmounts.walletAmount,
              cardAmount: splitPaymentAmounts.cardAmount,
              paymentRecord: data.paymentRecord,
              walletPayment: data.walletPayment,
              timestamp: Date.now()
            }));
          }
          
          // Redirect to payment gateway
          window.location.href = data.redirectUrl;
        } else if (data.status === 'pending') {
          showToast('Split payment initiated successfully! We are verifying your payment status. This may take a few moments.', 'info');
          onPaymentComplete();
          onClose();
        } else {
          // Refresh wallet balance after successful payment
          if (customer?.id) {
            await fetchWalletInfo(customer.id);
          }
          
          showToast(data.message || 'Split payment completed successfully!', 'success');
          onPaymentComplete();
          onClose();
        }
      }
    } catch (error) {
      console.error('Split payment error:', error);
      showToast('Payment failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPaymentRedirect = (redirectUrl: string, paymentRecord: any) => {
    showToast('Redirecting to payment gateway for authentication...', 'info');
    
    // Store additional payment context
    if (customer?.id) {
      localStorage.setItem(`directPaymentInProgress_${customer.id}`, JSON.stringify({
        orderId,
        orderNumber,
        amount,
        paymentRecord,
        timestamp: Date.now()
      }));
    }
    
    // Redirect to payment gateway
    window.location.href = redirectUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Complete Payment
            </h2>
            <button
              onClick={onClose}
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
          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Method</h3>
            <div className="space-y-3">
              {/* Wallet Payment Option */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPaymentMethod === 'WALLET'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => canPayWithWallet && setSelectedPaymentMethod('WALLET')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedPaymentMethod === 'WALLET'}
                      onChange={() => canPayWithWallet && setSelectedPaymentMethod('WALLET')}
                      disabled={!canPayWithWallet}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Wallet Balance</div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(walletBalance)} available
                      </div>
                    </div>
                  </div>
                  {canPayWithWallet ? (
                    <span className="text-green-600 text-sm">✓ Available</span>
                  ) : (
                    <span className="text-red-600 text-sm">Insufficient</span>
                  )}
                </div>
              </div>

              {/* Split Payment Option */}
              {walletBalance > 0 && walletBalance < amount && (
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaymentMethod === 'SPLIT'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('SPLIT')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={selectedPaymentMethod === 'SPLIT'}
                        onChange={() => setSelectedPaymentMethod('SPLIT')}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Split Payment</div>
                        <div className="text-sm text-gray-600">
                          Use wallet ({formatCurrency(walletBalance)}) + card for remaining
                        </div>
                      </div>
                    </div>
                    <span className="text-blue-600 text-sm">✓ Available</span>
                  </div>
                </div>
              )}

              {/* Card Payment Option */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPaymentMethod === 'CARD'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPaymentMethod('CARD')}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={selectedPaymentMethod === 'CARD'}
                    onChange={() => setSelectedPaymentMethod('CARD')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Credit/Debit Card</div>
                    <div className="text-sm text-gray-600">
                      Pay securely with your card
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order Total:</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
              {selectedPaymentMethod === 'WALLET' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-medium">{formatCurrency(walletBalance)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Balance After Payment:</span>
                      <span className="font-medium">{formatCurrency(balanceAfterPayment)}</span>
                    </div>
                  </div>
                </>
              )}
              {selectedPaymentMethod === 'SPLIT' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Wallet Payment:</span>
                    <span className="font-medium">{formatCurrency(splitPaymentAmounts.walletAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Card Payment:</span>
                    <span className="font-medium">{formatCurrency(splitPaymentAmounts.cardAmount)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Wallet Balance After:</span>
                      <span className="font-medium">{formatCurrency(walletBalance - splitPaymentAmounts.walletAmount)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Split Payment Amount Adjustment */}
          {selectedPaymentMethod === 'SPLIT' && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Payment Amounts</h4>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Auto-populated
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Using your full wallet balance ({formatCurrency(walletBalance)}) and paying the remaining amount with your card.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Wallet Amount</label>
                  <input
                    type="number"
                    min="0"
                    max={walletBalance}
                    step="0.01"
                    value={splitPaymentAmounts.walletAmount}
                    onChange={(e) => {
                      const walletAmount = Math.min(parseFloat(e.target.value) || 0, walletBalance);
                      const cardAmount = Math.max(amount - walletAmount, 0);
                      setSplitPaymentAmounts({
                        walletAmount,
                        cardAmount,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {formatCurrency(walletBalance)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Card Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={splitPaymentAmounts.cardAmount}
                    onChange={(e) => {
                      const cardAmount = Math.max(parseFloat(e.target.value) || 0, 0);
                      const walletAmount = Math.min(amount - cardAmount, walletBalance);
                      setSplitPaymentAmounts({
                        walletAmount,
                        cardAmount,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className={`text-xs ${Math.abs((splitPaymentAmounts.walletAmount + splitPaymentAmounts.cardAmount) - amount) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                  Total: {formatCurrency(splitPaymentAmounts.walletAmount + splitPaymentAmounts.cardAmount)} / {formatCurrency(amount)}
                  {Math.abs((splitPaymentAmounts.walletAmount + splitPaymentAmounts.cardAmount) - amount) < 0.01 ? ' ✓' : ' ✗'}
                </div>
              </div>
            </div>
          )}

          {/* Payment Form */}
          {selectedPaymentMethod === 'WALLET' ? (
            <div className="mb-6">
              <button
                onClick={handleWalletPayment}
                disabled={loading || !canPayWithWallet}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  loading || !canPayWithWallet
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  `Pay ${formatCurrency(amount)} from Wallet`
                )}
              </button>
            </div>
          ) : selectedPaymentMethod === 'SPLIT' ? (
            <div>
              {Math.abs((splitPaymentAmounts.walletAmount + splitPaymentAmounts.cardAmount) - amount) < 0.01 ? (
                <SplitPaymentForm
                  orderId={orderId}
                  orderNumber={orderNumber}
                  amount={splitPaymentAmounts.cardAmount}
                  customerData={{
                    firstName: customer?.firstName || '',
                    lastName: customer?.lastName || '',
                    email: customer?.email || '',
                    phone: customer?.phone || '',
                  }}
                  onSuccess={handleSplitPayment}
                  onPending={handleCardPaymentPending}
                  onError={handleCardPaymentError}
                  onRedirectRequired={handleCardPaymentRedirect}
                  loading={loading}
                  setLoading={setLoading}
                />
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    Please adjust the payment amounts to match the total order amount.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <CardPaymentForm
              orderId={orderId}
              orderNumber={orderNumber}
              amount={amount}
              customerData={{
                firstName: customer?.firstName || '',
                lastName: customer?.lastName || '',
                email: customer?.email || '',
                phone: customer?.phone || '',
              }}
              onSuccess={handleCardPaymentSuccess}
              onPending={handleCardPaymentPending}
              onError={handleCardPaymentError}
              onRedirectRequired={handleCardPaymentRedirect}
              loading={loading}
              setLoading={setLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}