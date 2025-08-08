# Direct Payment Flow

## Overview

The direct payment flow has been updated to properly handle Tap payment gateway redirects for 3D Secure authentication and other security measures. The implementation now uses the same `processTapPayment` function as wallet top-ups, ensuring consistent behavior across all payment flows.

## Flow Description

### 1. Payment Initiation
- Customer submits payment details (card token, amount, order details)
- System uses `processTapPayment` function (same as wallet top-up)
- Payment record is created in `PENDING` status
- Tap charge is created with redirect URLs configured

### 2. Payment Processing
The system now handles three scenarios:

#### A. Immediate Capture (No Redirect Required)
- Payment is processed immediately and marked as `CAPTURED`
- Order status is updated to `PAID`
- Success response is returned to the client

#### B. Redirect Required (3D Secure/Authentication)
- Tap returns a redirect URL for additional authentication
- System returns `redirect_required` status with the redirect URL
- Client should redirect the user to the payment gateway
- After authentication, user is redirected back to success page
- Webhook processes the final payment status

#### C. Payment Failed
- Payment is declined or fails immediately
- Payment record is marked as `FAILED`
- Error response is returned to the client

### 3. Response Types

#### Success with Redirect
```json
{
  "success": true,
  "message": "Payment requires authentication",
  "status": "redirect_required",
  "redirectUrl": "https://gateway.tap.company/...",
  "paymentRecord": {
    "id": 123,
    "amount": 25.0,
    "paymentMethod": "TAP_PAY",
    "reference": "ORDER_12345",
    "status": "PENDING",
    "tapTransactionId": "chg_...",
    "refundable": true
  },
  "order": {
    "id": 456,
    "orderNumber": "12345",
    "paymentStatus": "PENDING",
    "paymentMethod": "TAP_PAY"
  }
}
```

#### Immediate Success
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "paymentRecord": {
    "id": 123,
    "amount": 25.0,
    "paymentMethod": "TAP_PAY",
    "reference": "ORDER_12345",
    "status": "PAID",
    "tapTransactionId": "chg_...",
    "refundable": true
  },
  "order": {
    "id": 456,
    "orderNumber": "12345",
    "paymentStatus": "PAID",
    "paymentMethod": "TAP_PAY"
  }
}
```

#### Payment Failed
```json
{
  "error": "Payment was declined. Please check your card details and try again."
}
```

## Implementation Details

### Backend API Changes
The direct payment API now uses the `processTapPayment` function:

```typescript
// Use processTapPayment function (same as wallet top-up)
const result = await processTapPayment(
  customer.id,
  orderId,
  amount,
  customerData,
  tokenId,
  `Direct card payment for order ${order.orderNumber}`,
  false // isWalletTopUp = false for direct payments
);

const { paymentRecord, tapResponse, redirectUrl, pendingWalletTransaction } = result;

// Check if payment requires redirect
if (redirectUrl) {
  return NextResponse.json({
    success: true,
    message: 'Payment requires authentication',
    status: 'redirect_required',
    redirectUrl,
    // ... rest of response
  });
}
```

### Key Benefits of Using processTapPayment
1. **Consistent Behavior**: Same redirect handling as wallet top-ups
2. **Proper 3D Secure Support**: Handles authentication redirects correctly
3. **Webhook Integration**: Uses existing webhook system for status updates
4. **Error Handling**: Consistent error handling across all payment flows
5. **Payment Record Management**: Proper payment record creation and updates

## Client Implementation

### Handling Redirect Required
When the API returns `status: "redirect_required"`:

1. Store the payment record details locally
2. Redirect the user to the `redirectUrl`
3. User completes authentication on Tap's gateway
4. User is redirected back to your success page
5. Success page should check payment status via webhook or API

### Example Client Code
```javascript
const response = await fetch('/api/customer/direct-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(paymentData)
});

const result = await response.json();

if (result.success) {
  if (result.status === 'redirect_required') {
    // Store payment details and redirect
    localStorage.setItem('pendingDirectPayment', JSON.stringify(result.paymentRecord));
    window.location.href = result.redirectUrl;
  } else {
    // Payment completed immediately
    showSuccessMessage(result.message);
  }
} else {
  showErrorMessage(result.error);
}
```

## Webhook Processing

The webhook at `/api/payment/tap-webhook` handles:
- Payment status updates from Tap
- Updating payment records and order status
- Processing wallet transactions if applicable
- Sending notifications

## Security Considerations

- All payment data is processed server-side
- Card details are never stored in the application
- Tap tokens are used for secure payment processing
- Webhook signature verification should be implemented for production
- HTTPS is required for all payment communications

## Error Handling

- Network errors are caught and logged
- Tap API errors are properly formatted and returned
- Payment failures are logged with detailed information
- Consistent error handling with wallet top-up flow

## Testing Scenarios

### 1. Immediate Payment Success
- Card payment processed without 3D Secure
- User sees success message immediately
- Order status updated to PAID

### 2. Redirect Required
- Card requires 3D Secure authentication
- User redirected to payment gateway
- User completes authentication
- User redirected back to success page
- Payment status checked and displayed

### 3. Payment Failure
- Card declined or payment fails
- Error message displayed to user
- User can retry payment

### 4. Payment Pending
- Payment initiated but not immediately captured
- User sees pending message
- Payment status checked via webhook

## Integration Points

### API Endpoints Used
- `POST /api/customer/direct-payment` - Process payment (uses processTapPayment)
- `GET /api/payment/status` - Check payment status
- `POST /api/payment/tap-webhook` - Handle webhook updates

### Shared Functions
- `processTapPayment` - Used by both direct payments and wallet top-ups
- `processTapPaymentResponse` - Updates payment records
- `handleTapWebhook` - Processes webhook updates

## Benefits of Updated Implementation

1. **Consistency**: Same payment flow as wallet top-ups
2. **Proper 3D Secure Support**: Handles authentication redirects correctly
3. **Better User Experience**: Clear messaging for each payment state
4. **Data Persistence**: Payment details stored for return flow
5. **Error Recovery**: Graceful handling of payment failures
6. **Security**: Secure tokenization and authentication flow
7. **Maintainability**: Shared code between payment flows
