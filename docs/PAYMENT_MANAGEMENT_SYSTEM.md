# Payment Management System

## Overview

The Payment Management System provides comprehensive invoice generation and management capabilities for the Laundry Link platform. It integrates with TAP (The Arab Payment) API to handle professional invoice operations including creation, tracking, resending, and cancellation.

## Features

### 1. Invoice Generation
- **Generate Invoice**: Create TAP invoices for orders that require payment
- **Automatic Amount Calculation**: Calculates the amount to charge based on wallet balance and invoice total
- **Customer Data Validation**: Ensures all required customer information is present
- **Phone Number Formatting**: Automatically formats Bahrain phone numbers for TAP API

### 2. Invoice Management
- **View Invoice**: Open TAP invoice in a new tab for customer viewing
- **Invoice Details**: View comprehensive invoice information including status, tracking, and transactions
- **Resend Invoice**: Send invoice notifications via SMS and email to customers
- **Cancel Invoice**: Cancel pending invoices and update payment status

### 3. Payment Tracking
- **Real-time Status**: Track invoice status (PENDING, PAID, CANCELLED, EXPIRED)
- **Transaction History**: View all payment attempts and their status
- **Tracking Information**: Access TAP's tracking system for detailed invoice activity

### 4. Refund Management
- **Process Refunds**: Handle full and partial refunds for paid orders
- **Refund History**: Track all refund transactions with reasons
- **Wallet Integration**: Automatic wallet balance updates for refunds

## API Endpoints

### 1. Create TAP Invoice
```
POST /api/admin/create-tap-invoice
```
Creates a new TAP invoice for an order.

**Request Body:**
```json
{
  "orderId": 123
}
```

**Response:**
```json
{
  "success": true,
  "requiresPayment": true,
  "tapInvoice": {
    "id": "inv_xxx",
    "url": "https://...",
    "status": "CREATED"
  },
  "walletBalance": 10.50,
  "invoiceTotal": 25.00,
  "amountToCharge": 14.50
}
```

### 2. Resend TAP Invoice
```
POST /api/admin/resend-tap-invoice
```
Resends invoice notifications to the customer.

**Request Body:**
```json
{
  "orderId": 123,
  "paymentRecordId": 456
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice resent successfully",
  "tapResponse": { ... }
}
```

### 3. Cancel TAP Invoice
```
POST /api/admin/cancel-tap-invoice
```
Cancels a pending TAP invoice.

**Request Body:**
```json
{
  "orderId": 123,
  "paymentRecordId": 456
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice cancelled successfully",
  "tapResponse": { ... }
}
```

### 4. Get TAP Invoice Details
```
POST /api/admin/get-tap-invoice
```
Retrieves detailed information about a TAP invoice.

**Request Body:**
```json
{
  "orderId": 123,
  "paymentRecordId": 456
}
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": "inv_xxx",
    "url": "https://...",
    "status": "PENDING",
    "amount": 25.00,
    "currency": "BHD",
    "created": 1640995200000,
    "due": 1641081600000,
    "expiry": 1641168000000,
    "track": {
      "status": "DISPATCHED",
      "link": "https://..."
    },
    "transactions": [
      {
        "id": "chg_xxx",
        "status": "PENDING",
        "amount": 25.00
      }
    ]
  }
}
```

## TAP Invoice Management Functions

The `tapInvoiceManagement` module provides a centralized interface for all TAP invoice operations using ES6 const-based functions:

### Functions

#### `createInvoice(invoiceData: TapInvoiceRequest)`
Creates a new TAP invoice with the provided data.

#### `getInvoice(invoiceId: string)`
Retrieves detailed information about a specific invoice.

#### `updateInvoice(invoiceId: string, updateData: Partial<TapInvoiceRequest>)`
Updates an existing invoice with new data.

#### `cancelInvoice(invoiceId: string)`
Cancels a pending invoice.

#### `resendInvoice(invoiceId: string, channels: string[])`
Resends invoice notifications via specified channels (SMS, EMAIL).

#### `listInvoices(filters?: object)`
Lists all invoices with optional filtering.

#### `finalizeInvoice(invoiceId: string)`
Finalizes a draft invoice.

#### `getInvoiceTracking(invoiceId: string)`
Retrieves tracking information for an invoice.

#### `createInvoiceForOrder(order: any, amount: number)`
Creates an invoice specifically for an order with proper data formatting.

## Payment Management UI

### Payment Tab Features

The Payment Management tab in the admin order interface provides:

1. **Payment Summary Dashboard**
   - Order total
   - Total paid amount
   - Total refunded amount
   - Available for refund

2. **Invoice Management Section**
   - Generate invoice button (if no invoice exists)
   - View invoice button
   - Invoice details button
   - Resend invoice button
   - Cancel invoice button

3. **Customer Wallet Information**
   - Customer name
   - Current wallet balance

4. **Payment Records Table**
   - Payment method and details
   - Amount and status
   - Date and time
   - Action buttons (refund, etc.)

