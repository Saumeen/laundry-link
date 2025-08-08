'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { PaymentMethod, OrderStatus } from '@prisma/client';
import { useWalletStore } from '@/customer/stores/walletStore';
import { useAuth } from '@/hooks/useAuth';

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  orderId: number;
  amount: number;
  orderStatus?: OrderStatus;
  onPaymentComplete: () => void;
}

const PAYMENT_METHODS = [
  {
    id: PaymentMethod.CARD,
    name: 'Card Payment',
    description: 'Pay via card on delivery or at facility',
    icon: '💳',
    instructions: [
      'Pay with card to the driver on delivery',
      'Or visit our facility during business hours',
      'Bring your credit/debit card',
      'Payment accepted in BHD only',
      'Receipt will be provided immediately',
    ],
  },
];

export default function ManualPaymentModal({
  isOpen,
  onClose,
  orderNumber,
  orderId,
  amount,
  orderStatus,
  onPaymentComplete,
}: ManualPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [canPayWithWallet, setCanPayWithWallet] = useState(false);
  
  const { customer } = useAuth();
  const { balance } = useWalletStore();

  useEffect(() => {
    if (isOpen && customer?.id) {
      // Fetch wallet balance
      setWalletBalance(balance);
      setCanPayWithWallet(balance >= amount);
    }
  }, [isOpen, customer?.id, balance, amount]);

  const handlePaymentComplete = async () => {
    if (!selectedMethod || !paymentReference.trim()) {
      alert('Please select a payment method and provide payment reference');
      return;
    }

    if (!canPayWithWallet) {
      alert('Insufficient wallet balance. Please top up your wallet first.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/customer/manual-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          paymentMethod: selectedMethod,
          paymentReference: paymentReference,
          amount: amount,
        }),
      });

      const data = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      onPaymentComplete();
      onClose();
    } catch (error) {
      console.error('Payment processing error:', error);
      alert(error instanceof Error ? error.message : 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPaymentMethod = PAYMENT_METHODS.find(method => method.id === selectedMethod);

  const isDeliveryPayment = orderStatus === OrderStatus.DELIVERED || 
                           orderStatus === OrderStatus.DELIVERY_IN_PROGRESS ||
                           orderStatus === OrderStatus.READY_FOR_DELIVERY ||
                           orderStatus === OrderStatus.DELIVERY_ASSIGNED;

  const getModalTitle = () => {
    if (orderStatus === OrderStatus.DELIVERED) {
      return 'Payment for Delivered Order';
    } else if (isDeliveryPayment) {
      return 'Payment on Delivery';
    }
    return 'Wallet Payment';
  };

  const getPaymentInstructions = () => {
    if (orderStatus === OrderStatus.DELIVERED) {
      return 'Your order has been delivered. Please complete the payment to finalize your order.';
    } else if (orderStatus === OrderStatus.DELIVERY_IN_PROGRESS) {
      return 'Your order is being delivered. Payment will be collected by the driver.';
    } else if (orderStatus === OrderStatus.READY_FOR_DELIVERY || orderStatus === OrderStatus.DELIVERY_ASSIGNED) {
      return 'Your order is ready for delivery. Payment will be collected upon delivery.';
    }
    return 'Complete your payment using your wallet balance.';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{getModalTitle()}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            Order #{orderNumber} - {formatCurrency(amount)}
          </p>
          <p className="text-sm text-blue-600 mt-2">
            {getPaymentInstructions()}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Delivery Status Info */}
          {isDeliveryPayment && (
            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center">
                <span className="text-orange-600 mr-2">🚚</span>
                <div>
                  <h3 className="text-sm font-semibold text-orange-900">Delivery Payment</h3>
                  <p className="text-sm text-orange-700">
                    {orderStatus === OrderStatus.DELIVERED 
                      ? 'Order has been delivered. Please complete payment.'
                      : 'Payment will be collected by the driver upon delivery.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Balance */}
          <div className="mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Wallet Balance</h3>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Available Balance:</span>
                <span className="text-xl font-bold text-blue-900">{formatCurrency(walletBalance)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-blue-700">Payment Amount:</span>
                <span className="text-lg font-semibold text-blue-900">{formatCurrency(amount)}</span>
              </div>
              {canPayWithWallet ? (
                <div className="mt-2 p-2 bg-green-100 rounded">
                  <p className="text-green-800 text-sm font-medium">✓ Sufficient balance for payment</p>
                </div>
              ) : (
                <div className="mt-2 p-2 bg-red-100 rounded">
                  <p className="text-red-800 text-sm font-medium">✗ Insufficient balance. Please top up your wallet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{method.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Instructions */}
          {selectedPaymentMethod && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Payment Instructions
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {selectedPaymentMethod.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-gray-700">{instruction}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    Important: Always include your order number ({orderNumber}) as reference when making payment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Reference */}
          {selectedMethod && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Payment Reference
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="paymentReference" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Reference/Transaction ID
                  </label>
                  <input
                    type="text"
                    id="paymentReference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Enter your payment reference or transaction ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This helps us track your payment. If paying cash, enter "CASH".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-medium">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Due:</span>
                <span className="font-medium text-lg">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Source:</span>
                <span className="font-medium text-green-600">Wallet Balance</span>
              </div>
              {selectedPaymentMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{selectedPaymentMethod.name}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance After Payment:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(walletBalance - amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePaymentComplete}
            disabled={!selectedMethod || !paymentReference.trim() || isProcessing || !canPayWithWallet}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : `Pay ${formatCurrency(amount)} from Wallet`}
          </button>
        </div>
      </div>
    </div>
  );
} 