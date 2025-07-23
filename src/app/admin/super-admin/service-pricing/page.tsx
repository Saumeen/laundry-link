"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AdminUser, UserRole } from "@/types/global";
import PageTransition from "@/components/ui/PageTransition";
import ServiceManagement from "@/components/admin/ServiceManagement";
import PricingCategoryManagement from "@/components/admin/PricingCategoryManagement";
import PricingItemManagement from "@/components/admin/PricingItemManagement";
import ServicePricingMappingManagement from "@/components/admin/ServicePricingMappingManagement";

type TabType = 'services' | 'pricing-categories' | 'pricing-items' | 'service-pricing-mappings';

export default function ServicePricingManagement() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('services');

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    if (session?.userType !== "admin" || session?.role !== "SUPER_ADMIN") {
      router.push("/admin/login");
      return;
    }

    const user: AdminUser = {
      id: session.adminId || 0,
      email: session.user?.email || "",
      firstName: session.user?.name?.split(" ")[0] || "",
      lastName: session.user?.name?.split(" ").slice(1).join(" ") || "",
      role: session.role as UserRole,
      isActive: session.isActive || false,
      lastLoginAt: undefined
    };

    setAdminUser(user);
    setLoading(false);
  }, [session, status, router]);

  const handleLogout = useCallback(() => {
    router.push("/admin/login");
  }, [router]);

  const tabs = [
    { id: 'services', name: 'Services', icon: '🛠️' },
    { id: 'pricing-categories', name: 'Pricing Categories', icon: '📂' },
    { id: 'pricing-items', name: 'Pricing Items', icon: '💰' },
    { id: 'service-pricing-mappings', name: 'Service-Pricing Mappings', icon: '🔗' }
  ];

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/admin/super-admin')}
                  className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Service & Pricing Management</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {adminUser.firstName} {adminUser.lastName}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white shadow rounded-lg">
              {activeTab === 'services' && <ServiceManagement />}
              {activeTab === 'pricing-categories' && <PricingCategoryManagement />}
              {activeTab === 'pricing-items' && <PricingItemManagement />}
              {activeTab === 'service-pricing-mappings' && <ServicePricingMappingManagement />}
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
} 