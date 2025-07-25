'use client';

import { CustomerLayout } from '@/customer/components/CustomerLayout';
import DashboardContent from '../dashboard/DashboardContent';
import { useProfileStore } from '@/customer';
import CustomerNavigation from '@/components/CustomerNavigation';
import { useEffect } from 'react';

export default function CustomerOrdersPage() {
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <CustomerNavigation
        currentPage="orders"
        title="My Orders"
        subtitle="Track your laundry orders and their status"
        icon="📦"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardContent />
      </div>
    </div>
  );
} 