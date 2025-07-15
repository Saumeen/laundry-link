'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardContent from '@/app/customer/dashboard/DashboardContent';

export default function DashboardWithSearchParams() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    }>
      <DashboardWithSearchParamsInner />
    </Suspense>
  );
}

function DashboardWithSearchParamsInner() {
  const searchParams = useSearchParams();
  return <DashboardContent searchParams={searchParams} />;
} 