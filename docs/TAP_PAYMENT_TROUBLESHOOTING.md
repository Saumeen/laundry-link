# Tap Payment Troubleshooting Guide

## Current Issues Identified

Based on the error logs, the following issues are causing payment failures:

### 1. **Unauthorized Errors** (Most Common)
```
Error creating Tap token: Tap token creation failed: Unauthorized
Error creating Tap charge: Tap charge creation failed: Unauthorized
```

**Cause**: Invalid or missing `TAP_SECRET_KEY`

**Solutions**:
- Ensure `TAP_SECRET_KEY` is properly set in your environment
- Verify the key is valid and not expired
- Check that you're using the correct environment (test vs production)

### 2. **Bad Request Errors**
```
Error creating Tap charge: Tap charge creation failed: Bad Request
```

**Cause**: Malformed request data or invalid parameters

**Solutions**:
- Verify all required fields are present
- Check data types (amount should be in fils, not BHD)
- Ensure customer data is properly formatted

### 3. **Object Serialization Errors**
```
Tap charge creation failed: [object Object]
```

**Cause**: Error objects not properly stringified (FIXED)

**Solutions**:
- ✅ Fixed in `tapPaymentUtils.ts` - now properly stringifies error objects

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Tap Payment Configuration
TAP_SECRET_KEY=sk_test_your_actual_secret_key_here
NEXT_PUBLIC_TAP_PUBLIC_KEY=pk_test_your_actual_public_key_here
NEXT_PUBLIC_TAP_MERCHANT_ID=your_actual_merchant_id_here

# Optional: API Base URL (usually not needed to change)
TAP_API_BASE_URL=https://api.tap.company/v2

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### How to Get Tap Credentials

1. **Sign up for Tap**: Go to [Tap Payments](https://tap.company) and create an account
2. **Get Test Credentials**: In your Tap dashboard, navigate to Settings > API Keys
3. **Copy the Keys**: 
   - Secret Key (starts with `sk_test_` for test environment)
   - Public Key (starts with `pk_test_` for test environment)
   - Merchant ID

### Validation

The system now validates your configuration and provides clear error messages:

```typescript
// This will now catch placeholder values too
if (!process.env.TAP_SECRET_KEY || process.env.TAP_SECRET_KEY === 'sk_test_...') {
  logger.error('TAP_SECRET_KEY environment variable is not configured or is using placeholder value');
  return NextResponse.json(
    { error: 'Payment system is temporarily unavailable. Please contact support.' },
    { status: 500 }
  );
}
```

## Testing Your Setup

### 1. Check Environment Variables
```bash
# In your terminal, check if variables are loaded
echo $TAP_SECRET_KEY
```

### 2. Test Configuration Validation
The system will log configuration issues. Check your logs for:
```
Tap Card SDK Configuration Issues: ['TAP_SECRET_KEY is not configured']
```

### 3. Test Payment Flow
1. Create a test order
2. Try to make a payment
3. Check the logs for detailed error messages

## Common Error Messages and Solutions

### "Payment system is temporarily unavailable"
- **Cause**: Missing or invalid `TAP_SECRET_KEY`
- **Solution**: Set proper environment variable

### "Payment authorization failed"
- **Cause**: Invalid Tap credentials
- **Solution**: Verify your secret key is correct

### "Payment was declined"
- **Cause**: Card declined by bank or invalid card details
- **Solution**: Use valid test card numbers

### "Bad Request"
- **Cause**: Malformed request data
- **Solution**: Check amount format (should be in fils) and customer data

## Test Card Numbers

For testing, use these Tap test card numbers:

- **Visa**: 4111111111111111
- **Mastercard**: 5555555555554444
- **American Express**: 378282246310005
- **MADA**: 4462030000000000

**Test CVC**: Any 3-digit number (e.g., 123)
**Test Expiry**: Any future date (e.g., 12/25)

## Debugging Steps

### 1. Check Logs
```bash
# View error logs
tail -f logs/error.log

# View all logs
tail -f logs/all.log
```

### 2. Verify Environment
```bash
# Check if environment variables are loaded
node -e "console.log('TAP_SECRET_KEY:', process.env.TAP_SECRET_KEY ? 'Set' : 'Not Set')"
```

### 3. Test API Connection
```bash
# Test Tap API directly (replace with your actual secret key)
curl -H "Authorization: Bearer YOUR_SECRET_KEY" \
     -H "Content-Type: application/json" \
     https://api.tap.company/v2/charges
```

## Production Deployment

### Environment Variables for Production
```bash
# Production Tap credentials (different from test)
TAP_SECRET_KEY=sk_live_your_production_secret_key
NEXT_PUBLIC_TAP_PUBLIC_KEY=pk_live_your_production_public_key
NEXT_PUBLIC_TAP_MERCHANT_ID=your_production_merchant_id

# Production URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Security Notes
- Never commit `.env.local` to version control
- Use different credentials for test and production
- Regularly rotate your API keys
- Monitor payment logs for suspicious activity

## Support

If you continue to experience issues:

1. **Check the logs** for detailed error messages
2. **Verify your Tap credentials** are correct
3. **Test with the provided test card numbers**
4. **Contact Tap support** if API issues persist
5. **Check this troubleshooting guide** for common solutions

## Recent Fixes Applied

### ✅ Fixed Error Object Serialization
- Updated `tapPaymentUtils.ts` to properly stringify error objects
- Now shows detailed error messages instead of `[object Object]`

### ✅ Enhanced Configuration Validation
- Added check for placeholder values (`sk_test_...`)
- Better error messages for missing configuration

### ✅ Improved Error Handling
- More specific error messages for different failure types
- Better logging for debugging purposes 