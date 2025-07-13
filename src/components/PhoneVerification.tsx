'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { usePhoneVerification } from '@/lib/phoneVerification';
import { customerApi, parseJsonResponse } from '@/lib/api';
import PhoneInput from './PhoneInput';

interface PhoneVerificationProps {
  phoneNumber?: string;
  onVerificationSuccess: (phoneNumber: string) => void;
  onVerificationError: (error: string) => void;
  onCancel: () => void;
  allowPhoneInput?: boolean;
}

const PhoneVerification = memo(({
  phoneNumber: initialPhoneNumber = '',
  onVerificationSuccess,
  onVerificationError,
  onCancel,
  allowPhoneInput = false
}: PhoneVerificationProps) => {
  const [step, setStep] = useState<'input' | 'sending' | 'verifying' | 'success'>(
    allowPhoneInput ? 'input' : 'sending'
  );
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [verificationCode, setVerificationCode] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const hasAttemptedVerificationRef = useRef(false);
  const phoneNumberTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVerificationAttemptRef = useRef<number>(0);
  const effectHasRunRef = useRef(false);

  // Use the optimized phone verification hook
  const {
    isInitialized,
    isLoading,
    error: hookError,
    initializeRecaptcha,
    sendVerificationCode: hookSendVerificationCode,
    verifyCode: hookVerifyCode,
    clearRecaptcha,
    isValidPhoneNumber
  } = usePhoneVerification();

  // Debounced phone number setter
  const setPhoneNumberDebounced = useCallback((value: string) => {
    // Clear any existing timeout
    if (phoneNumberTimeoutRef.current) {
      clearTimeout(phoneNumberTimeoutRef.current);
    }
    
    // Set a new timeout to update the phone number after 500ms
    phoneNumberTimeoutRef.current = setTimeout(() => {
      setPhoneNumber(value);
    }, 500);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (phoneNumberTimeoutRef.current) {
        clearTimeout(phoneNumberTimeoutRef.current);
      }
    };
  }, []);

  // Reset verification state on unmount
  useEffect(() => {
    return () => {
      console.log('PhoneVerification component unmounting, resetting state');
      hasInitializedRef.current = false;
      hasAttemptedVerificationRef.current = false;
      effectHasRunRef.current = false;
      lastVerificationAttemptRef.current = 0;
      if (phoneNumberTimeoutRef.current) {
        clearTimeout(phoneNumberTimeoutRef.current);
      }
    };
  }, []);

  // Memoized callback for reCAPTCHA success
  const handleRecaptchaSuccess = useCallback(() => {
    // This will be called when reCAPTCHA is solved
    console.log('reCAPTCHA success callback triggered');
    if (phoneNumber && !isLoading) {
      console.log('Sending verification code via reCAPTCHA success callback');
      hookSendVerificationCode(phoneNumber).then(result => {
        if (result.success) {
          setStep('verifying');
        } else {
          onVerificationError(result.error || 'Failed to send verification code');
        }
      });
    } else {
      console.log('Skipping reCAPTCHA success callback - no phone number or already loading');
    }
  }, [phoneNumber, hookSendVerificationCode, onVerificationError, isLoading]);

  // Helper function to check if error is a reCAPTCHA server error
  const isRecaptchaServerError = useCallback((error: string | undefined): boolean => {
    return !!error && (
      error.includes('reCAPTCHA') || 
      error.includes('server') ||
      error.includes('network') ||
      error.includes('timeout') ||
      error.includes('configuration') ||
      error.includes('not initialized') ||
      error.includes('Firebase configuration')
    );
  }, []);

  // Helper function to handle verification result
  const handleVerificationResult = useCallback((result: { success: boolean; error?: string }, phone: string, context: string) => {
    if (result.success) {
      setStep('verifying');
    } else {
      // Check if it's a reCAPTCHA server error and skip verification
      if (isRecaptchaServerError(result.error || '')) {
        console.log(`reCAPTCHA server error detected in ${context}, skipping verification and saving address directly`);
        onVerificationSuccess(phone); // Skip verification and save address
      } else {
        onVerificationError(result.error || 'Failed to send verification code');
      }
    }
  }, [isRecaptchaServerError, onVerificationSuccess, onVerificationError]);

  // Memoized function to check existing verification
  const checkExistingVerification = useCallback(async (phone: string) => {
    // Prevent multiple simultaneous checks
    if (checkingVerification) {
      console.log('Verification already in progress, skipping');
      return;
    }

    // Rate limiting: prevent calls within 5 seconds
    const now = Date.now();
    const timeSinceLastAttempt = now - lastVerificationAttemptRef.current;
    if (timeSinceLastAttempt < 5000) {
      console.log(`Component rate limiting: ${timeSinceLastAttempt}ms since last attempt, minimum 5000ms required`);
      return;
    }
    lastVerificationAttemptRef.current = now;

    setCheckingVerification(true);
    hasAttemptedVerificationRef.current = true;
    console.log('Starting phone verification process');
    
    try {
      const response = await customerApi.checkPhoneVerification(phone);
      const result = await parseJsonResponse<{ isVerified: boolean; verifiedAt: string | null }>(response);
      
      if (result.isVerified) {
        // Phone number is already verified, skip verification process
        console.log('Phone number already verified, skipping verification');
        onVerificationSuccess(phone);
        return;
      }
      
      // Phone number not verified, proceed with normal verification flow
      // Ensure reCAPTCHA is initialized before proceeding
      if (recaptchaContainerRef.current && !hasInitializedRef.current) {
        console.log('Initializing reCAPTCHA for verification');
        initializeRecaptcha('recaptcha-container', handleRecaptchaSuccess);
        hasInitializedRef.current = true;
        
        // Wait a moment for reCAPTCHA to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (phone) {
        console.log('Sending verification code to:', phone);
        
        // Ensure reCAPTCHA is ready before sending
        if (!hasInitializedRef.current) {
          console.log('reCAPTCHA not initialized, waiting...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const result = await hookSendVerificationCode(phone);
        handleVerificationResult(result, phone, 'checkExistingVerification');
      }
    } catch (error) {
      console.error('Error checking phone verification:', error);
      // If check fails, proceed with normal verification flow
      if (recaptchaContainerRef.current && !hasInitializedRef.current) {
        console.log('Initializing reCAPTCHA after error');
        initializeRecaptcha('recaptcha-container', handleRecaptchaSuccess);
        hasInitializedRef.current = true;
        
        // Wait a moment for reCAPTCHA to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (phone) {
        console.log('Sending verification code after error to:', phone);
        
        // Ensure reCAPTCHA is ready before sending
        if (!hasInitializedRef.current) {
          console.log('reCAPTCHA not initialized after error, waiting...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const result = await hookSendVerificationCode(phone);
        handleVerificationResult(result, phone, 'checkExistingVerification');
      }
    } finally {
      setCheckingVerification(false);
    }
  }, [onVerificationSuccess, initializeRecaptcha, handleRecaptchaSuccess, hookSendVerificationCode, onVerificationError, checkingVerification, handleVerificationResult]);

  // Memoized function to handle phone submission
  const handlePhoneSubmit = useCallback(() => {
    if (!isValidPhoneNumber(phoneNumber)) {
      onVerificationError('Please enter a valid phone number');
      return;
    }

    setStep('sending');
    
    // Check if phone number is already verified before proceeding
    checkExistingVerification(phoneNumber);
  }, [phoneNumber, isValidPhoneNumber, checkExistingVerification, onVerificationError]);

  // Memoized function to verify code
  const handleVerifyCode = useCallback(async () => {
    if (!verificationCode.trim()) {
      onVerificationError('Please enter the verification code');
      return;
    }

    const result = await hookVerifyCode(verificationCode);
    
    if (result.success) {
      // Mark phone number as verified in database
      try {
        await customerApi.markPhoneVerified(result.phoneNumber || phoneNumber);
      } catch (error) {
        console.error('Error marking phone as verified:', error);
        // Continue anyway as the verification was successful
      }
      
      setStep('success');
      // Pass the verified phone number back
      onVerificationSuccess(result.phoneNumber || phoneNumber);
    } else {
      onVerificationError(result.error || 'Invalid verification code');
    }
  }, [verificationCode, phoneNumber, hookVerifyCode, onVerificationSuccess, onVerificationError]);

  // Memoized function to resend code
  const handleResendCode = useCallback(() => {
    setVerificationCode('');
    setStep('sending');
    if (phoneNumber) {
      hookSendVerificationCode(phoneNumber).then(result => {
        handleVerificationResult(result, phoneNumber, 'resend');
      });
    }
  }, [phoneNumber, hookSendVerificationCode, handleVerificationResult]);

  // Memoized function to handle cancel
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Single consolidated effect for initialization and verification
  useEffect(() => {
    // Prevent multiple executions in development mode
    if (hasInitializedRef.current || hasAttemptedVerificationRef.current || effectHasRunRef.current) {
      console.log('Effect already run or verification attempted, skipping');
      return;
    }

    effectHasRunRef.current = true;
    console.log('Initializing phone verification component');

    const initializeAndVerify = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Initialization timeout')), 10000); // 10 second timeout
        });
        
        const initPromise = (async () => {
          // Check if phone number is already verified when component mounts
          if (initialPhoneNumber && !allowPhoneInput) {
            await checkExistingVerification(initialPhoneNumber);
          } else if (recaptchaContainerRef.current && !allowPhoneInput) {
            // Initialize reCAPTCHA when component mounts
            console.log('Initializing reCAPTCHA in main effect');
            initializeRecaptcha('recaptcha-container', handleRecaptchaSuccess);
            hasInitializedRef.current = true;
            
            // Wait for reCAPTCHA to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Send verification code automatically if phone number is provided
            if (initialPhoneNumber) {
              console.log('Sending verification code from main effect to:', initialPhoneNumber);
              const result = await hookSendVerificationCode(initialPhoneNumber);
              handleVerificationResult(result, initialPhoneNumber, 'main effect');
            }
          }
        })();
        
        await Promise.race([initPromise, timeoutPromise]);
      } catch (error) {
        console.error('Error during initialization:', error);
        onVerificationError('Failed to initialize phone verification');
      }
    };

    initializeAndVerify();

    // Cleanup on unmount only
    return () => {
      if (hasInitializedRef.current) {
        clearRecaptcha();
        hasInitializedRef.current = false;
      }
      hasAttemptedVerificationRef.current = false;
      effectHasRunRef.current = false;
    };
  }, []); // Empty dependency array to run only once on mount

  // Handle changes to initialPhoneNumber and allowPhoneInput props
  useEffect(() => {
    // Only handle changes if we haven't initialized yet and have a phone number
    if (hasInitializedRef.current || !initialPhoneNumber || allowPhoneInput) {
      return;
    }

    // If we have a phone number and don't allow input, trigger verification
    console.log('Props changed, triggering verification for:', initialPhoneNumber);
    checkExistingVerification(initialPhoneNumber);
  }, [initialPhoneNumber, allowPhoneInput, checkExistingVerification]);

  // Memoized loading state
  const isProcessing = useMemo(() => {
    return isLoading || checkingVerification;
  }, [isLoading, checkingVerification]);

  // Memoized error state
  const displayError = useMemo(() => {
    return hookError || '';
  }, [hookError]);

  // Show loading state while checking verification
  if (checkingVerification) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Checking phone verification status...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Verify Phone Number</h3>
        
        {/* reCAPTCHA container */}
        <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

        {step === 'input' && (
          <div>
            <p className="text-gray-600 mb-4">
              Enter your phone number to receive a verification code
            </p>
            
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumberDebounced}
              placeholder="Enter phone number"
              label="Phone Number"
              required
              error={displayError}
              className="mb-4"
            />

            <div className="flex space-x-3">
              <button
                onClick={handlePhoneSubmit}
                disabled={isProcessing || !phoneNumber.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Sending...' : 'Send Code'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'sending' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-4">
              Sending verification code to {phoneNumber}...
            </p>
            {displayError && (
              <p className="text-red-600 text-sm mb-4">{displayError}</p>
            )}
          </div>
        )}

        {step === 'verifying' && (
          <div>
            <p className="text-gray-600 mb-4">
              Enter the 6-digit verification code sent to {phoneNumber}
            </p>
            
            <div className="mb-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
                disabled={isProcessing}
              />
            </div>

            {displayError && (
              <p className="text-red-600 text-sm mb-4">{displayError}</p>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleVerifyCode}
                disabled={isProcessing || !verificationCode.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={handleResendCode}
                disabled={isProcessing}
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
});

PhoneVerification.displayName = 'PhoneVerification';

export default PhoneVerification; 