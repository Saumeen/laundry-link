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
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const {
    isLoading,
    error,
    initializeRecaptcha,
    sendVerificationCode,
    verifyCode,
    clearRecaptcha
  } = usePhoneVerification();

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

  // Start verification when component mounts
  useEffect(() => {
    initializeRecaptchaLocal();
  }, [initializeRecaptchaLocal]);

  // Manual trigger for sending verification code
  const handleManualTrigger = useCallback(async () => {
    try {
      const result = await sendVerificationCode(phoneNumber);
      if (result.success) {
        setStep('verifying');
      } else {
        onVerificationError(result.error || 'Failed to send verification code');
      }
    } catch (error) {
      onVerificationError('Failed to send verification code');
    }
  }, [phoneNumber, sendVerificationCode, onVerificationError]);

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
    await initializeRecaptchaLocal(); // Re-initialize reCAPTCHA for resend
  }, [initializeRecaptchaLocal]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    clearRecaptcha();
    onCancel();
  }, [clearRecaptcha, onCancel]);

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
            <p className="text-xs text-gray-500 mb-4">
              If the verification doesn't start automatically, click the button below.
            </p>
            <button
              onClick={handleManualTrigger}
              disabled={isLoading}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? 'Sending...' : 'Send Code Manually'}
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