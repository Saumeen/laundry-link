import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  PhoneAuthProvider,
  ConfirmationResult,
  signOut,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { useCallback, useRef, useEffect, useState } from 'react';

// We're using reCAPTCHA Enterprise (no manual site key needed)
const isEnterpriseRecaptcha = true;

// Custom hook for phone verification
export const usePhoneVerification = () => {
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const previousUserRef = useRef<User | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize reCAPTCHA verifier following Firebase documentation
  const initializeRecaptcha = useCallback((containerId: string, callback: () => void) => {
    try {
      console.log('=== INITIALIZE RECAPTCHA DEBUG ===');
      console.log('Container ID:', containerId);
      console.log('Current reCAPTCHA verifier:', !!recaptchaVerifierRef.current);
      console.log('isInitialized state:', isInitialized);
      
      if (typeof window === 'undefined') {
        throw new Error('reCAPTCHA can only be initialized in browser environment');
      }

      // Clear any existing verifier
      if (recaptchaVerifierRef.current) {
        try {
          console.log('Clearing existing reCAPTCHA verifier');
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          console.warn('Error clearing existing reCAPTCHA:', error);
        }
        recaptchaVerifierRef.current = null;
      }

      // Check if container exists
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`reCAPTCHA container with id '${containerId}' not found`);
      }

      console.log('Container found, initializing reCAPTCHA...');

      // Initialize reCAPTCHA - handle both standard and enterprise
      const recaptchaConfig: any = {
        'size': 'invisible',
        'callback': callback,
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          setIsInitialized(false);
        },
        'error-callback': (error: any) => {
          console.error('reCAPTCHA error:', error);
          setError('reCAPTCHA configuration error');
          setIsInitialized(false);
        }
      };

      // Using reCAPTCHA Enterprise (no manual site key needed)
      console.log('Using reCAPTCHA Enterprise configuration');
      recaptchaConfig['enterprise'] = true;

      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, containerId, recaptchaConfig);

      console.log('reCAPTCHA verifier created successfully');
      setIsInitialized(true);
      setError(null);

      console.log('reCAPTCHA initialized successfully');
    } catch (error: any) {
      console.error('Error initializing reCAPTCHA:', error);
      setError(`Failed to initialize reCAPTCHA: ${error.message}`);
      setIsInitialized(false);
      throw new Error(`Failed to initialize reCAPTCHA: ${error.message}`);
    }
  }, [isInitialized]);

  // Ensure phone number is in international format
  const ensureInternationalFormat = useCallback((phoneNumber: string): string => {
    // If it already starts with +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // If it doesn't start with +, add it
    return `+${phoneNumber}`;
  }, []);

  // Helper function to wait with exponential backoff
  const waitWithBackoff = useCallback((attempt: number): Promise<void> => {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
    return new Promise(resolve => setTimeout(resolve, delay));
  }, []);

  // Send verification code to phone number using Firebase
  const sendVerificationCode = useCallback(async (phoneNumber: string, retryAttempt = 0): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('=== SEND VERIFICATION CODE DEBUG ===');
      console.log('reCAPTCHA verifier exists:', !!recaptchaVerifierRef.current);
      console.log('isInitialized state:', isInitialized);
      console.log('isLoading state:', isLoading);
      console.log('Phone number:', phoneNumber);
      console.log('Retry attempt:', retryAttempt);
      
      // Prevent multiple simultaneous calls
      if (isLoading) {
        console.log('Already loading, skipping duplicate call');
        return { success: false, error: 'Verification already in progress' };
      }

      // Rate limiting: prevent calls within 5 seconds (only on first attempt)
      if (retryAttempt === 0) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTimeRef.current;
        if (timeSinceLastCall < 5000) {
          console.log(`Rate limiting: ${timeSinceLastCall}ms since last call, minimum 5000ms required`);
          return { success: false, error: 'Please wait a few seconds before trying again' };
        }
        lastCallTimeRef.current = now;
      }

      if (!recaptchaVerifierRef.current) {
        console.error('reCAPTCHA verifier is null - not initialized properly');
        throw new Error('reCAPTCHA not initialized. Please try again.');
      }

      setIsLoading(true);
      setError(null);

      // Store current user before phone verification
      previousUserRef.current = auth.currentUser;

      // Ensure phone number is in international format
      const formattedPhone = ensureInternationalFormat(phoneNumber);
      
      console.log('=== FIREBASE PHONE VERIFICATION DEBUG ===');
      console.log('Sending verification code to:', formattedPhone);
      console.log('Firebase project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'laundry-link-v1');
      console.log('Current domain:', window.location.hostname);
      console.log('Using invisible reCAPTCHA (no manual site key needed)');
      console.log('reCAPTCHA verifier initialized:', !!recaptchaVerifierRef.current);
      console.log('Firebase auth current user:', auth.currentUser);
      console.log('==========================================');
      
      // Render reCAPTCHA before sending
      try {
        await recaptchaVerifierRef.current.render();
        console.log('reCAPTCHA rendered successfully');
      } catch (renderError) {
        console.error('reCAPTCHA render error:', renderError);
        throw new Error('reCAPTCHA failed to render. Please refresh and try again.');
      }
      
      // Use Firebase to send OTP
      confirmationResultRef.current = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        recaptchaVerifierRef.current
      );

      console.log('Verification code sent successfully via Firebase');
      return { success: true };
    } catch (error: any) {
      console.error('=== FIREBASE ERROR DETAILS ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error object:', error);
      console.error('==============================');
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to send verification code';
      let shouldRetry = false;
      
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-phone-number':
            errorMessage = 'Invalid phone number format. Please check and try again.';
            break;
          case 'auth/too-many-requests':
            if (retryAttempt < 3) {
              shouldRetry = true;
              errorMessage = `Rate limited. Retrying in ${Math.min(1000 * Math.pow(2, retryAttempt), 10000) / 1000} seconds...`;
            } else {
              errorMessage = 'Too many requests. Please wait a few minutes and try again.';
            }
            break;
          case 'auth/quota-exceeded':
            errorMessage = 'SMS quota exceeded. Please try again later.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Phone authentication is not enabled. Please contact support.';
            break;
          case 'auth/captcha-check-failed':
            errorMessage = 'reCAPTCHA verification failed. Please try again.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection and try again.';
            break;
          case 'auth/internal-error':
            errorMessage = 'Firebase configuration error. Please check your Firebase setup and try again.';
            break;
          case 'auth/invalid-app-credential':
            errorMessage = 'Firebase app credential error. Please check your domain is authorized in Firebase Console and reCAPTCHA is properly configured.';
            break;
          case 'auth/unsupported-persistence-type':
            errorMessage = 'Firebase persistence error. Please refresh the page and try again.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This phone number has been disabled. Please contact support.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'Phone number not found in our system.';
            break;
          case 'auth/recaptcha-not-enabled':
            errorMessage = 'reCAPTCHA Enterprise is not properly configured. Please check Firebase Console settings.';
            break;
          case 'auth/recaptcha-token-expired':
            errorMessage = 'reCAPTCHA token expired. Please try again.';
            break;
          default:
            errorMessage = error.message || 'Failed to send verification code';
        }
      } else if (error.message) {
        // Handle non-Firebase errors
        if (error.message.includes('reCAPTCHA')) {
          errorMessage = 'reCAPTCHA configuration error. Please refresh the page and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // If we should retry, wait and try again
      if (shouldRetry) {
        console.log(`Retrying verification code send (attempt ${retryAttempt + 1})`);
        await waitWithBackoff(retryAttempt);
        setIsLoading(false);
        return sendVerificationCode(phoneNumber, retryAttempt + 1);
      }
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading, ensureInternationalFormat, waitWithBackoff]);

  // Verify the code entered by user using Firebase
  const verifyCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string; phoneNumber?: string }> => {
    try {
      if (!confirmationResultRef.current) {
        throw new Error('No confirmation result available. Please request a new code.');
      }

      setIsLoading(true);
      setError(null);

      console.log('Verifying code with Firebase:', code);
      
      // Confirm the code with Firebase
      const result = await confirmationResultRef.current.confirm(code);
      
      console.log('Code verified successfully with Firebase');
      
      // Get the verified phone number
      const verifiedPhoneNumber = result.user.phoneNumber;
      
      // Safely handle sign out - only if user was signed in via phone verification
      await safeSignOut();
      
      // Return the verified phone number without keeping the user signed in
      return { 
        success: true, 
        phoneNumber: verifiedPhoneNumber || 'Unknown'
      };
    } catch (error: any) {
      console.error('Error verifying code:', error);
      
      // Handle specific Firebase auth errors
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
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection and try again.';
            break;
          default:
            errorMessage = error.message || 'Invalid verification code';
        }
      }
      
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Safely sign out without affecting existing authentication
  const safeSignOut = useCallback(async (): Promise<void> => {
    try {
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Check if the current user was signed in via phone verification
        const isPhoneUser = currentUser.providerData.some(
          provider => provider.providerId === 'phone'
        );
        
        // Only sign out if this is a phone verification user
        // or if there was no previous user (fresh phone verification)
        if (isPhoneUser || !previousUserRef.current) {
          await signOut(auth);
          console.log('Phone verification user signed out safely');
        } else {
          console.log('Preserving existing user authentication');
        }
      }
    } catch (error) {
      console.error('Error during safe sign out:', error);
    }
  }, []);

  // Clear the reCAPTCHA verifier
  const clearRecaptcha = useCallback(() => {
    try {
      console.log('=== CLEAR RECAPTCHA DEBUG ===');
      console.log('Current reCAPTCHA verifier:', !!recaptchaVerifierRef.current);
      console.log('isInitialized state:', isInitialized);
      console.log('isLoading state:', isLoading);
      
      // Don't clear if currently loading (verification in progress)
      if (isLoading) {
        console.log('Skipping reCAPTCHA clear - verification in progress');
        return;
      }
      
      if (recaptchaVerifierRef.current) {
        console.log('Clearing reCAPTCHA verifier...');
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      confirmationResultRef.current = null;
      previousUserRef.current = null;
      lastCallTimeRef.current = 0; // Reset rate limiting
      setIsInitialized(false);
      setError(null);
      console.log('reCAPTCHA cleared successfully');
    } catch (error) {
      console.error('Error clearing reCAPTCHA:', error);
    }
  }, [isInitialized, isLoading]);

  // Check if phone number is valid format (basic validation)
  const isValidPhoneNumber = useCallback((phoneNumber: string): boolean => {
    if (!phoneNumber) return false;
    
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Must start with + and have at least 7 digits (minimum international format)
    if (!cleaned.startsWith('+') || cleaned.length < 8) {
      return false;
    }
    
    // Special validation for Bahrain numbers (8 digits after +973)
    if (cleaned.startsWith('+973')) {
      const bahrainNumber = cleaned.substring(4); // Remove +973
      if (bahrainNumber.length !== 8) {
        return false;
      }
      // Bahrain mobile numbers start with 3, 6, 7, or 9
      const firstDigit = bahrainNumber.charAt(0);
      if (!['3', '6', '7', '9'].includes(firstDigit)) {
        return false;
      }
    }
    
    return true;
  }, []);

  // Get Bahrain phone number format hint
  const getBahrainFormatHint = useCallback((): string => {
    return "Bahrain mobile numbers are 8 digits starting with 3, 6, 7, or 9 (e.g., +973 3344 0841)";
  }, []);

  // Check if user is currently signed in
  const isUserSignedIn = useCallback((): boolean => {
    return auth.currentUser !== null;
  }, []);

  // Get current user info (for debugging)
  const getCurrentUserInfo = useCallback((): { uid?: string; email?: string; phoneNumber?: string; providers: string[] } | null => {
    const user = auth.currentUser;
    if (!user) return null;
    
    return {
      uid: user.uid,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
      providers: user.providerData.map(provider => provider.providerId)
    };
  }, []);

  // Force sign out only if user was signed in via phone verification
  const forceSignOut = useCallback(async (): Promise<void> => {
    try {
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Check if this is a phone verification user
        const isPhoneUser = currentUser.providerData.some(
          provider => provider.providerId === 'phone'
        );
        
        if (isPhoneUser) {
          await signOut(auth);
          console.log('Phone verification user force signed out');
        } else {
          console.log('Preserving existing user authentication (not phone user)');
        }
      }
    } catch (error) {
      console.error('Error during force sign out:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
  }, [clearRecaptcha]);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    
    // Methods
    initializeRecaptcha,
    sendVerificationCode,
    verifyCode,
    clearRecaptcha,
    isValidPhoneNumber,
    getBahrainFormatHint,
    isUserSignedIn,
    getCurrentUserInfo,
    forceSignOut,
    safeSignOut
  };
};

 