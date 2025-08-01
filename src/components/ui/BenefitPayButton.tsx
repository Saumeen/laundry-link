'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getTapConfig } from '@/lib/config/tapConfig';

interface BenefitPayButtonProps {
  amount: number;
  currency?: string;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  onTokenReceived: (token: string, paymentDetails?: Record<string, unknown>) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  transactionReference?: string;
}

declare global {
  interface Window {
    BenefitPayButton: {
      render: (element: HTMLElement, config: Record<string, unknown>) => { unmount: () => void };
    };
    Edges: {
      CURVED: string;
      STRAIGHT: string;
    };
    Locale: {
      EN: string;
      AR: string;
    };
  }
}

export default function BenefitPayButton({
  amount,
  currency = 'BHD',
  customerData,
  onTokenReceived,
  onError,
  isLoading = false,
  transactionReference
}: BenefitPayButtonProps) {
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [isButtonReady, setIsButtonReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();
  const unmountRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Check if script is already loaded
    if (window.BenefitPayButton) {
      initializeBenefitPay();
      return;
    }

    // Load Benefit Pay SDK script
    const script = document.createElement('script');
    script.src = 'https://cdn.tap.company/benefit-pay-button/1.0.0/index.js';
    script.async = true;
    script.onload = initializeBenefitPay;
    script.onerror = () => {
      onError('Failed to load Benefit Pay SDK');
    };

    document.head.appendChild(script);

    return () => {
      if (unmountRef.current) {
        try {
          unmountRef.current();
        } catch (error) {
          console.warn('Error during Benefit Pay SDK cleanup:', error);
        }
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unmountRef.current) {
        try {
          unmountRef.current();
        } catch (error) {
          console.warn('Error during Benefit Pay SDK cleanup:', error);
        }
      }
    };
  }, []);

  const generateHashString = async () => {
    try {
      const config = getTapConfig();
      const amountFormatted = amount.toFixed(3);
      const ref = transactionReference || `txn_${Date.now()}`;
      const postUrl = `${window.location.origin}/api/payment/benefit-pay-webhook`;
      
      // Generate hash string server-side for security
      const response = await fetch('/api/payment/generate-hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: config.publicKey,
          amount: amountFormatted,
          currency: currency,
          transactionReference: ref,
          postUrl: postUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate hash string');
      }

      const data = await response.json() as { hashString: string };
      return data.hashString;
    } catch (error) {
      console.error('Error generating hash string:', error);
      throw new Error('Failed to generate security hash');
    }
  };

  const initializeBenefitPay = async () => {
    if (!window.BenefitPayButton || !buttonContainerRef.current) {
      return;
    }

    try {
      const config = getTapConfig();
      const hashString = await generateHashString();
      
      // Clean up any existing instance
      if (unmountRef.current) {
        unmountRef.current();
      }

      const benefitPayConfig = {
        operator: {
          publicKey: config.publicKey,
          hashString: hashString
        },
        debug: process.env.NODE_ENV === 'development',
        merchant: {
          id: config.merchantId
        },
        transaction: {
          amount: amount.toFixed(3),
          currency: currency,
          metadata: {
            udf1: 'wallet_topup',
            udf2: 'benefit_pay'
          }
        },
        reference: {
          transaction: transactionReference || `txn_${Date.now()}`,
          order: `ord_${Date.now()}`
        },
        customer: {
          names: [
            {
              lang: window.Locale?.EN || 'EN',
              first: customerData.firstName,
              last: customerData.lastName,
              middle: ''
            }
          ],
          contact: {
            email: customerData.email,
            phone: customerData.phone ? {
              countryCode: '+973',
              number: customerData.phone.replace(/\D/g, '')
            } : undefined
          }
        },
        interface: {
          locale: window.Locale?.EN || 'EN',
          edges: window.Edges?.CURVED || 'curved'
        },
        post: {
          url: `${window.location.origin}/api/payment/benefit-pay-webhook`
        },
        onReady: () => {
          console.log('Benefit Pay button is ready');
          setIsButtonReady(true);
        },
        onClick: () => {
          console.log('Benefit Pay button clicked');
          setIsProcessing(true);
        },
        onCancel: () => {
          console.log('Benefit Pay payment cancelled');
          setIsProcessing(false);
          showToast('Payment was cancelled', 'info');
        },
        onError: (error: Record<string, unknown>) => {
          console.error('Benefit Pay error:', error);
          setIsProcessing(false);
          const errorMessage = (error?.message as string) || (error?.error as string) || 'Benefit Pay payment failed';
          onError(errorMessage);
        },
        onSuccess: (data: Record<string, unknown>) => {
          console.log('Benefit Pay payment successful:', data);
          setIsProcessing(false);
          if (data?.id) {
            onTokenReceived(data.id as string, {
              paymentMethod: 'BENEFIT_PAY',
              transactionId: data.id as string,
              amount: amount,
              currency: currency
            });
          } else {
            onError('Payment successful but no transaction ID received');
          }
        }
      };

      // Render the Benefit Pay button
      const { unmount } = window.BenefitPayButton.render(buttonContainerRef.current, benefitPayConfig);
      unmountRef.current = unmount;

    } catch (error) {
      console.error('Error initializing Benefit Pay SDK:', error);
      onError('Failed to initialize Benefit Pay');
    }
  };

  return (
    <div className="space-y-6">
      {/* Benefit Pay Button Container */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Benefit Pay
          </h3>
          <p className="text-sm text-gray-600">
            Pay securely using Benefit Pay mobile app
          </p>
        </div>
        
        <div 
          ref={buttonContainerRef}
          className="min-h-[60px] flex items-center justify-center"
        >
          {!isButtonReady && (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-2"></div>
              <span className="text-gray-600">Loading Benefit Pay...</span>
            </div>
          )}
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2"></div>
            <span className="text-blue-800 text-sm">
              Processing Benefit Pay payment...
            </span>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="text-center">
        <div className="flex items-center justify-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Secure payment powered by Benefit Pay
        </div>
      </div>
    </div>
  );
} 