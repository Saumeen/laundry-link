'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getTapConfig } from '@/lib/config/tapConfig';

interface TapCardFormProps {
  amount: number;
  currency?: string;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  onTokenReceived: (token: string, cardDetails?: {
    lastFour?: string;
    brand?: string;
    expiryMonth?: string;
    expiryYear?: string;
  }) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

declare global {
  interface Window {
    CardSDK: {
      renderTapCard: (
        elementId: string,
        config: any
      ) => {
        unmount: () => void;
      };
      tokenize: () => Promise<any>;
      Theme: {
        LIGHT: string;
        DARK: string;
      };
      Currencies: {
        BHD: string;
        SAR: string;
        AED: string;
        KWD: string;
        OMR: string;
        QAR: string;
        EGP: string;
        USD: string;
        EUR: string;
        GBP: string;
      };
      Direction: {
        LTR: string;
        RTL: string;
      };
      Edges: {
        CURVED: string;
        ROUNDED: string;
        FLAT: string;
      };
      Locale: {
        EN: string;
        AR: string;
      };
    };
  }
}

export default function TapCardForm({
  amount,
  currency = 'BHD',
  customerData,
  onTokenReceived,
  onError,
  isLoading = false
}: TapCardFormProps) {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const [isCardReady, setIsCardReady] = useState(false);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [cardValidationState, setCardValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const { showToast } = useToast();
  const unmountRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Check if script is already loaded
    if (window.CardSDK) {
      initializeTapCard();
      return;
    }

    // Load Tap Card SDK script
    const config = getTapConfig();
    const script = document.createElement('script');
    script.src = config.sdkUrl;
    script.async = true;
    script.onload = initializeTapCard;
    script.onerror = () => {
      onError('Failed to load Tap Card SDK');
    };

    document.head.appendChild(script);

    return () => {
      if (unmountRef.current) {
        try {
          unmountRef.current();
        } catch (error) {
          console.warn('Error during Tap Card SDK cleanup:', error);
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
          console.warn('Error during Tap Card SDK cleanup:', error);
        }
      }
    };
  }, []);

  const initializeTapCard = () => {
    if (!window.CardSDK || !cardContainerRef.current) {
      return;
    }

    try {
      const { renderTapCard, Theme, Currencies, Direction, Edges, Locale } = window.CardSDK;

      const config = getTapConfig();
      
      // Clean up any existing instance
      if (unmountRef.current) {
        unmountRef.current();
      }

      const { unmount } = renderTapCard('tap-card-container', {
        publicKey: config.publicKey,
        merchant: {
          id: config.merchantId
        },
        transaction: {
          amount: amount,
          currency: Currencies[currency as keyof typeof Currencies] || Currencies.BHD
        },
        customer: {
          name: [
            {
              lang: Locale.EN,
              first: customerData.firstName,
              last: customerData.lastName,
              middle: ''
            }
          ],
          nameOnCard: `${customerData.firstName} ${customerData.lastName}`,
          editable: true,
          contact: {
            email: customerData.email,
            phone: customerData.phone ? {
              countryCode: config.countryCode,
              number: customerData.phone.replace(/\D/g, '')
            } : undefined
          }
        },
        acceptance: {
          supportedBrands: config.supportedBrands,
          supportedCards: config.supportedCards
        },
        fields: {
          cardHolder: true
        },
        addons: {
          displayPaymentBrands: true,
          loader: true,
          saveCard: true
        },
        interface: {
          locale: Locale.EN,
          theme: Theme.LIGHT,
          edges: Edges.CURVED,
          direction: Direction.LTR
        },
        onReady: () => {
          console.log('Tap Card SDK is ready');
          setIsCardReady(true);
          setCardValidationState('idle');
        },
        onFocus: () => {
          console.log('Card field focused');
        },
        onBinIdentification: (data: any) => {
          console.log('BIN identification:', data);
        },
        onValidInput: (data: any) => {
          console.log('Valid input:', data);
          setCardValidationState('valid');
          setIsCardReady(true);
        },
        onInvalidInput: (data: any) => {
          console.log('Invalid input:', data);
          setCardValidationState('invalid');
          // Don't treat this as an error - it's just validation feedback
          // The card might still be valid when the user completes entering it
        },
        onError: (data: any) => {
          console.error('Tap Card SDK error:', data);
          // Only treat as error if it's a critical error, not just validation feedback
          if (data?.code && data.code !== 'VALIDATION_ERROR') {
            const errorMessage = data?.message || data?.error || 'Card validation error';
            onError(errorMessage);
          }
        },
        onSuccess: (data: any) => {
          console.log('Card tokenization successful:', data);
          setCardValidationState('valid');
          if (data?.id) {
            // Extract card details if available
            const cardDetails = data.source?.card ? {
              lastFour: data.source.card.last4,
              brand: data.source.card.brand,
              expiryMonth: data.source.card.exp_month?.toString(),
              expiryYear: data.source.card.exp_year?.toString()
            } : undefined;
            
            onTokenReceived(data.id, cardDetails);
          } else {
            onError('Token generation failed - no token ID received');
          }
        },
        onChangeSaveCardLater: (isSaveCardSelected: boolean) => {
          console.log('Save card preference changed:', isSaveCardSelected);
        }
      });

      unmountRef.current = unmount;
    } catch (error) {
      console.error('Error initializing Tap Card SDK:', error);
      onError('Failed to initialize payment form');
    }
  };

  const handleSubmit = async () => {
    if (!isCardReady || isLoading || isTokenizing) {
      return;
    }

    setIsTokenizing(true);
    try {
      if (window.CardSDK && window.CardSDK.tokenize) {
        await window.CardSDK.tokenize();
      } else {
        throw new Error('Tap Card SDK not loaded or tokenize method not available');
      }
    } catch (error) {
      console.error('Error tokenizing card:', error);
      onError('Failed to process card details');
    } finally {
      setIsTokenizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card Form Container */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Details
          </h3>
          <p className="text-sm text-gray-600">
            Enter your card information to verify your payment method
          </p>
          {cardValidationState === 'valid' && (
            <div className="mt-2 flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Card details look good!</span>
            </div>
          )}
        </div>
        
        <div 
          id="tap-card-container" 
          ref={cardContainerRef}
          className="min-h-[200px]"
        />
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isCardReady || isLoading || isTokenizing}
        className={`w-full py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
          cardValidationState === 'valid' 
            ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' 
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
        }`}
      >
        {isTokenizing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            Verifying Card...
          </div>
        ) : isLoading ? (
          'Processing Payment...'
        ) : cardValidationState === 'valid' ? (
          `Verify Card - ${amount.toFixed(3)} BHD`
        ) : (
          `Enter Card Details - ${amount.toFixed(3)} BHD`
        )}
      </button>

      {/* Security Notice */}
      <div className="text-center">
        <div className="flex items-center justify-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Your payment information is secure and encrypted
        </div>
      </div>
    </div>
  );
} 