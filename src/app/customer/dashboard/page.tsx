'use client';

import { CustomerDashboard } from '@/customer/components/CustomerDashboard';
import CustomerNavigation from '@/components/CustomerNavigation';
import { useProfileStore } from '@/customer';
import { useEffect } from 'react';

export default function CustomerDashboardPage() {
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      <CustomerNavigation
        currentPage='dashboard'
        
        subtitle={`Welcome back, ${profile?.firstName} ${profile?.lastName}`}
        
      />

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <CustomerDashboard />
      </div>
    </div>
  );
}
