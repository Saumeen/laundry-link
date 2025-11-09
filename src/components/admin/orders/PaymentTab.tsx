'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { formatUTCForDisplay } from '@/lib/utils/timezone';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useToast } from '@/components/ui/Toast';
import logger from '@/lib/logger';

interface PaymentRecord {
  id: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND';
  description?: string;
  tapTransactionId?: string;
  tapReference?: string;
  refundAmount?: number;
  refundReason?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: string;
  walletTransaction?: {
    id: number;
    transactionType: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    status: string;
    description: string;
  };
}

interface PaymentSummary {
  totalPaid: number;
  totalRefunded: number;
  totalPending: number;
  totalFailed: number;
  availableForRefund: number;
  netAmountPaid: number;
  outstandingAmount: number;
  paymentRecordsCount: number;
  invoiceTotal: number;
}

interface OrderWithPayment {
  id: number;
  orderNumber: string;
  invoiceTotal?: number;
  paymentStatus: string;
  paymentRecords: PaymentRecord[];
  paymentSummary: PaymentSummary;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    wallet?: {
      balance: number;
      currency: string;
    };
  };
}

interface PaymentTabProps {
  order: OrderWithPayment;
  onRefresh: () => void;
}

interface TapInvoiceData {
  id: string;
  url: string;
  status: string;
  amount: number;
  currency: string;
  created: number;
  due?: number;
  expiry?: number;
  track?: {
    status: string;
    link: string;
  };
  transactions?: Array<{
    id: string;
    status: string;
    amount: number;
  }>;
}

