'use client';

import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<TapInvoiceData | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [resendingInvoice, setResendingInvoice] = useState(false);
<<<<<<< Updated upstream
  const [cancellingInvoice, setCancellingInvoice] = useState(false);
=======
  const [syncingPayment, setSyncingPayment] = useState(false);
  const [showPaymentStatusModal, setShowPaymentStatusModal] = useState(false);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<'PENDING' | 'PAID' | 'FAILED'>(order.paymentStatus as 'PENDING' | 'PAID' | 'FAILED' || 'PENDING');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentStatusNotes, setPaymentStatusNotes] = useState('');
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);
  const [editingPaymentRecord, setEditingPaymentRecord] = useState<PaymentRecord | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND'>('PAID');
  const [editPaymentNotes, setEditPaymentNotes] = useState('');
  const [updatingPaymentRecord, setUpdatingPaymentRecord] = useState(false);
>>>>>>> Stashed changes

  // Check if user is super admin
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  // Use backend-calculated payment summary
  const {
    totalPaid,
<<<<<<< Updated upstream
    totalRefunded,
=======
    netAmountPaid,
    outstandingAmount,
>>>>>>> Stashed changes
    totalPending,
    totalFailed,
    availableForRefund,
    netAmountPaid,
    outstandingAmount,
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

  const handleRefundClick = (paymentId: number, amount: number) => {
    setSelectedPaymentId(paymentId);
    setRefundAmount(amount.toString());
    setRefundReason('');
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async () => {
    if (!selectedPaymentId || !refundAmount || !refundReason) {
      return;
    }

    setProcessingRefund(true);
    try {
      const response = await fetch('/api/admin/process-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: selectedPaymentId,
          orderId: order.id,
          customerId: order.customer.id,
          refundAmount: parseFloat(refundAmount),
          refundReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to process refund');
      }

      // Refresh order data
      onRefresh();
      setShowRefundModal(false);
      setSelectedPaymentId(null);
      setRefundAmount('');
      setRefundReason('');
      
      showToast(
        `Successfully processed refund of ${formatCurrency(parseFloat(refundAmount))}`,
        'success'
      );
    } catch (error) {
      logger.error('Error processing refund:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to process refund',
        'error'
      );
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      const response = await fetch('/api/admin/create-tap-invoice', {
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
        throw new Error(errorData.error || 'Failed to generate invoice');
      }

      const result = await response.json() as { success: boolean; tapInvoice?: any; error?: string };
      
      if (result.success && result.tapInvoice) {
        showToast('Invoice generated successfully!', 'success');
        onRefresh();
      } else {
        showToast('No payment required - customer has sufficient wallet balance', 'info');
      }
    } catch (error) {
      logger.error('Error generating invoice:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to generate invoice',
        'error'
      );
    } finally {
      setGeneratingInvoice(false);
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

  const handleCancelInvoice = async () => {
    if (!latestTapInvoice) return;
    
    setCancellingInvoice(true);
    try {
      const response = await fetch('/api/admin/cancel-tap-invoice', {
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
        throw new Error(errorData.error || 'Failed to cancel invoice');
      }

      showToast('Invoice cancelled successfully!', 'success');
      onRefresh();
    } catch (error) {
      logger.error('Error cancelling invoice:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to cancel invoice',
        'error'
      );
    } finally {
      setCancellingInvoice(false);
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

  const handleViewInvoiceDetails = async () => {
    if (!latestTapInvoice) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/get-tap-invoice', {
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
        throw new Error(errorData.error || 'Failed to fetch invoice details');
      }

      const result = await response.json() as { success: boolean; invoice: TapInvoiceData; error?: string };
      setInvoiceData(result.invoice);
      setShowInvoiceModal(true);
    } catch (error) {
      logger.error('Error fetching invoice details:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to fetch invoice details',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditPaymentRecord = (payment: PaymentRecord) => {
    setEditingPaymentRecord(payment);
    setEditPaymentAmount(payment.amount.toString());
    setEditPaymentStatus(payment.paymentStatus as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND');
    setEditPaymentNotes(payment.description || '');
  };

  const handleUpdatePaymentRecord = async () => {
    if (!editingPaymentRecord) return;

    const amount = parseFloat(editPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    setUpdatingPaymentRecord(true);
    try {
      const response = await fetch('/api/admin/update-payment-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentRecordId: editingPaymentRecord.id,
          amount: amount,
          paymentStatus: editPaymentStatus,
          notes: editPaymentNotes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to update payment record');
      }

      const result = await response.json() as { success: boolean; message?: string };
      
      showToast(
        result.message || 'Payment record updated successfully!',
        'success'
      );
      
      setEditingPaymentRecord(null);
      setEditPaymentAmount('');
      setEditPaymentStatus('PAID');
      setEditPaymentNotes('');
      
      // Refresh order data
      onRefresh();
    } catch (error) {
      logger.error('Error updating payment record:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to update payment record',
        'error'
      );
    } finally {
      setUpdatingPaymentRecord(false);
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
      {/* Enhanced Payment Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Order Total</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(invoiceTotal)}
            </div>
          </div>
<<<<<<< Updated upstream
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Paid</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
=======
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Paid Amount</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(netAmountPaid)}
>>>>>>> Stashed changes
            </div>
            {totalPaid !== netAmountPaid && (
              <div className="text-xs text-gray-500 mt-1">
                (Gross: {formatCurrency(totalPaid)})
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Refunded</div>
            <div className="text-xl font-bold text-blue-600">
              {formatCurrency(totalRefunded)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Net Amount</div>
            <div className="text-xl font-bold text-purple-600">
              {formatCurrency(netAmountPaid)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Outstanding</div>
            <div className={`text-xl font-bold ${outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(outstandingAmount))}
            </div>
            {totalPending > 0 && (
              <div className="text-xs text-amber-600 mt-1">
                ({formatCurrency(totalPending)} pending)
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Available for Refund</div>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(availableForRefund)}
            </div>
          </div>
        </div>
        
        {/* Payment Status Breakdown */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Pending Payments</div>
              <div className="text-lg font-semibold text-yellow-600">
                {formatCurrency(totalPending)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Failed Payments</div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(totalFailed)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Payment Records</div>
              <div className="text-lg font-semibold text-gray-900">
                {paymentRecordsCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Management Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Invoice Management
          </h3>
<<<<<<< Updated upstream
          <div className="flex space-x-2">
            {/* {!latestTapInvoice && (
              <button
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingInvoice ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Generate Invoice
                  </>
                )}
              </button>
            )} */}
            {latestTapInvoice && (
              <>
                <button
                  onClick={handleViewInvoice}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Invoice
                </button>
                <button
                  onClick={handleViewInvoiceDetails}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Details
                </button>
                <button
                  onClick={handleResendInvoice}
                  disabled={resendingInvoice}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {resendingInvoice ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Resend
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelInvoice}
                  disabled={cancellingInvoice}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {cancellingInvoice ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </>
                  )}
                </button>
              </>
            )}
=======
          <div className="space-y-3">
            {order.paymentRecords.map((payment) => {
              // Check if this payment was manually added/updated
              let isManuallyAdded = false;
              try {
                const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
                isManuallyAdded = metadata.manuallyAdded === true || metadata.manuallyUpdated === true;
              } catch {
                // Ignore parsing errors
              }

              return (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-xl">
                      {getPaymentMethodIcon(payment.paymentMethod, payment.metadata)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.paymentMethod.toUpperCase()}
                        </div>
                        {isManuallyAdded && (
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                            Manual
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatUTCForDisplay(payment.createdAt)}
                      </div>
                      {payment.description && (
                        <div className="text-xs text-gray-600 mt-1">
                          {payment.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeColor(payment.paymentStatus)}`}>
                        {payment.paymentStatus}
                      </span>
                    </div>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleEditPaymentRecord(payment)}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Edit payment record"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Payment Record Modal */}
      {editingPaymentRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Payment Record
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <div className="text-sm text-gray-600 mb-2">
                    {editingPaymentRecord.paymentMethod.toUpperCase()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Amount
                  </label>
                  <div className="text-lg font-bold text-gray-900 mb-2">
                    {formatCurrency(editingPaymentRecord.amount)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Amount (BHD)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={editPaymentAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = parseFloat(value);
                      if (value === '' || (!isNaN(numValue) && numValue > 0)) {
                        setEditPaymentAmount(value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter payment amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="PARTIAL_REFUND">PARTIAL_REFUND</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={editPaymentNotes}
                    onChange={(e) => setEditPaymentNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                    placeholder="Add notes about this update"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setEditingPaymentRecord(null);
                      setEditPaymentAmount('');
                      setEditPaymentStatus('PAID');
                      setEditPaymentNotes('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    disabled={updatingPaymentRecord}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePaymentRecord}
                    disabled={updatingPaymentRecord || !editPaymentAmount || parseFloat(editPaymentAmount) <= 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingPaymentRecord ? 'Updating...' : 'Update Payment'}
                  </button>
                </div>
              </div>
            </div>
>>>>>>> Stashed changes
          </div>
        </div>

        {latestTapInvoice && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Invoice Status</div>
                <div className={`font-semibold ${getInvoiceStatusColor(latestTapInvoice.paymentStatus)}`}>
                  {latestTapInvoice.paymentStatus}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Invoice Amount</div>
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
      </div>

      {/* Customer Wallet Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Customer Wallet Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Customer Name</div>
            <div className="font-semibold text-gray-900">
              {order.customer.firstName} {order.customer.lastName}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Current Wallet Balance</div>
            <div className="font-semibold text-gray-900">
              {formatCurrency(order.customer.wallet?.balance || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Records */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Payment Records ({paymentRecordsCount})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(order.paymentRecords || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No payment records found for this order.
                  </td>
                </tr>
              ) : (
                (order.paymentRecords || []).map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {getPaymentMethodIcon(payment.paymentMethod, payment.metadata)}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.paymentMethod.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.description || 'Order payment'}
                          </div>
                          {payment.tapTransactionId && (
                            <div className="text-xs text-gray-400">
                              TAP ID: {payment.tapTransactionId}
                            </div>
                          )}
                          {payment.walletTransaction && (
                            <div className="text-xs text-gray-400">
                              Wallet TX: {payment.walletTransaction.id}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      {payment.refundAmount && payment.refundAmount > 0 && (
                        <div className="text-sm text-blue-600">
                          Refunded: {formatCurrency(payment.refundAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(payment.paymentStatus)}`}>
                        {payment.paymentStatus}
                      </span>
                      {payment.refundReason && (
                        <div className="text-xs text-gray-500 mt-1">
                          Reason: {payment.refundReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatUTCForDisplay(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {payment.paymentStatus === 'PAID' && availableForRefund > 0 && 
                       !payment.metadata?.includes('"isRefund":true') && (
                        <button
                          onClick={() => handleRefundClick(payment.id, payment.amount)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Refund
                        </button>
                      )}
                      {payment.metadata?.includes('"isRefund":true') && (
                        <div className="text-xs text-green-600 font-medium">
                          Refund Transaction
                        </div>
                      )}
                      {['REFUNDED', 'PARTIAL_REFUND'].includes(payment.paymentStatus) && 
                       !payment.metadata?.includes('"isRefund":true') && (
                        <div className="text-xs text-gray-500">
                          Refunded on {formatUTCForDisplay(payment.updatedAt)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Process Refund
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount (BD)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter refund amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Reason
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter reason for refund"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowRefundModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    disabled={processingRefund}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRefundSubmit}
                    disabled={processingRefund || !refundAmount || !refundReason}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingRefund ? 'Processing...' : 'Process Refund'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showInvoiceModal && invoiceData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Invoice Details
                </h3>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">Invoice ID</div>
                    <div className="font-semibold text-gray-900">{invoiceData.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className={`font-semibold ${getInvoiceStatusColor(invoiceData.status)}`}>
                      {invoiceData.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Amount</div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(invoiceData.amount)} {invoiceData.currency}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Created</div>
                    <div className="font-semibold text-gray-900">
                      {formatUTCForDisplay(new Date(invoiceData.created).toISOString())}
                    </div>
                  </div>
                  {invoiceData.due && (
                    <div>
                      <div className="text-sm text-gray-600">Due Date</div>
                      <div className="font-semibold text-gray-900">
                        {formatUTCForDisplay(new Date(invoiceData.due).toISOString())}
                      </div>
                    </div>
                  )}
                  {invoiceData.expiry && (
                    <div>
                      <div className="text-sm text-gray-600">Expires</div>
                      <div className="font-semibold text-gray-900">
                        {formatUTCForDisplay(new Date(invoiceData.expiry).toISOString())}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {invoiceData.track && (
                    <div>
                      <div className="text-sm text-gray-600">Tracking Status</div>
                      <div className="font-semibold text-gray-900">{invoiceData.track.status}</div>
                      {invoiceData.track.link && (
                        <a
                          href={invoiceData.track.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Tracking Details →
                        </a>
                      )}
                    </div>
                  )}
                  
                  {invoiceData.transactions && invoiceData.transactions.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Transactions</div>
                      <div className="space-y-2">
                        {invoiceData.transactions.map((transaction, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.id}
                            </div>
                            <div className="text-sm text-gray-600">
                              Status: {transaction.status} | Amount: {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {invoiceData.url && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Invoice URL</div>
                      <a
                        href={invoiceData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open Invoice
                      </a>
                    </div>
                  )}
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