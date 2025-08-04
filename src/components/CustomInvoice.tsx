'use client';

import { useState } from 'react';
import { OrderStatus } from '@prisma/client';
import { useAuth } from '@/hooks/useAuth';
import { useWalletStore } from '@/customer/stores/walletStore';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import TopUpAndPayModal from './TopUpAndPayModal';

interface CustomInvoiceProps {
  order: {
    id: number;
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: string;
    invoiceTotal: number;
    invoiceGenerated: boolean;
    customer?: any;
    items?: any[];
    invoiceItems?: any[];
    createdAt: string;
    pickupAddress?: any;
    deliveryAddress?: any;
  };
  onPayNow?: () => void;
}

export default function CustomInvoice({ order, onPayNow }: CustomInvoiceProps) {
  const { customer } = useAuth();
  const { balance } = useWalletStore();
  const [showTopUpAndPayModal, setShowTopUpAndPayModal] = useState(false);

  const canPayWithWallet = balance >= order.invoiceTotal;
  const isAlreadyPaid = order.paymentStatus === 'PAID';
  const paymentRequired = order.invoiceGenerated && order.invoiceTotal > 0 && !isAlreadyPaid;

  const getPaymentInstructions = () => {
    if (isAlreadyPaid) {
      return 'Payment has already been completed for this order.';
    }
    if (!order.invoiceGenerated) {
      return 'Invoice has not been generated yet. Payment will be available once the invoice is ready.';
    }
    if (!paymentRequired) {
      return 'No payment required for this order.';
    }
    if (canPayWithWallet) {
      return 'Pay using your wallet balance. Payment will be deducted from your wallet.';
    }
    return 'Your wallet balance is insufficient. Click "Top Up & Pay" to add funds to your wallet and complete the payment.';
  };

  const getPaymentButtonText = () => {
    if (isAlreadyPaid) {
      return 'Payment Completed';
    }
    if (!order.invoiceGenerated) {
      return 'Invoice Pending';
    }
    if (!paymentRequired) {
      return 'No Payment Required';
    }
    if (canPayWithWallet) {
      return `Pay ${formatCurrency(order.invoiceTotal)} from Wallet`;
    }
    return 'Top Up & Pay';
  };

  const handlePayNow = () => {
    if (paymentRequired) {
      setShowTopUpAndPayModal(true);
    }
  };

  const handlePaymentComplete = () => {
    // Refresh wallet balance and close modal
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Invoice Status Notice */}
      {!paymentRequired && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-gray-600 mr-2">📋</span>
            <h3 className="text-sm font-semibold text-gray-900">Invoice Pending</h3>
          </div>
          <p className="text-sm text-gray-700 mt-1">
            Invoice has not been generated yet. Payment options will be available once the invoice is ready.
          </p>
        </div>
      )}

      {/* Invoice Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
          <p className="text-gray-600">Order #{order.orderNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Date</p>
          <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Customer Information */}
      {order.customer && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-medium">{order.customer.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone</p>
              <p className="font-medium">{order.customer.phone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Information */}
      {paymentRequired && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Wallet Balance</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-900">{formatCurrency(balance)}</span>
            <span className="text-sm text-blue-600">Available Balance</span>
          </div>
          {!canPayWithWallet && (
            <p className="text-sm text-blue-700 mt-2">
              Insufficient balance. Top up your wallet to proceed with payment.
            </p>
          )}
        </div>
      )}

      {/* Invoice Items */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Quantity</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Price/Item</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Use invoiceItems if available, otherwise fall back to items */}
              {(order.invoiceItems || order.items || []).map((item: any, index: number) => {
                // Handle the correct data structure
                const itemName = item.serviceName || item.itemName || item.name || 'Item';
                const quantity = item.quantity || 1;
                const pricePerItem = item.unitPrice || item.pricePerItem || item.price || 0;
                const total = item.totalPrice || (pricePerItem * quantity);
                const notes = item.notes;

                return (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{itemName}</div>
                        {notes && (
                          <div className="text-xs text-gray-500 italic">"{notes}"</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(pricePerItem)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                );
              })}
              {(!order.invoiceItems && !order.items) && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm text-gray-500 text-center">
                    No items available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Total Amount</span>
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(order.invoiceTotal)}</span>
        </div>
      </div>

      {/* Payment Instructions */}
      {(paymentRequired || isAlreadyPaid) && (
        <div className={`mb-6 p-4 border rounded-lg ${
          isAlreadyPaid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            isAlreadyPaid ? 'text-green-900' : 'text-yellow-900'
          }`}>
            {isAlreadyPaid ? 'Payment Status' : 'Payment Instructions'}
          </h3>
          <p className={`text-sm ${
            isAlreadyPaid ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {getPaymentInstructions()}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handlePayNow}
          disabled={!paymentRequired}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
            !paymentRequired || isAlreadyPaid
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : canPayWithWallet
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {getPaymentButtonText()}
        </button>
      </div>

      {/* Top Up and Pay Modal */}
      <TopUpAndPayModal
        isOpen={showTopUpAndPayModal}
        onClose={() => setShowTopUpAndPayModal(false)}
        orderNumber={order.orderNumber}
        orderId={order.id}
        amount={order.invoiceTotal}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
} 