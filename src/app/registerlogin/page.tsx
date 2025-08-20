'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import { usePhoneVerification } from '@/lib/phoneVerification';
import PhoneVerification from '@/components/PhoneVerification';
import SocialLoginButton from '@/components/ui/SocialLoginButton';
import PhoneInput from '@/components/PhoneInput';
import logger from '@/lib/logger';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation functions
const hasLowerCase = (str: string) => /[a-z]/.test(str);
const hasUpperCase = (str: string) => /[A-Z]/.test(str);
const hasMinLength = (str: string) => str.length >= 8;
const hasNumber = (str: string) => /\d/.test(str);

// Component that uses search params
const AuthFormWithSearchParams = () => {
  const searchParams = useSearchParams();

  return <AuthForm searchParams={searchParams} />;
};

const AuthForm = ({ searchParams }: { searchParams: URLSearchParams }) => {
  const [step, setStep] = useState<
    'email' | 'login' | 'register' | 'phone-verification'
  >('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRedirected = useRef(false);
  const router = useRouter();
  const { status } = useSession();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isValidPhoneNumber } = usePhoneVerification();

  // Check for error from URL params
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && !hasRedirected.current && isAuthenticated) {
      hasRedirected.current = true;
      router.replace('/customer/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  // Check if email exists in the system
  const checkEmailExists = async (email: string) => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { exists: boolean };
      return data.exists;
    } catch {
      logger.error('Error checking email');
    }
  };

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const emailExists = await checkEmailExists(email);

      if (emailExists) {
        setStep('login');
      } else {
        setStep('register');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await signIn('customer-credentials', {
        redirect: false,
        username: email,
        password,
      });

      if (result?.ok) {
        // The redirect will be handled by the useEffect that watches session changes
        setIsSubmitting(false);
      } else {
        setError(result?.error || 'Login failed');
        setIsSubmitting(false);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (
      !hasLowerCase(password) ||
      !hasUpperCase(password) ||
      !hasMinLength(password) ||
      !hasNumber(password)
    ) {
      setError('Password must meet all requirements');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Check if phone number already exists
      const phoneCheckResponse = await fetch(
        '/api/customer/check-phone-exists',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber }),
        }
      );

      if (phoneCheckResponse.ok) {
        const phoneCheckData = (await phoneCheckResponse.json()) as {
          exists: boolean;
        };
        if (phoneCheckData.exists) {
          setError(
            'A user with this phone number already exists. Please use a different phone number or try logging in.'
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Proceed to phone verification step
      setStep('phone-verification');
    } catch (error) {
      setError('Failed to verify phone number. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Go back to email step
  const goBack = () => {
    if (step === 'phone-verification') {
      // Allow going back if there's an error, otherwise show message
      if (error) {
        setStep('register');
        setError('');
      } else {
        setError(
          'Phone verification is required to create your account. Please complete the verification process.'
        );
      }
      return;
    } else {
      setStep('email');
      setPassword('');
      setName('');
      setPhoneNumber('');
      setError('');
    }
  };

  // Handle phone verification success
  const handlePhoneVerificationSuccess = async (
    verifiedPhoneNumber: string
  ) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Create the account with the verified phone number
      const result = await signIn('customer-credentials', {
        redirect: false,
        username: email,
        password,
        name,
        phoneNumber: verifiedPhoneNumber,
      });

      if (result?.ok) {
        // Let the useEffect handle the redirect automatically
        // The session will update and trigger the redirect
        setIsSubmitting(false);
      } else {
        setError(result?.error || 'Registration failed');
        setIsSubmitting(false);
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle phone verification error
  const handlePhoneVerificationError = (error: string) => {
    setError(error);
    // Allow going back to registration step to change phone number
    setStep('register');
  };

  // Handle phone verification cancel
  const handlePhoneVerificationCancel = () => {
    // Allow canceling and going back to registration step
    setStep('register');
    setError('');
  };

  // Show loading if auth is still loading
  if (authLoading || status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4'></div>
          <p className='text-gray-600 font-medium'>
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 transform transition-all duration-300 hover:shadow-3xl hover:scale-[1.02]'>
          {/* Header */}
          <div className='text-center mb-8'>
            <div className='mb-6'>
              <div className='w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg'>
                <svg
                  className='w-8 h-8 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                  />
                </svg>
              </div>
            </div>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2'>
              Laundry Link
            </h1>
            {step === 'email' && (
              <>
                <h2 className='text-2xl font-semibold text-gray-800 mb-2'>
                  Welcome to Laundry Link
                </h2>
                <p className='text-gray-600'>Enter your email to get started</p>
              </>
            )}
            {step === 'login' && (
              <>
                <button
                  onClick={goBack}
                  className='flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors duration-200 group'
                >
                  <svg
                    className='w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                  Back
                </button>
                <h2 className='text-2xl font-semibold text-gray-800 mb-2'>
                  Welcome Back!
                </h2>
                <p className='text-gray-600'>Enter your password to continue</p>
              </>
            )}
            {step === 'register' && (
              <>
                <button
                  onClick={goBack}
                  className='flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors duration-200 group'
                >
                  <svg
                    className='w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                  Back
                </button>
                <h2 className='text-2xl font-semibold text-gray-800 mb-2'>
                  Create Your Account
                </h2>
                <p className='text-gray-600'>
                  Let's get you set up with Laundry Link
                </p>
              </>
            )}
            {step === 'phone-verification' && (
              <>
                {error && (
                  <button
                    onClick={goBack}
                    className='flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors duration-200 group'
                  >
                    <svg
                      className='w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 19l-7-7 7-7'
                      />
                    </svg>
                    Back to Registration
                  </button>
                )}
                <h2 className='text-2xl font-semibold text-gray-800 mb-2'>
                  Verify Your Phone Number
                </h2>
                <p className='text-gray-600 mb-4'>
                  Phone verification is required to create your account. We'll
                  send you a verification code to complete your registration.
                </p>
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
                  <div className='flex items-center'>
                    <svg
                      className='w-5 h-5 text-blue-600 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    <p className='text-blue-800 text-sm font-medium'>
                      Phone verification is mandatory for account creation
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className='space-y-6'>
              <div className='space-y-2'>
                <label
                  htmlFor='email'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Email Address
                </label>
                <div className='relative'>
                  <input
                    type='email'
                    id='email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className='w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm'
                    placeholder='Enter your email address'
                    required
                  />
                  <div className='absolute inset-y-0 right-0 pr-4 flex items-center'>
                    <svg
                      className='w-5 h-5 text-gray-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {error && (
                <div className='bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-pulse'>
                  <div className='flex items-center'>
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <button
                type='submit'
                disabled={isSubmitting || !email}
                className='w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
              >
                {isSubmitting ? (
                  <div className='flex items-center justify-center'>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                    Checking...
                  </div>
                ) : (
                  'Continue'
                )}
              </button>

              <div className='text-center text-sm text-gray-600'>
                By proceeding, you agree to our{' '}
                <a
                  href='/privacy'
                  className='text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200'
                >
                  Privacy policy and Terms & Conditions
                </a>
              </div>

              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-300'></div>
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-2 bg-white/80 text-gray-500 font-medium'>
                    Or continue with
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-3 gap-3'>
                <SocialLoginButton
                  provider='google'
                  onClick={() =>
                    signIn('google', { callbackUrl: '/customer/dashboard' })
                  }
                  className='flex-1'
                >
                  Google
                </SocialLoginButton>
                <SocialLoginButton
                  provider='facebook'
                  onClick={() =>
                    signIn('facebook', { callbackUrl: '/customer/dashboard' })
                  }
                  className='flex-1'
                >
                  Facebook
                </SocialLoginButton>
                <SocialLoginButton
                  provider='apple'
                  onClick={() =>
                    signIn('apple', { callbackUrl: '/customer/dashboard' })
                  }
                  className='flex-1'
                  isDisabled={true}
                >
                  Apple
                </SocialLoginButton>
              </div>
            </form>
          )}

          {/* Login Step */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className='space-y-6'>
              <div className='space-y-2'>
                <label
                  htmlFor='email-display'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Email Address
                </label>
                <input
                  type='email'
                  id='email-display'
                  value={email}
                  disabled
                  className='w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-600 backdrop-blur-sm'
                />
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='password'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Password
                </label>
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id='password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className='w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm pr-12'
                    placeholder='Enter your password'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      {showPassword ? (
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                        />
                      ) : (
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {error && (
                <div className='bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-pulse'>
                  <div className='flex items-center'>
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <button
                type='submit'
                disabled={isSubmitting || !password}
                className='w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
              >
                {isSubmitting ? (
                  <div className='flex items-center justify-center'>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>

            </form>
          )}

          {/* Register Step */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className='space-y-6'>
              <div className='space-y-2'>
                <label
                  htmlFor='email-display'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Email Address
                </label>
                <input
                  type='email'
                  id='email-display'
                  value={email}
                  disabled
                  className='w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-600 backdrop-blur-sm'
                />
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='name'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Full Name
                </label>
                <input
                  type='text'
                  id='name'
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className='w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm'
                  placeholder='Enter your full name'
                  required
                />
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='phone-number'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Phone Number
                </label>
                <PhoneInput
                  value={phoneNumber}
                  onChange={value => setPhoneNumber(value)}
                  placeholder='Enter your phone number'
                  className='w-full'
                  required
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Phone verification is required. You'll receive a verification
                  code to complete registration.
                </p>
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='create-password'
                  className='block text-sm font-semibold text-gray-700'
                >
                  Create Password
                </label>
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id='create-password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className='w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm pr-12'
                    placeholder='Create a strong password'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      {showPassword ? (
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                        />
                      ) : (
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className='bg-gray-50/50 rounded-xl p-4 space-y-3'>
                <p className='text-sm font-semibold text-gray-700'>
                  Password requirements:
                </p>
                <div className='space-y-2'>
                  <div className='flex items-center'>
                    <div
                      className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center transition-all duration-200 ${hasLowerCase(password) ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      {hasLowerCase(password) && (
                        <svg
                          className='w-3 h-3 text-white'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors duration-200 ${hasLowerCase(password) ? 'text-green-700 font-medium' : 'text-gray-600'}`}
                    >
                      Lower case letters
                    </span>
                  </div>
                  <div className='flex items-center'>
                    <div
                      className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center transition-all duration-200 ${hasUpperCase(password) ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      {hasUpperCase(password) && (
                        <svg
                          className='w-3 h-3 text-white'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors duration-200 ${hasUpperCase(password) ? 'text-green-700 font-medium' : 'text-gray-600'}`}
                    >
                      Upper case letters
                    </span>
                  </div>
                  <div className='flex items-center'>
                    <div
                      className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center transition-all duration-200 ${hasNumber(password) ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      {hasNumber(password) && (
                        <svg
                          className='w-3 h-3 text-white'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors duration-200 ${hasNumber(password) ? 'text-green-700 font-medium' : 'text-gray-600'}`}
                    >
                      At least one number
                    </span>
                  </div>
                  <div className='flex items-center'>
                    <div
                      className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center transition-all duration-200 ${hasMinLength(password) ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      {hasMinLength(password) && (
                        <svg
                          className='w-3 h-3 text-white'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors duration-200 ${hasMinLength(password) ? 'text-green-700 font-medium' : 'text-gray-600'}`}
                    >
                      At least 8 characters
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className='bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-pulse'>
                  <div className='flex items-center'>
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <button
                type='submit'
                disabled={
                  isSubmitting ||
                  !hasLowerCase(password) ||
                  !hasUpperCase(password) ||
                  !hasMinLength(password) ||
                  !hasNumber(password) ||
                  !name.trim() ||
                  !phoneNumber.trim()
                }
                className='w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl'
              >
                {isSubmitting ? (
                  <div className='flex items-center justify-center'>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          {/* Phone Verification Step */}
          {step === 'phone-verification' && (
            <PhoneVerification
              phoneNumber={phoneNumber}
              onVerificationSuccess={handlePhoneVerificationSuccess}
              onVerificationError={handlePhoneVerificationError}
              onCancel={handlePhoneVerificationCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default function RegisterLogin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthFormWithSearchParams />
    </Suspense>
  );
}