const PaymentTab: React.FC<PaymentTabProps> = ({ order, onRefresh }) => {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [resendingInvoice, setResendingInvoice] = useState(false);
  const [syncingPayment, setSyncingPayment] = useState(false);
  const [showPaymentStatusModal, setShowPaymentStatusModal] = useState(false);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<'PENDING' | 'PAID' | 'FAILED'>(order.paymentStatus as 'PENDING' | 'PAID' | 'FAILED' || 'PENDING');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentStatusNotes, setPaymentStatusNotes] = useState('');
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);

  // Check if user is super admin
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  // Use backend-calculated payment summary
  const {
    totalPaid,
    outstandingAmount,
    totalPending,
    paymentRecordsCount,
    invoiceTotal
  } = order.paymentSummary;

  // Get the latest TAP invoice payment record
  const latestTapInvoice = order.paymentRecords
    .filter(payment => payment.paymentMethod === 'TAP_INVOICE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const getTapInvoiceData = (paymentRecord: PaymentRecord): TapInvoiceData | null => {
    if (!paymentRecord.metadata) return null;
    try {
      const metadata = JSON.parse(paymentRecord.metadata);
      return {
        id: metadata.tapInvoiceId || paymentRecord.tapReference || '',
        url: metadata.tapInvoiceUrl || '',
        status: paymentRecord.paymentStatus,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        created: new Date(paymentRecord.createdAt).getTime(),
      };
    } catch (error) {
      logger.error('Error parsing payment metadata:', error);
      return null;
    }
  };



  const handleResendInvoice = async () => {
    if (!latestTapInvoice) return;
    
    setResendingInvoice(true);
    try {
      const response = await fetch('/api/admin/resend-tap-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          paymentRecordId: latestTapInvoice.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to resend invoice');
      }

      showToast('Invoice resent successfully!', 'success');
    } catch (error) {
      logger.error('Error resending invoice:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to resend invoice',
        'error'
      );
    } finally {
      setResendingInvoice(false);
    }
  };


  const handleSyncPaymentStatus = async () => {
    setSyncingPayment(true);
    try {
      const response = await fetch('/api/admin/sync-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to sync payment status');
      }

      const result = await response.json() as { success: boolean; message?: string };
      
      showToast(
        result.message || 'Payment status synced successfully!',
        'success'
      );
      
      // Refresh order data to show updated payment information
      onRefresh();
    } catch (error) {
      logger.error('Error syncing payment status:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to sync payment status',
        'error'
      );
    } finally {
      setSyncingPayment(false);
    }
  };

  const handleViewInvoice = async () => {
    if (!latestTapInvoice) return;
    
    const invoiceData = getTapInvoiceData(latestTapInvoice);
    if (invoiceData?.url) {
      window.open(invoiceData.url, '_blank');
    } else {
      showToast('Invoice URL not available', 'error');
    }
  };


  const handleUpdatePaymentStatus = async () => {
    if (!selectedPaymentStatus || !paymentAmount) {
      showToast('Please enter payment amount and select status', 'error');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    if (amount > Math.abs(outstandingAmount)) {
      showToast(`Payment amount cannot exceed outstanding amount of ${formatCurrency(Math.abs(outstandingAmount))}`, 'error');
      return;
    }

    setUpdatingPaymentStatus(true);
    try {
      const response = await fetch('/api/admin/update-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          paymentStatus: selectedPaymentStatus,
          amount: amount,
          notes: paymentStatusNotes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to add payment');
      }

      const result = await response.json() as { success: boolean; message?: string };
      
      showToast(
        result.message || `Payment of ${formatCurrency(amount)} added successfully!`,
        'success'
      );
      
      setShowPaymentStatusModal(false);
      setPaymentAmount('');
      setPaymentStatusNotes('');
      
      // Refresh order data
      onRefresh();
    } catch (error) {
      logger.error('Error adding payment:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to add payment',
        'error'
      );
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800';
      case 'PARTIAL_REFUND':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string, metadata?: string) => {
    // Check if this is a refund transaction
    if (metadata && metadata.includes('"isRefund":true')) {
      return '↩️'; // Return arrow for refunds
    }
    
    switch (method.toLowerCase()) {
      case 'card':
        return '💳';
      case 'wallet':
        return '💰';
      case 'cash':
        return '💵';
      case 'tap_invoice':
        return '📄';
      case 'tap_pay':
        return '💳';
      case 'apple_pay':
        return '🍎';
      case 'google_pay':
        return '📱';
      case 'samsung_pay':
        return '📱';
      case 'bank_transfer':
        return '🏦';
      default:
        return '💳';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'text-green-600';
      case 'PENDING':
        return 'text-yellow-600';
      case 'CANCELLED':
        return 'text-red-600';
      case 'EXPIRED':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg font-semibold mb-2">
          Access Restricted
        </div>
        <p className="text-gray-600">
          Only Super Administrators can access payment management features.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Payment Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Payment Status
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={handleSyncPaymentStatus}
              disabled={syncingPayment}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncingPayment ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync
                </>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedPaymentStatus(order.paymentStatus as 'PENDING' | 'PAID' | 'FAILED' || 'PENDING');
                setPaymentAmount(Math.abs(outstandingAmount).toString());
                setPaymentStatusNotes('');
                setShowPaymentStatusModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Update Status
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Required Amount</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(invoiceTotal)}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Paid Amount</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
          </div>
          <div className={`rounded-lg p-4 ${outstandingAmount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className="text-sm text-gray-600 mb-1">Outstanding</div>
            <div className={`text-2xl font-bold ${outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(outstandingAmount))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Current Payment Status</div>
              <div className="mt-1">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAP Invoice Section - Only show if invoice exists */}
      {latestTapInvoice && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              TAP Invoice
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handleViewInvoice}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View
              </button>
              <button
                onClick={handleResendInvoice}
                disabled={resendingInvoice}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {resendingInvoice ? 'Sending...' : 'Resend'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className={`font-semibold ${getInvoiceStatusColor(latestTapInvoice.paymentStatus)}`}>
                {latestTapInvoice.paymentStatus}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Amount</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(latestTapInvoice.amount)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Created</div>
              <div className="font-semibold text-gray-900">
                {formatUTCForDisplay(latestTapInvoice.createdAt)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Records - Simplified */}
      {order.paymentRecords && order.paymentRecords.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payment History ({paymentRecordsCount})
          </h3>
          <div className="space-y-3">
            {order.paymentRecords.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {getPaymentMethodIcon(payment.paymentMethod, payment.metadata)}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {payment.paymentMethod.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatUTCForDisplay(payment.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeColor(payment.paymentStatus)}`}>
                    {payment.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Payment Status Update Modal */}
      {showPaymentStatusModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Payment
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Status
                  </label>
                  <div className="text-sm text-gray-600 mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outstanding Amount
                  </label>
                  <div className="text-lg font-bold text-red-600 mb-2">
                    {formatCurrency(Math.abs(outstandingAmount))}
                  </div>
                  {totalPending > 0 && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
                      ⚠️ Note: There are {formatCurrency(totalPending)} in pending payments. Outstanding amount already accounts for these.
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Being Paid (BHD)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    max={Math.abs(outstandingAmount)}
                    value={paymentAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = parseFloat(value);
                      if (value === '' || (!isNaN(numValue) && numValue > 0 && numValue <= Math.abs(outstandingAmount))) {
                        setPaymentAmount(value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter payment amount"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Maximum: {formatCurrency(Math.abs(outstandingAmount))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={selectedPaymentStatus}
                    onChange={(e) => setSelectedPaymentStatus(e.target.value as 'PENDING' | 'PAID' | 'FAILED')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentStatusNotes}
                    onChange={(e) => setPaymentStatusNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                    placeholder="Add notes (e.g., cash payment, bank transfer)"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowPaymentStatusModal(false);
                      setPaymentAmount('');
                      setPaymentStatusNotes('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    disabled={updatingPaymentStatus}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePaymentStatus}
                    disabled={updatingPaymentStatus || !paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > Math.abs(outstandingAmount)}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingPaymentStatus ? 'Adding...' : 'Add Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default PaymentTab; 