5. **Invoice Details Modal**
   - Comprehensive invoice information
   - Tracking status and link
   - Transaction history
   - Direct link to TAP invoice

## Invoice Status Tracking

TAP invoices can have the following statuses:

- **SAVED**: Invoice saved as draft
- **CREATED**: Invoice successfully created
- **CANCELLED**: Invoice cancelled
- **EXPIRED**: Invoice expired
- **PAID**: Invoice paid

### Tracking Status Values

- **DRAFT**: Invoice in draft mode
- **SCHEDULED**: Invoice scheduled for sending
- **DISPATCHED**: Invoice sent to customer
- **DELIVERED**: Invoice delivered to customer
- **VIEWED**: Customer viewed the invoice
- **PAYMENT_ATTEMPT**: Customer attempted payment
- **PAYMENT_FAILED**: Payment attempt failed
- **PAYMENT_AUTHORIZED**: Payment authorized
- **PAYMENT_CAPTURED**: Payment captured
- **PAYMENT_POSTED**: Payment posted
- **PAYMENT_REFUNDED**: Payment refunded
- **PAYMENT_PARTIALLY_REFUNDED**: Partial refund processed
- **PAYMENT_ON_HOLD**: Payment on hold
- **PAYMENT_SETTLED**: Payment settled

## Security and Authentication

- All payment management endpoints require Super Admin authentication
- TAP API calls use secure Bearer token authentication
- All sensitive operations are logged for audit purposes
- Payment records are stored with encrypted metadata

## Error Handling

The system includes comprehensive error handling:

- **API Validation**: Validates all required fields before processing
- **TAP API Errors**: Handles and logs all TAP API errors
- **Database Errors**: Graceful handling of database operation failures
- **User Feedback**: Clear error messages displayed to users
- **Logging**: All errors are logged for debugging and monitoring

## Configuration

### Environment Variables

```env
TAP_SECRET_KEY=your_tap_secret_key
TAP_API_BASE_URL=https://api.tap.company/v2
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### TAP Configuration

The system uses the `tapConfig` object for TAP API configuration:

```typescript
export const tapConfig = {
  secretKey: process.env.TAP_SECRET_KEY!,
  apiBaseUrl: process.env.TAP_API_BASE_URL || 'https://api.tap.company/v2',
};
```

## Usage Examples

### Generate Invoice for Order

```typescript
// In admin order management
const handleGenerateInvoice = async () => {
  const response = await fetch('/api/admin/create-tap-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: order.id }),
  });
  
  if (response.ok) {
    const result = await response.json();
    if (result.success) {
      showToast('Invoice generated successfully!', 'success');
    }
  }
};
```

### Using ES6 Module Functions

```typescript
// Import specific functions
import { createInvoice, getInvoice, cancelInvoice } from '@/lib/tapInvoiceManagement';

// Use functions directly
const invoice = await createInvoice(invoiceData);
const invoiceDetails = await getInvoice(invoiceId);
await cancelInvoice(invoiceId);
```

### Resend Invoice to Customer

```typescript
const handleResendInvoice = async () => {
  const response = await fetch('/api/admin/resend-tap-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: order.id,
      paymentRecordId: latestTapInvoice.id,
    }),
  });
  
  if (response.ok) {
    showToast('Invoice resent successfully!', 'success');
  }
};
```

## Best Practices

1. **Always validate customer data** before creating invoices
2. **Handle phone number formatting** for Bahrain numbers
3. **Log all payment operations** for audit trails
4. **Provide clear user feedback** for all operations
5. **Implement proper error handling** for API failures
6. **Use secure authentication** for all admin operations
7. **Monitor invoice status** regularly
8. **Backup payment records** regularly

## Troubleshooting

### Common Issues

1. **Invoice Creation Fails**
   - Check customer data completeness
   - Verify TAP API credentials
   - Ensure valid amount (greater than 0)

2. **Resend Invoice Fails**
   - Verify invoice exists and is not expired
   - Check TAP API status
   - Ensure proper invoice ID

3. **Cancel Invoice Fails**
   - Verify invoice is in cancellable state
   - Check TAP API permissions
   - Ensure proper authentication

### Debug Information

All operations log detailed information to help with troubleshooting:

```typescript
logger.info('Creating TAP invoice:', JSON.stringify(invoiceData, null, 2));
logger.error('TAP API error:', errorText);
logger.info('Invoice created successfully:', invoiceId);
```

## Future Enhancements

1. **Bulk Invoice Operations**: Generate multiple invoices at once
2. **Invoice Templates**: Customizable invoice templates
3. **Advanced Filtering**: More sophisticated invoice filtering options
4. **Automated Reminders**: Automatic invoice reminder scheduling
5. **Payment Analytics**: Detailed payment analytics and reporting
6. **Multi-currency Support**: Support for multiple currencies
7. **Invoice Archiving**: Long-term invoice storage and retrieval 