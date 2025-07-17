import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signOut,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { useCallback, useRef, useState } from 'react';

// Custom hook for phone verification
export const usePhoneVerification = () => {
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const previousUserRef = useRef<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize reCAPTCHA
  const initializeRecaptcha = useCallback((containerId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Clear any existing verifier
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        }

        // Create new reCAPTCHA verifier without callback
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Send verification code
  const sendVerificationCode = useCallback(async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isLoading) {
        return { success: false, error: 'Verification already in progress' };
      }

      if (!recaptchaVerifierRef.current) {
        return { success: false, error: 'reCAPTCHA not initialized' };
      }

      setIsLoading(true);
      setError(null);

      // Store current user
      previousUserRef.current = auth.currentUser;

      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

      // Render reCAPTCHA first
      await recaptchaVerifierRef.current.render();

      // Send verification code
      confirmationResultRef.current = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        recaptchaVerifierRef.current
      );

      return { success: true };
    } catch (error: any) {
      let errorMessage = 'Failed to send verification code';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-phone-number':
            errorMessage = 'Invalid phone number format';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 'auth/quota-exceeded':
            errorMessage = 'SMS quota exceeded. Please try again later.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Phone authentication is not enabled. Please contact support.';
            break;
          default:
            errorMessage = error.message || 'Failed to send verification code';
        }
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Verify code
  const verifyCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string; phoneNumber?: string }> => {
    try {
      if (!confirmationResultRef.current) {
        return { success: false, error: 'No verification session. Please request a new code.' };
      }

      setIsLoading(true);
      setError(null);

      // Confirm the code
      const result = await confirmationResultRef.current.confirm(code);
      const verifiedPhoneNumber = result.user.phoneNumber;

      // Sign out the phone verification user
      await signOut(auth);

      return { 
        success: true, 
        phoneNumber: verifiedPhoneNumber || 'Unknown'
      };
    } catch (error: any) {
      let errorMessage = 'Invalid verification code';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-verification-code':
            errorMessage = 'Invalid verification code. Please check and try again.';
            break;
          case 'auth/invalid-verification-id':
            errorMessage = 'Verification session expired. Please request a new code.';
            break;
          case 'auth/code-expired':
            errorMessage = 'Verification code has expired. Please request a new code.';
            break;
          default:
            errorMessage = error.message || 'Invalid verification code';
        }
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear reCAPTCHA
  const clearRecaptcha = useCallback((): void => {
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } catch (error) {
      // Handle clear error silently
    }
  }, []);

  // Validate phone number
  const isValidPhoneNumber = useCallback((phoneNumber: string): boolean => {
    if (!phoneNumber) return false;
    
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Must start with + and have at least 8 digits
    if (!cleaned.startsWith('+') || cleaned.length < 9) {
      return false;
    }
    
    // Special validation for Bahrain numbers (8 digits after +973)
    if (cleaned.startsWith('+973')) {
      const bahrainNumber = cleaned.substring(4);
      if (bahrainNumber.length !== 8) {
        return false;
      }
      const firstDigit = bahrainNumber.charAt(0);
      if (!['3', '6', '7', '9'].includes(firstDigit)) {
        return false;
      }
    }
    
    return true;
  }, []);

  return {
    // State
    isLoading,
    error,
    
    // Methods
    initializeRecaptcha,
    sendVerificationCode,
    verifyCode,
    clearRecaptcha,
    isValidPhoneNumber
  };
};

 