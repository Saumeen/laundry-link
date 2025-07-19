'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePhoneVerification } from '@/lib/phoneVerification';

interface PhoneVerificationProps {
  phoneNumber: string;
  onVerificationSuccess: (phoneNumber: string) => void;
  onVerificationError: (error: string) => void;
  onCancel: () => void;
}

const PhoneVerification = ({
  phoneNumber,
  onVerificationSuccess,
  onVerificationError,
  onCancel
}: PhoneVerificationProps) => {
  const [step, setStep] = useState<'sending' | 'verifying' | 'success'>('sending');
  const [verificationCode, setVerificationCode] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const [nextRetryTime, setNextRetryTime] = useState<number | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isLoading,
    error,
    initializeRecaptcha,
    sendVerificationCode,
    verifyCode,
    clearRecaptcha
  } = usePhoneVerification();

  // Calculate backoff delay: 2s, 4s, 8s
  const getBackoffDelay = (attempt: number): number => {
    return Math.min(2000 * Math.pow(2, attempt), 8000);
  };

  // Initialize reCAPTCHA when component mounts
  const initializeRecaptchaLocal = useCallback(async () => {
    try {
      if (!recaptchaContainerRef.current) {
        onVerificationError('reCAPTCHA container not found');
        return;
      }

      await initializeRecaptcha('recaptcha-container');
    } catch (error) {
      onVerificationError('Failed to initialize phone verification');
    }
  }, [initializeRecaptcha, onVerificationError, phoneNumber]);

  // Attempt to send verification code
  const attemptSendCode = useCallback(async (isRetry: boolean = false) => {
    try {
      const result = await sendVerificationCode(phoneNumber);
      if (result.success) {
        setStep('verifying');
        setIsAutoRetrying(false);
        setRetryCount(0);
        setNextRetryTime(null);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      } else {
        // If it's a retry and we haven't exceeded max attempts, schedule next retry
        if (isRetry && retryCount < 2) {
          const nextAttempt = retryCount + 1;
          const delay = getBackoffDelay(nextAttempt);
          setRetryCount(nextAttempt);
          setNextRetryTime(Date.now() + delay);
          
          retryTimeoutRef.current = setTimeout(() => {
            attemptSendCode(true);
          }, delay);
        } else if (isRetry && retryCount >= 2) {
          // Max retries reached, stop auto-retrying
          setIsAutoRetrying(false);
          setNextRetryTime(null);
        }
      }
    } catch (error) {
      if (isRetry && retryCount < 2) {
        const nextAttempt = retryCount + 1;
        const delay = getBackoffDelay(nextAttempt);
        setRetryCount(nextAttempt);
        setNextRetryTime(Date.now() + delay);
        
        retryTimeoutRef.current = setTimeout(() => {
          attemptSendCode(true);
        }, delay);
      } else if (isRetry && retryCount >= 2) {
        setIsAutoRetrying(false);
        setNextRetryTime(null);
      }
    }
  }, [phoneNumber, sendVerificationCode, retryCount]);

  // Start verification when component mounts
  useEffect(() => {
    const startVerification = async () => {
      await initializeRecaptchaLocal();
      setIsAutoRetrying(true);
      setRetryCount(0);
      // Start first attempt immediately
      attemptSendCode(true);
    };
    
    startVerification();

    // Cleanup on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Manual trigger for sending verification code
  const handleManualTrigger = useCallback(async () => {
    // Clear any existing retry attempts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setIsAutoRetrying(true);
    setRetryCount(0);
    setNextRetryTime(null);
    
    // Start fresh retry attempts
    attemptSendCode(true);
  }, [attemptSendCode]);

  // Handle code verification
  const handleVerifyCode = useCallback(async () => {
    if (!verificationCode.trim()) {
      onVerificationError('Please enter the verification code');
      return;
    }

    try {
      const result = await verifyCode(verificationCode);
      if (result.success) {
        setStep('success');
        onVerificationSuccess(result.phoneNumber || phoneNumber);
      } else {
        onVerificationError(result.error || 'Invalid verification code');
      }
    } catch (error) {
      onVerificationError('Failed to verify code');
    }
  }, [verificationCode, verifyCode, onVerificationSuccess, onVerificationError, phoneNumber]);

  // Handle resend code
  const handleResendCode = useCallback(async () => {
    setVerificationCode('');
    setStep('sending');
    setRetryCount(0);
    setIsAutoRetrying(true);
    setNextRetryTime(null);
    
    // Clear any existing retry attempts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    await initializeRecaptchaLocal(); // Re-initialize reCAPTCHA for resend
    attemptSendCode(true); // Start fresh retry attempts
  }, [initializeRecaptchaLocal, attemptSendCode]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    clearRecaptcha();
    onCancel();
  }, [clearRecaptcha, onCancel]);

  // Format countdown timer
  const formatCountdown = () => {
    if (!nextRetryTime) return '';
    const remaining = Math.max(0, Math.ceil((nextRetryTime - Date.now()) / 1000));
    return remaining > 0 ? `${remaining}s` : '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Verify Phone Number</h3>
        
        {/* reCAPTCHA container */}
        <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

        {step === 'sending' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-4">
              Sending verification code to {phoneNumber}...
            </p>
            
            {isAutoRetrying && retryCount > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Attempt {retryCount + 1} of 3
                </p>
                {nextRetryTime && (
                  <p className="text-sm text-blue-600">
                    Next attempt in {formatCountdown()}
                  </p>
                )}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mb-4">
              {isAutoRetrying ? 
                'Automatically retrying...' : 
                'If the verification doesn\'t start automatically, click the button below.'
              }
            </p>
            
            <button
              onClick={handleManualTrigger}
              disabled={isLoading || isAutoRetrying}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? 'Sending...' : isAutoRetrying ? 'Retrying Automatically...' : 'Send Code Manually'}
            </button>
            
            {error && (
              <div className="mb-4">
                <p className="text-red-600 text-sm mb-2">{error}</p>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 underline"
                >
                  Go back and change phone number
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'verifying' && (
          <div>
            <p className="text-gray-600 mb-4">
              Enter the 6-digit verification code sent to {phoneNumber}. Phone verification is required to create your account.
            </p>
            
            <div className="mb-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="mb-4">
                <p className="text-red-600 text-sm mb-2">{error}</p>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 underline"
                >
                  Go back and change phone number
                </button>
              </div>
            )}

            <button
              onClick={handleVerifyCode}
              disabled={isLoading || !verificationCode.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="mt-4 text-center">
              <button
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
              >
                Resend Code
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center">
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <p className="text-gray-600 mb-4">
              Phone number verified successfully!
            </p>
            <button
              onClick={() => onVerificationSuccess(phoneNumber)}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneVerification; 