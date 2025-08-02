# Wallet System Documentation

## Overview

The wallet system provides customers with a digital wallet to manage their laundry service payments. It includes balance tracking, transaction history, top-up functionality, and integration with payment gateways like Tap Pay.

## Features

### Customer Wallet Features

1. **Balance Management**
   - Real-time balance display
   - Secure balance updates
   - Transaction history tracking

2. **Top-up Functionality**
   - Multiple payment methods (Tap Pay, Card, Bank Transfer)
   - Secure payment processing
   - Automatic balance updates

3. **Transaction History**
   - Detailed transaction records
   - Pagination support
   - Transaction categorization (Deposit, Payment, Refund, etc.)

4. **Payment Integration**
   - Tap Pay integration for card payments
   - Apple Pay and Google Pay support
   - Bank transfer options

## API Endpoints

### Wallet Information
- `GET /api/wallet?customerId={id}` - Get wallet balance and recent transactions
- `GET /api/wallet/transactions?customerId={id}&page={page}&limit={limit}` - Get paginated transaction history
- `GET /api/wallet/stats?customerId={id}` - Get wallet statistics

### Wallet Transactions
- `POST /api/wallet` - Process wallet transactions (deposit, withdrawal, adjustment)

### Payment Processing
- `POST /api/payment/process` - Process wallet top-up payments

## Database Schema

### Wallet Table
```sql
CREATE TABLE wallet (
  id INTEGER PRIMARY KEY,
  customerId INTEGER NOT NULL,
  balance DECIMAL(10,3) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'BHD',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Wallet Transactions Table
```sql
CREATE TABLE wallet_transactions (
  id INTEGER PRIMARY KEY,
  walletId INTEGER NOT NULL,
  transactionType VARCHAR(20) NOT NULL,
  amount DECIMAL(10,3) NOT NULL,
  description TEXT NOT NULL,
  reference VARCHAR(255),
  metadata TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Transaction Types

- **DEPOSIT** - Money added to wallet (top-up, refund)
- **WITHDRAWAL** - Money removed from wallet
- **PAYMENT** - Payment for services
- **REFUND** - Refund for cancelled services
- **ADJUSTMENT** - Manual balance adjustments
- **TRANSFER** - Transfer between wallets

## Frontend Components

### 1. Wallet Page (`/customer/wallet`)
- Full wallet management interface
- Balance display with top-up functionality
- Transaction history with pagination
- Payment method selection
- Real-time updates

### 2. Wallet Overview Component
- Quick wallet summary for dashboard
- Recent transactions display
- Balance and statistics
- Quick action buttons

### 3. Wallet Modal
- Lightweight wallet information display
- Basic balance and account details

## Payment Integration

### Tap Pay Integration
- Secure card payment processing
- Apple Pay and Google Pay support
- Automatic payment confirmation
- Webhook handling for payment status

### Payment Flow
1. Customer initiates top-up
2. Payment request sent to Tap Pay
3. Customer redirected to payment gateway
4. Payment processed and confirmed
5. Wallet balance updated automatically
6. Transaction recorded in database

## Security Features

1. **Input Validation**
   - Amount validation (minimum 0.001 BD)
   - Customer ID verification
   - Transaction type validation

2. **Error Handling**
   - Comprehensive error messages
   - Transaction rollback on failure
   - Payment status tracking

3. **Data Integrity**
   - Atomic transactions
   - Balance consistency checks
   - Audit trail maintenance

## Usage Examples

### Customer Top-up Flow
```typescript
// 1. Customer selects amount and payment method
const topUpData = {
  amount: 50.000,
  paymentMethod: 'TAP_PAY',
  description: 'Wallet top-up - 50.000 BD'
};

// 2. Process payment
const response = await walletApi.topUpWallet(topUpData);

// 3. Redirect to payment gateway if needed
if (response.data?.redirectUrl) {
  window.location.href = response.data.redirectUrl;
}
```

### Transaction History
```typescript
// Get paginated transaction history
const history = await walletApi.getTransactionHistory(customerId, 1, 20);

// Display transactions
history.transactions.forEach(transaction => {
  console.log(`${transaction.transactionType}: ${transaction.amount} BD`);
});
```

## Configuration

### Environment Variables
```env
# Tap Pay Configuration
TAP_PAY_SECRET_KEY=your_secret_key
TAP_PAY_PUBLISHABLE_KEY=your_publishable_key
TAP_PAY_WEBHOOK_SECRET=your_webhook_secret

# Database Configuration
DATABASE_URL=your_database_url
```

### Wallet Settings
- Currency: Bahraini Dinar (BD)
- Minimum top-up: 0.001 BD
- Maximum balance: No limit
- Transaction fees: None

## Error Handling

### Common Error Scenarios
1. **Insufficient Balance** - Prevent payments exceeding wallet balance
2. **Invalid Amount** - Reject negative or zero amounts
3. **Payment Failure** - Handle failed payment attempts
4. **Network Issues** - Retry mechanisms for API calls

### Error Response Format
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE"
}
```

## Monitoring and Analytics

### Key Metrics
- Total wallet transactions
- Average top-up amount
- Payment success rate
- Customer wallet usage patterns

### Logging
- Transaction logging for audit trails
- Payment processing logs
- Error tracking and monitoring

## Future Enhancements

1. **Wallet Features**
   - Scheduled top-ups
   - Spending limits
   - Family wallet sharing
   - Loyalty rewards integration

2. **Payment Methods**
   - Additional payment gateways
   - Cryptocurrency support
   - Mobile money integration

3. **Analytics**
   - Advanced reporting
   - Customer behavior analysis
   - Predictive analytics

## Support and Maintenance

### Regular Tasks
- Monitor transaction logs
- Verify payment confirmations
- Update payment gateway configurations
- Backup wallet data

### Troubleshooting
- Check payment gateway status
- Verify webhook configurations
- Review error logs
- Test payment flows

## Security Best Practices

1. **Data Protection**
   - Encrypt sensitive data
   - Secure API endpoints
   - Regular security audits

2. **Access Control**
   - Role-based permissions
   - API key management
   - Session handling

3. **Compliance**
   - PCI DSS compliance for payments
   - Data privacy regulations
   - Financial reporting requirements 