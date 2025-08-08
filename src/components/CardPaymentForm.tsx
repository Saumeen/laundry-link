'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import TapCardForm from '@/components/ui/TapCardForm';

interface CardPaymentFormProps {
  orderId: number;
  orderNumber: string;
  amount: number;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  onSuccess: () => void;
  onPending?: () => void;
  onError: (error: string) => void;
  onRedirectRequired?: (redirectUrl: string, paymentRecord: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function CardPaymentForm({
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
}: CardPaymentFormProps) {
  const [tokenId, setTokenId] = useState<string>('');

  const handleTokenReceived = (token: string) => {
    setTokenId(token);
    processPayment(token);
  };

  const processPayment = async (token: string) => {
    setLoading(true);

    try {
      // Call the direct payment API with the encrypted token
      const response = await fetch('/api/customer/direct-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          tokenId: token,
          customerData,
        }),
      });

      let data: { 
        success?: boolean; 
        error?: string; 
        message?: string; 
        status?: string;
        redirectUrl?: string;
        paymentRecord?: any;
        order?: any;
      } = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse API response as JSON:', jsonError);
        // Note: Can't read response.text() again after trying json(), 
        // so we'll just log the parse error
        throw new Error('Invalid response from payment service. Please try again.');
      }

      if (!response.ok) {
        console.error('Payment API response:', { 
          status: response.status, 
          statusText: response.statusText,
          data 
        });
        
        const errorMessage = data.error || data.message || 
          `Payment processing failed (${response.status}). Please try again.`;
        
        // Provide more specific error messages for common issues
        if (errorMessage.includes('not properly configured')) {
          throw new Error('Payment system is temporarily unavailable. Please contact support.');
        } else if (errorMessage.includes('Unauthorized')) {
          throw new Error('Payment authorization failed. Please contact support.');
        } else if (errorMessage.includes('declined')) {
          throw new Error('Payment was declined. Please check your card details and try again.');
        } else if (errorMessage.includes('Bad Request') || response.status === 400) {
          throw new Error('Invalid payment information. Please check your details and try again.');
        }
        
        throw new Error(errorMessage);
      }

      if (data.success) {
        // Check if payment requires redirect (3D Secure/Authentication)
        if (data.status === 'redirect_required' && data.redirectUrl) {
          console.log('Payment requires redirect to:', data.redirectUrl);
          
          // Store payment details for when user returns
          if (data.paymentRecord) {
            localStorage.setItem('pendingDirectPayment', JSON.stringify({
              paymentRecord: data.paymentRecord,
              order: data.order,
              timestamp: Date.now(),
              orderId,
              orderNumber,
              amount
            }));
          }
          
          // Call the redirect handler
          onRedirectRequired?.(data.redirectUrl, data.paymentRecord);
        }
        // Check if payment is pending (initiated)
        else if (data.status === 'pending') {
          onPending?.();
        } else {
          onSuccess();
        }
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Card payment error:', error);
      onError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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