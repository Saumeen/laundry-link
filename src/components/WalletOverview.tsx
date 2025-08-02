'use client';

import { useEffect } from 'react';
import { useWalletStore, useProfileStore } from '@/customer';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface WalletOverviewProps {
  showQuickActions?: boolean;
}

export default function WalletOverview({ showQuickActions = true }: WalletOverviewProps) {
  const { profile } = useProfileStore();
  const { balance, transactions, loading, fetchWalletInfo } = useWalletStore();

  useEffect(() => {
    if (profile?.id) {
      fetchWalletInfo(profile.id);
    }
  }, [profile?.id, fetchWalletInfo]);

  const recentTransactions = transactions.slice(0, 3);
  const totalDeposits = transactions
    .filter(t => t.transactionType === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return '💰';
      case 'WITHDRAWAL':
        return '💸';
      case 'PAYMENT':
        return '💳';
      case 'REFUND':
        return '↩️';
      case 'ADJUSTMENT':
        return '⚖️';
      case 'TRANSFER':
        return '🔄';
      default:
        return '📊';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'REFUND':
        return 'text-green-600';
      case 'WITHDRAWAL':
      case 'PAYMENT':
        return 'text-red-600';
      case 'ADJUSTMENT':
      case 'TRANSFER':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Wallet</h2>
              <p className="text-sm text-gray-600">Manage your balance</p>
            </div>
          </div>
          <Link
            href="/customer/wallet"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Details
          </Link>
        </div>
      </div>

      {/* Balance Section */}
      <div className="px-6 py-4">
        <div className="bg-green-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Current Balance</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(balance, 'BHD')}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Deposits</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalDeposits, 'BHD')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Transactions</p>
            <p className="text-lg font-semibold text-gray-900">
              {transactions.length}
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm">{getTransactionIcon(transaction.transactionType)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${getTransactionColor(transaction.transactionType)}`}>
                      {transaction.transactionType === 'WITHDRAWAL' || transaction.transactionType === 'PAYMENT' ? '-' : '+'}
                      {formatCurrency(transaction.amount, 'BHD')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {showQuickActions && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 gap-3">
              <Link
                href="/customer/wallet"
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <span className="mr-2">💰</span>
                Top Up Wallet
              </Link>
              <Link
                href="/customer/wallet"
                className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <span className="mr-2">📊</span>
                View All Transactions
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 