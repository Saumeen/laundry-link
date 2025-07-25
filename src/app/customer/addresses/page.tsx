'use client';

import { useProfileStore } from '@/customer';
import { useEffect } from 'react';
import CustomerNavigation from '@/components/CustomerNavigation';
import AddressManagement from '@/components/AddressManagement';

export default function CustomerAddressesPage() {
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <CustomerNavigation
        currentPage="addresses"
        title="My Addresses"
        subtitle={`Welcome back, ${profile?.firstName} ${profile?.lastName}`}
        icon="📍"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AddressManagement />
      </div>
    </div>
  );
} 