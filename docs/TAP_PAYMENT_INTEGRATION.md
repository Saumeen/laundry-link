# Tap Payment Integration Guide

## Overview

This document outlines the integration of Tap Payments into the Laundry Link system for processing wallet top-ups and order payments.

## Features

- **Secure Payment Processing**: Tap's PCI-compliant payment gateway
- **Multiple Payment Methods**: Credit/debit cards, Apple Pay, Google Pay
- **Webhook Support**: Real-time payment status updates
- **Refund Processing**: Automated refund handling
- **Statement Descriptors**: Custom merchant names on statements

## Environment Configuration

### Required Environment Variables

```bash
# Tap API Configuration
TAP_API_BASE_URL=https://api.tap.company/v2
TAP_SECRET_KEY=sk_test_... # Your Tap secret key
TAP_WEBHOOK_SECRET=whsec_... # Webhook signature secret

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Getting Tap API Credentials

1. **Create Tap Account**: Sign up at [Tap Dashboard](https://dashboard.tap.company)
2. **Generate API Keys**: Navigate to goSell → API Credentials → Generate Key
3. **Configure Webhooks**: Set up webhook endpoints in your Tap dashboard
4. **Test Mode**: Use test keys for development, live keys for production

## API Endpoints

### 1. Wallet Top-up (`POST /api/wallet/top-up`)

Processes wallet top-ups using Tap payments.

**Request Body:**
```json
{
  "customerId": 123,
  "amount": 50.00,
  "paymentMethod": "TAP_PAY",
  "description": "Wallet top-up",
  "tokenId": "tok_test_...",
  "customerData": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+97312345678"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": 456,
    "redirectUrl": "https://api.tap.company/v2/...",
    "chargeId": "chg_test_..."
  }
}
```

### 2. Payment Processing (`POST /api/payment/process`)

Handles general payment processing including orders and wallet top-ups.

### 3. Tap Webhook (`POST /api/payment/tap-webhook`)

Receives payment status updates from Tap.

## Payment Flow

### Wallet Top-up Flow

1. **Customer Initiates Top-up**
   - Customer enters amount and selects payment method
   - System validates input and customer data

2. **Create Payment Record**
   - System creates a pending payment record
   - Generates unique reference for tracking

3. **Process with Tap**
   - Creates Tap charge with customer and payment details
   - Includes webhook URL for status updates
   - Sets redirect URL for payment completion

4. **Customer Payment**
   - Customer redirected to Tap's secure payment gateway
   - Customer completes payment using card/Apple Pay/Google Pay

5. **Webhook Processing**
   - Tap sends webhook with payment status
   - System updates payment record and wallet balance
   - Customer receives confirmation

### Order Payment Flow

Similar to wallet top-up but includes order-specific details and processing.

## Database Schema

### Payment Records Table

```sql
CREATE TABLE payment_records (
  id INTEGER PRIMARY KEY,
  customerId INTEGER NOT NULL,
  orderId INTEGER,
  amount DECIMAL(10,3) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BHD',
  paymentMethod VARCHAR(20) NOT NULL,
  paymentStatus VARCHAR(20) DEFAULT 'PENDING',
  
  -- Tap Payment Fields
  tapChargeId VARCHAR(255),
  tapAuthorizeId VARCHAR(255),
  tapTransactionId VARCHAR(255),
  tapReference VARCHAR(255),
  tapResponse TEXT,
  
  -- Card Information
  cardLastFour VARCHAR(4),
  cardBrand VARCHAR(20),
  cardExpiry VARCHAR(7),
  
  description TEXT,
  failureReason TEXT,
  refundAmount DECIMAL(10,3),
  refundReason TEXT,
  
  processedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

### 1. Webhook Signature Validation

All webhooks are validated using HMAC-SHA256 signatures:

```typescript
export function validateTapWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

### 2. Input Validation

- Amount validation (minimum 0.001 BD)
- Customer data validation
- Payment method validation
- Required field validation

### 3. Error Handling

- Comprehensive error messages
- Transaction rollback on failure
- Payment status tracking
- Logging for debugging

## Testing

### Test Cards

Use Tap's test card numbers for development:

- **Visa**: 4111111111111111
- **Mastercard**: 5555555555554444
- **American Express**: 378282246310005

### Test Scenarios

1. **Successful Payment**: Complete payment flow
2. **Failed Payment**: Test declined cards
3. **Webhook Processing**: Verify webhook handling
4. **Refund Processing**: Test refund functionality

## Error Codes

### Common Tap API Errors

- `INVALID_TOKEN`: Invalid payment token
- `INSUFFICIENT_FUNDS`: Card has insufficient funds
- `CARD_DECLINED`: Card was declined
- `INVALID_AMOUNT`: Amount is invalid
- `MISSING_REQUIRED_FIELD`: Required field missing

### Handling Errors

```typescript
try {
  const result = await processTapPayment(/* params */);
  // Handle success
} catch (error) {
  if (error.message.includes('INSUFFICIENT_FUNDS')) {
    showToast('Insufficient funds on card', 'error');
  } else if (error.message.includes('CARD_DECLINED')) {
    showToast('Card was declined', 'error');
  } else {
    showToast('Payment failed', 'error');
  }
}
```

## Production Checklist

- [ ] Use live Tap API keys
- [ ] Configure production webhook URLs
- [ ] Set up proper error monitoring
- [ ] Test all payment flows
- [ ] Configure statement descriptors
- [ ] Set up refund processing
- [ ] Monitor webhook delivery
- [ ] Implement proper logging

## Support

For Tap API support:
- [Tap API Documentation](https://developers.tap.company/reference/api-endpoint)
- [Tap Support](https://tap.company/support)

For integration issues:
- Check webhook logs
- Verify API key configuration
- Test with Tap's test environment
- Review error responses

## Best Practices

1. **Always validate webhook signatures**
2. **Use HTTPS for all API calls**
3. **Implement proper error handling**
4. **Log all payment attempts**
5. **Test thoroughly in sandbox mode**
6. **Monitor webhook delivery**
7. **Keep API keys secure**
8. **Use statement descriptors**
9. **Handle partial refunds properly**
10. **Implement idempotency for retries** 