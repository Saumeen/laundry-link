'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatUTCForDisplay } from '@/lib/utils/timezone';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useToast } from '@/components/ui/Toast';

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

interface OrderWithPayment {
  id: number;
  orderNumber: string;
  invoiceTotal?: number;
  paymentStatus: string;
  paymentRecords: PaymentRecord[];
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

const PaymentTab: React.FC<PaymentTabProps> = ({ order, onRefresh }) => {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);

  // Check if user is super admin
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  const totalPaid = (order.paymentRecords || [])
    .filter(payment => payment.paymentStatus === 'PAID')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const totalRefunded = (order.paymentRecords || [])
    .filter(payment => ['REFUNDED', 'PARTIAL_REFUND'].includes(payment.paymentStatus))
    .reduce((sum, payment) => sum + (payment.refundAmount || 0), 0);

  const availableForRefund = totalPaid - totalRefunded;

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
      console.error('Error processing refund:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to process refund',
        'error'
      );
    } finally {
      setProcessingRefund(false);
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card':
        return '💳';
      case 'wallet':
        return '💰';
      case 'cash':
        return '💵';
      default:
        return '💳';
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
      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Order Total</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(order.invoiceTotal || 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Paid</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Total Refunded</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalRefunded)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Available for Refund</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(availableForRefund)}
            </div>
          </div>
        </div>
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
            Payment Records ({order.paymentRecords.length})
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
                          {getPaymentMethodIcon(payment.paymentMethod)}
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
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      {payment.refundAmount && (
                        <div className="text-sm text-blue-600">
                          Refunded: {formatCurrency(payment.refundAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(payment.paymentStatus)}`}>
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatUTCForDisplay(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {payment.paymentStatus === 'PAID' && availableForRefund > 0 && (
                        <button
                          onClick={() => handleRefundClick(payment.id, payment.amount)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Refund
                        </button>
                      )}
                      {['REFUNDED', 'PARTIAL_REFUND'].includes(payment.paymentStatus) && (
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
    </div>
  );
};

export default PaymentTab; 