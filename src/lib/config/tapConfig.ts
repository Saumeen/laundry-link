import logger from '@/lib/logger';
// Tap Card SDK Configuration
export const tapConfig = {
  // Public key for Tap Card SDK (starts with 'pk_')
  publicKey: process.env.NEXT_PUBLIC_TAP_PUBLIC_KEY || 'pk_test_...',
  
  // Merchant ID from Tap dashboard
  merchantId: process.env.NEXT_PUBLIC_TAP_MERCHANT_ID || 'merchant_id',
  
  // Secret key for hash generation (server-side only)
  secretKey: process.env.TAP_SECRET_KEY || 'sk_test_...',
  
  // Supported payment brands
  supportedBrands: ['AMERICAN_EXPRESS', 'VISA', 'MASTERCARD', 'MADA'],
  
  // Supported card types
  supportedCards: 'ALL', // 'ALL', 'DEBIT', 'CREDIT'
  
  // Default currency
  defaultCurrency: 'BHD',
  
  // Country code for phone numbers
  countryCode: '973', // Bahrain
  
  // SDK version
  sdkVersion: '1.0.2',
  
  // SDK URL
  sdkUrl: 'https://tap-sdks.b-cdn.net/card/1.0.2/index.js',
  
  // Benefit Pay configuration
  benefitPay: {
    // Benefit Pay SDK URLs (with fallbacks)
    sdkUrls: [
      'https://cdn.tap.company/benefit-pay-button/1.0.0/index.js',
      'https://tap-sdks.b-cdn.net/benefit-pay-button/1.0.0/index.js',
      'https://cdn.jsdelivr.net/npm/@tap-payments/benefit-pay-button@1.0.0/dist/index.js'
    ],
    
    // Primary SDK URL (first in the array)
    sdkUrl: 'https://cdn.tap.company/benefit-pay-button/1.0.0/index.js',
    
    // Webhook URL for Benefit Pay
    webhookUrl: process.env.NEXT_PUBLIC_BENEFIT_PAY_WEBHOOK_URL || '/api/payment/benefit-pay-webhook',
    
    // Timeout for script loading (in milliseconds)
    loadTimeout: 30000,
    
    // Retry attempts for script loading
    maxRetries: 3
  }
};

// Validation functions
export const validateTapConfig = () => {
  const errors: string[] = [];
  
  if (!tapConfig.publicKey || tapConfig.publicKey === 'pk_test_...') {
    errors.push('TAP_PUBLIC_KEY is not configured');
  }
  
  if (!tapConfig.merchantId || tapConfig.merchantId === 'merchant_id') {
    errors.push('TAP_MERCHANT_ID is not configured');
  }
  
  if (!tapConfig.secretKey || tapConfig.secretKey === 'sk_test_...') {
    errors.push('TAP_SECRET_KEY is not configured');
  }
  
  return errors;
};

// Get configuration for development/production
export const getTapConfig = () => {
  const errors = validateTapConfig();
  
  if (errors.length > 0) {
    logger.warn('Tap Card SDK Configuration Issues:', errors);
  }
  
  return tapConfig;
};

// Get Benefit Pay SDK URL with fallback
export const getBenefitPaySDKUrl = (attempt: number = 0): string => {
  const urls = tapConfig.benefitPay.sdkUrls;
  return urls[attempt] || urls[0];
};

// Check if all required environment variables are set
export const isTapConfigValid = (): boolean => {
  const errors = validateTapConfig();
  return errors.length === 0;
}; 