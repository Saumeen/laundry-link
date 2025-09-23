'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSuperAdminAuth } from '@/admin/hooks/useAdminAuth';
import PageTransition from '@/components/ui/PageTransition';
import { LandingPageManager } from '@/admin/components/LandingPageManager';

export default function LandingPageManagement() {
  const router = useRouter();
  const { user, isLoading, isAuthorized } = useSuperAdminAuth();

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </PageTransition>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect to login
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span>Back</span>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Landing Page Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your landing page content and testimonials
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Welcome back, {user?.firstName} {user?.lastName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LandingPageManager />
        </div>
      </div>
    </PageTransition>
  );
}
