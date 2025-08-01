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
    // Benefit Pay SDK URL
    sdkUrl: 'https://cdn.tap.company/benefit-pay-button/1.0.0/index.js',
    
    // Webhook URL for Benefit Pay
    webhookUrl: process.env.NEXT_PUBLIC_BENEFIT_PAY_WEBHOOK_URL || '/api/payment/benefit-pay-webhook'
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
  
  return errors;
};

// Get configuration for development/production
export const getTapConfig = () => {
  const errors = validateTapConfig();
  
  if (errors.length > 0) {
    console.warn('Tap Card SDK Configuration Issues:', errors);
  }
  
  return tapConfig;
}; 