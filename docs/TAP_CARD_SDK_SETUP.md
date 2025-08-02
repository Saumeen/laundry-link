# Tap Card SDK V2 Integration Setup

This document provides instructions for setting up the Tap Card SDK V2 integration in the Laundry Link application.

## Overview

The Tap Card SDK V2 integration allows customers to securely enter their payment information directly on your website without being redirected to an external payment page. The SDK handles card tokenization and provides a seamless payment experience.

## Prerequisites

1. **Tap Business Account**: You need a registered Tap Payments business account
2. **API Keys**: Obtain your public key and merchant ID from the Tap dashboard
3. **Domain Registration**: For production, your domain must be registered with Tap

## Environment Variables Setup

Add the following environment variables to your `.env.local` file:

```bash
# Tap Card SDK Configuration
NEXT_PUBLIC_TAP_PUBLIC_KEY=pk_test_your_public_key_here
NEXT_PUBLIC_TAP_MERCHANT_ID=your_merchant_id_here

# For production, use live keys
# NEXT_PUBLIC_TAP_PUBLIC_KEY=pk_live_your_live_public_key_here
# NEXT_PUBLIC_TAP_MERCHANT_ID=your_live_merchant_id_here
```

## Getting Your Tap Credentials

### 1. Public Key
- Log in to your Tap business dashboard
- Navigate to **Settings** > **API Keys**
- Copy your public key (starts with `pk_test_` for test mode or `pk_live_` for live mode)

### 2. Merchant ID
- In your Tap dashboard, go to **Settings** > **Business Information**
- Copy your Merchant ID

## Features Implemented

### 1. TapCardForm Component
- **Location**: `src/components/ui/TapCardForm.tsx`
- **Purpose**: Renders the Tap Card SDK form
- **Features**:
  - Secure card input fields
  - Real-time validation
  - Card brand detection
  - Save card functionality
  - Responsive design

### 2. Configuration Management
- **Location**: `src/lib/config/tapConfig.ts`
- **Purpose**: Centralized configuration management
- **Features**:
  - Environment variable validation
  - Default settings
  - Error handling

### 3. Wallet Integration
- **Location**: `src/app/customer/wallet/page.tsx`
- **Purpose**: Integrated payment form in wallet top-up
- **Features**:
  - Seamless payment flow
  - Token generation
  - Error handling
  - Success notifications

## Supported Payment Methods

The integration supports the following payment methods:

- **Credit Cards**: Visa, Mastercard, American Express
- **Debit Cards**: All major debit card networks
- **Local Cards**: Mada (Saudi Arabia)
- **Digital Wallets**: Apple Pay, Google Pay (if enabled in your Tap account)

## Testing

### Test Card Numbers

Use these test card numbers for development:

```
Visa: 4111 1111 1111 1111
Mastercard: 5555 5555 5555 4444
American Express: 3782 822463 10005
```

### Test Data
- **Expiry Date**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **Name**: Any name

## Production Setup

### 1. Domain Registration
Before going live, contact Tap support to register your domain:
- Email: [support@tap.company](mailto:support@tap.company)
- Include your production domain
- Wait for confirmation

### 2. Live Keys
- Switch to live API keys in your environment variables
- Test thoroughly with small amounts
- Monitor transactions in your Tap dashboard

### 3. Webhook Configuration
Ensure your webhook endpoint is properly configured:
- URL: `https://yourdomain.com/api/payment/tap-webhook`
- Events: `charge.succeeded`, `charge.failed`, `charge.cancelled`

## Security Considerations

1. **PCI Compliance**: The Tap Card SDK is PCI DSS compliant
2. **Tokenization**: Card data is tokenized and never stored on your servers
3. **HTTPS**: Always use HTTPS in production
4. **Environment Variables**: Never commit API keys to version control

## Troubleshooting

### Common Issues

1. **SDK Not Loading**
   - Check internet connection
   - Verify script URL is accessible
   - Check browser console for errors

2. **Invalid Public Key**
   - Verify the public key format (starts with `pk_`)
   - Ensure you're using the correct environment (test/live)

3. **Payment Declined**
   - Check card details
   - Verify card is enabled for online payments
   - Check Tap dashboard for error details

4. **Token Generation Failed**
   - Verify all required fields are filled
   - Check card validation
   - Ensure customer data is complete

### Debug Mode

Enable debug logging by adding this to your browser console:

```javascript
localStorage.setItem('tap_debug', 'true');
```

## API Reference

For detailed API documentation, visit:
- [Tap Card SDK V2 Documentation](https://developers.tap.company/docs/card-sdk-web-v2)
- [Tap API Reference](https://developers.tap.company/docs/api)

## Support

For technical support:
- **Tap Support**: [support@tap.company](mailto:support@tap.company)
- **Documentation**: [developers.tap.company](https://developers.tap.company)
- **Status Page**: [status.tap.company](https://status.tap.company) 