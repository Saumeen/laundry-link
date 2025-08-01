'use client';

import { useState, useEffect } from 'react';
import { useSuperAdminAuth } from '@/admin/hooks/useAdminAuth';
import PageTransition from '@/components/ui/PageTransition';
import { ConfigurationManager } from '@/admin';

export default function ConfigurationsPage() {
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Configuration Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage application configurations and settings
                </p>
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
          <ConfigurationManager />
        </div>
      </div>
    </PageTransition>
  );
} 