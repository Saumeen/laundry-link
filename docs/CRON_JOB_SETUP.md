# Cron Job Setup for Payment Status Checking

This document explains how to set up and use the cron job system for checking pending payment statuses and updating wallet balances.

## Overview

The cron job system automatically checks pending payments every 5 minutes and updates their status based on the TAP payment gateway response. It also updates wallet balances when payments are successful.

## Features

- **Automatic Payment Status Checking**: Checks pending payments every 5 minutes
- **Wallet Balance Updates**: Automatically updates wallet balances for successful payments
- **Admin Monitoring Interface**: Real-time monitoring of cron job status and execution history
- **Error Handling**: Comprehensive error handling and logging
- **Statistics**: Detailed statistics about pending payments

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Cron Job Configuration
CRON_SECRET_TOKEN=your-secret-token-here

# TAP Payment Configuration (if not already set)
TAP_API_BASE_URL=https://api.tap.company/v2
TAP_SECRET_KEY=your-tap-secret-key

# App URL for cron job execution
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Schema

The system uses the existing database schema with the following key tables:

- `PaymentRecord`: Stores payment information with TAP charge IDs
- `WalletTransaction`: Stores wallet transaction details
- `Wallet`: Stores customer wallet balances

### 3. Deployment Options

#### Option A: Built-in Scheduler (Recommended for small to medium scale)

The system includes a built-in scheduler that automatically starts in production:

```typescript
// Automatically starts in production
if (process.env.NODE_ENV === 'production') {
  setTimeout(() => {
    cronScheduler.start();
  }, 5000);
}
```

#### Option B: External Cron Service (Recommended for large scale)

For production environments with high traffic, use an external cron service:

**Using Vercel Cron Jobs:**

Create a `vercel.json` file in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-payments",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Using GitHub Actions:**

Create `.github/workflows/cron.yml`:

```yaml
name: Payment Status Check

on:
  schedule:
    - cron: '*/5 * * * *'

jobs:
  check-payments:
    runs-on: ubuntu-latest
    steps:
      - name: Check pending payments
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
            -H "Content-Type: application/json" \
            https://your-domain.com/api/cron/check-payments
```

**Using AWS EventBridge:**

```json
{
  "schedule": "rate(5 minutes)",
  "target": {
    "arn": "your-lambda-function-arn",
    "input": {
      "url": "https://your-domain.com/api/cron/check-payments",
      "headers": {
        "Authorization": "Bearer your-secret-token"
      }
    }
  }
}
```

## API Endpoints

### 1. Trigger Payment Status Check

```http
POST /api/cron/check-payments
Authorization: Bearer your-secret-token
```

**Response:**
```json
{
  "success": true,
  "message": "Payment status check completed",
  "updatedCount": 5,
  "errors": [],
  "stats": {
    "totalPending": 10,
    "pendingWithTapId": 8,
    "pendingWithoutTapId": 2,
    "lastChecked": "2024-01-15T10:30:00.000Z"
  },
  "cleanedCount": 2,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Get Payment Statistics

```http
GET /api/cron/check-payments
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPending": 10,
    "pendingWithTapId": 8,
    "pendingWithoutTapId": 2,
    "lastChecked": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Admin Cron Status (Requires Admin Authentication)

```http
GET /api/admin/cron/status?includeStats=true&includeHistory=true&limit=20
```

**Response:**
```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "activeJobs": 2,
    "totalExecutions": 150,
    "lastExecution": {
      "jobName": "payment-status-check",
      "startTime": "2024-01-15T10:30:00.000Z",
      "endTime": "2024-01-15T10:30:15.000Z",
      "success": true
    }
  },
  "executionHistory": [...],
  "paymentStats": {...},
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Control Cron Scheduler (Requires Admin Authentication)

```http
POST /api/admin/cron/status
Content-Type: application/json

{
  "action": "start" | "stop" | "restart"
}
```

## Admin Interface

The system includes a React component for monitoring cron jobs:

```tsx
import CronJobMonitor from '@/components/admin/CronJobMonitor';

// Use in your admin dashboard
<CronJobMonitor />
```

Features:
- Real-time status monitoring
- Start/Stop/Restart controls
- Execution history
- Payment statistics
- Auto-refresh capability

## Configuration

### Cron Job Schedules

Edit `src/lib/cron/cronConfig.ts` to modify job schedules:

```typescript
export const CRON_JOBS: CronJobConfig[] = [
  {
    name: 'payment-status-check',
    schedule: '*/5 * * * *', // Every 5 minutes
    endpoint: '/api/cron/check-payments',
    enabled: true,
    description: 'Check pending payment statuses and update wallet balances'
  },
  {
    name: 'payment-status-check-hourly',
    schedule: '0 * * * *', // Every hour
    endpoint: '/api/cron/check-payments',
    enabled: true,
    description: 'Hourly check for pending payments (backup)'
  }
];
```

### Payment Status Mapping

The system maps TAP payment statuses to internal statuses:

- `captured` / `authorized` → `PAID`
- `declined` / `failed` / `cancelled` → `FAILED`
- `pending` → `PENDING` (unchanged)

## Monitoring and Logging

### Console Logs

The system provides detailed console logging:

```
Starting payment status check...
Found 5 pending payments to check
Checking payment 123 with TAP charge ID: chg_123456
TAP charge status for payment 123: captured
Updated payment 123 to status: PAID
Updated wallet 456 balance: 100.00 -> 150.00
Payment status check completed. Updated: 5, Errors: 0
```

### Error Handling

The system handles various error scenarios:

- Network errors when calling TAP API
- Invalid TAP charge IDs
- Database connection issues
- Invalid payment statuses

### Performance Considerations

- Only checks payments from the last 24 hours
- Processes payments in batches
- Includes error rate limiting
- Maintains execution history (last 100 executions)

## Troubleshooting

### Common Issues

1. **Cron job not running**
   - Check if `CRON_SECRET_TOKEN` is set
   - Verify the endpoint is accessible
   - Check server logs for errors

2. **Payments not updating**
   - Verify TAP API credentials
   - Check if TAP charge IDs are stored correctly
   - Review payment status mapping

3. **Wallet balances not updating**
   - Check if wallet transactions are linked to payments
   - Verify transaction status updates
   - Review database constraints

### Debug Mode

Enable debug logging by setting:

```env
DEBUG_CRON=true
```

This will provide additional logging information for troubleshooting.

## Security Considerations

1. **Token Security**: Use a strong, unique `CRON_SECRET_TOKEN`
2. **Admin Access**: Ensure only authorized admins can access cron controls
3. **API Rate Limiting**: Consider implementing rate limiting for the cron endpoints
4. **Database Security**: Ensure proper database access controls

## Testing

### Manual Testing

Test the cron job manually:

```bash
curl -X POST \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/cron/check-payments
```

### Unit Testing

The system includes unit tests for the payment status checker:

```bash
npm test -- --testPathPattern=cron
```

## Support

For issues or questions:

1. Check the console logs for error messages
2. Review the execution history in the admin interface
3. Verify environment variables are set correctly
4. Test the TAP API connectivity manually

## Changelog

### Version 1.0.0
- Initial implementation
- Payment status checking every 5 minutes
- Wallet balance updates
- Admin monitoring interface
- Comprehensive error handling 