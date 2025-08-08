# Direct Payment Implementation with Refund Support

## Overview

The direct payment system has been enhanced to properly track all payment information for easy refunds. This implementation ensures that every payment is properly recorded with comprehensive metadata that makes refunds simple and traceable.

## Key Features

### 1. **Enhanced Payment Record Tracking**
- **Complete Payment Information**: Every direct payment creates a comprehensive payment record
- **Tap Integration**: Full integration with Tap payment gateway for secure processing
- **Refund Tracking**: Built-in support for full and partial refunds
- **Audit Trail**: Complete history of payment processing and refunds

### 2. **Comprehensive Metadata Storage**
Each payment record stores detailed metadata including:
- Payment type and method
- Order details and services
- Tap transaction information
- Refund eligibility and history
- Processing timestamps

### 3. **Easy Refund Processing**
- **Full Refunds**: Complete refund of original payment amount
- **Partial Refunds**: Refund specific amounts while maintaining payment record
- **Tap Integration**: Automatic refund processing through Tap API
- **Audit Trail**: Complete refund history and reasoning

## API Endpoints

### 1. **Direct Payment** - `/api/customer/direct-payment`
**Purpose**: Process direct card payments for orders

**Request**:
```json
{
  "orderId": 123,
  "amount": 25.500,
  "tokenId": "tok_xxx",
  "customerData": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+97312345678"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "paymentRecord": {
    "id": 456,
    "amount": 25.500,
    "paymentMethod": "TAP_PAY",
    "reference": "ORDER_LL12345678",
    "status": "PAID",
    "tapTransactionId": "chg_xxx",
    "refundable": true
  },
  "order": {
    "id": 123,
    "orderNumber": "LL12345678",
    "paymentStatus": "PAID",
    "paymentMethod": "TAP_PAY"
  }
}
```

### 2. **Super Admin Refund** - `/api/admin/process-refund`
**Purpose**: Process refunds for completed payments (Super Admin only)

**Request**:
```json
{
  "paymentId": 456,
  "orderId": 123,
  "customerId": 789,
  "refundAmount": 25.500,
  "refundReason": "Customer requested refund"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refundAmount": 25.500,
    "refundType": "TAP_REFUND",
    "refundPaymentRecordId": null,
    "originalPaymentRecordId": 456,
    "tapRefundId": "ref_xxx"
  }
}
```

## Payment Record Structure

### Core Fields
- **id**: Unique payment record identifier
- **customerId**: Customer who made the payment
- **orderId**: Associated order (if applicable)
- **amount**: Payment amount
- **currency**: Payment currency (BHD)
- **paymentMethod**: Payment method used (TAP_PAY)
- **paymentStatus**: Current payment status (PENDING, PAID, FAILED, REFUNDED)

### Tap Integration Fields
- **tapTransactionId**: Tap transaction identifier
- **tapChargeId**: Tap charge identifier (required for refunds)
- **tapReference**: Tap reference number
- **tapResponse**: Full Tap API response (JSON)

### Refund Fields
- **refundAmount**: Amount refunded (if any)
- **refundReason**: Reason for refund
- **metadata**: Comprehensive payment metadata including refund information

### Metadata Structure
```json
{
  "paymentType": "direct_invoice_payment",
  "orderNumber": "LL12345678",
  "customerId": 123,
  "services": [
    {
      "serviceId": 1,
      "serviceName": "Wash & Fold",
      "quantity": 1,
      "price": 25.500
    }
  ],
  "invoiceTotal": 25.500,
  "isExpressService": false,
  "tapTransactionId": "chg_xxx",
  "tapChargeId": "chg_xxx",
  "tapReference": "ORDER_LL12345678",
  "paymentMethod": "TAP_PAY",
  "refundable": true,
  "createdAt": "2024-01-15T10:25:00Z",
  "processedAt": "2024-01-15T10:30:00Z",
  "refund": {
    "amount": 25.500,
    "reason": "Customer requested refund",
    "tapRefundId": "ref_xxx",
    "processedAt": "2024-01-15T11:00:00Z",
    "isFullRefund": true
  }
}
```

## Refund Process Flow

### 1. **Refund Eligibility Check**
- Payment must be in "PAID" status
- Payment must be marked as refundable
- Tap charge ID must be available (for Tap payments)
- No previous refunds (or partial refund amount available)
- **Only Super Administrators can process refunds**

### 2. **Refund Processing**
- Validate refund amount (cannot exceed original amount)
- Process refund through appropriate method:
  - **Tap Refunds**: Process through Tap API
  - **Wallet Refunds**: Process through wallet system
- Update payment record with refund information
- Update order status if full refund
- Create order history entry

### 3. **Refund Types**
- **Full Refund**: Refunds entire payment amount, updates order status to "REFUNDED"
- **Partial Refund**: Refunds specific amount, maintains order status as "PAID"

### 4. **Refund Methods**
- **Tap Refunds**: For direct card payments, processed through Tap API
- **Wallet Refunds**: For wallet payments, processed through wallet system

## Benefits

### 1. **Easy Refund Management**
- Complete payment history tracking
- Automatic refund processing through Tap
- Comprehensive audit trail
- Support for both full and partial refunds
- **Centralized refund processing through Super Admin**

### 2. **Customer Service**
- Quick refund processing by administrators
- Transparent refund history
- Clear refund reasons and amounts
- Automatic order status updates

### 3. **Business Operations**
- Complete payment audit trail
- Easy reconciliation with Tap
- Comprehensive reporting capabilities
- Automated order status management
- **Secure refund processing with admin-only access**

### 4. **Technical Benefits**
- Consistent payment processing
- Proper error handling
- Comprehensive logging
- Scalable architecture
- **Dual refund system (Tap + Wallet)**

## Security Features

### 1. **Authentication**
- All endpoints require proper authentication
- **Refund processing restricted to Super Administrators only**
- Payment records are customer-scoped
- Refunds only allowed for verified payments

### 2. **Validation**
- Payment amount validation
- Refund amount validation
- Order ownership validation
- Payment status validation
- **Admin role validation for refunds**

### 3. **Audit Trail**
- Complete payment processing history
- Refund processing history
- Order status change history
- Comprehensive logging
- **Admin action tracking for refunds**

## Usage Examples

### Process Direct Payment
```javascript
const response = await fetch('/api/customer/direct-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 123,
    amount: 25.500,
    tokenId: 'tok_xxx',
    customerData: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+97312345678'
    }
  })
});
```

### Process Refund (Super Admin Only)
```javascript
const response = await fetch('/api/admin/process-refund', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentId: 456,
    orderId: 123,
    customerId: 789,
    refundAmount: 25.500,
    refundReason: 'Customer requested refund'
  })
});
```

## Admin Interface

### Super Admin Payment Management
- **Payment Tab**: View all payment records for orders
- **Refund Processing**: Process refunds with reason tracking
- **Payment Summary**: Comprehensive payment overview
- **Refund History**: Complete refund audit trail

### Refund Processing Features
- **Tap Refunds**: Automatic Tap API integration
- **Wallet Refunds**: Wallet balance management
- **Partial Refunds**: Support for partial amount refunds
- **Full Refunds**: Complete payment refunds
- **Order Status Updates**: Automatic order status management

## Conclusion

This enhanced direct payment implementation provides a robust, secure, and user-friendly payment system with comprehensive refund support. The system ensures that all payments are properly tracked and can be easily refunded when needed, providing excellent customer service and business operations support. **Refund processing is centralized through Super Administrators for security and control.** 