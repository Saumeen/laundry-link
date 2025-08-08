'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import TapCardForm from '@/components/ui/TapCardForm';

interface SplitPaymentFormProps {
  orderId: number;
  orderNumber: string;
  amount: number;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  onSuccess: (tokenId: string) => void;
  onPending?: () => void;
  onError: (error: string) => void;
  onRedirectRequired?: (redirectUrl: string, paymentRecord: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function SplitPaymentForm({
  orderId,
  orderNumber,
  amount,
  customerData,
  onSuccess,
  onPending,
  onError,
  onRedirectRequired,
  loading,
  setLoading,
}: SplitPaymentFormProps) {
  const [tokenId, setTokenId] = useState<string>('');

  const handleTokenReceived = (token: string) => {
    setTokenId(token);
    // Call the parent's onSuccess with the token for split payment processing
    onSuccess(token);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          Pay {formatCurrency(amount)} with your card to complete the split payment
        </p>
      </div>
      
      <TapCardForm
        amount={amount}
        currency="BHD"
        customerData={customerData}
        onTokenReceived={handleTokenReceived}
        onError={onError}
        isLoading={loading}
      />

      {/* Security Note */}
      <div className="text-xs text-gray-500 text-center">
        🔒 Your payment information is encrypted and secure
      </div>
    </div>
  );
} 