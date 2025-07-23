"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AdminUser, UserRole } from "@/types/global";
import PageTransition from "@/components/ui/PageTransition";

interface DashboardStats {
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  activeStaff: number;
  pendingOrders: number;
  completedOrders: number;
  activeDrivers: number;
}

// Memoized Stats Card Component
const StatsCard = memo(({ 
  title, 
  value, 
  icon, 
  bgColor, 
  isLoading 
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  isLoading: boolean;
}) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 ${bgColor} rounded-md flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
              ) : (
                value
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
));

StatsCard.displayName = 'StatsCard';

// Memoized Quick Action Button Component
const QuickActionButton = memo(({ 
  title, 
  onClick, 
  bgColor,
  isLoading = false
}: {
  title: string;
  onClick: () => void;
  bgColor: string;
  isLoading?: boolean;
}) => (
  <button 
    onClick={onClick}
    disabled={isLoading}
    className={`${bgColor} text-white px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 flex items-center justify-center space-x-2 ${
      isLoading ? 'opacity-75 cursor-not-allowed' : ''
    }`}
  >
    {isLoading && (
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    )}
    <span>{isLoading ? 'Loading...' : title}</span>
  </button>
));

QuickActionButton.displayName = 'QuickActionButton';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Memoized fetch stats function
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/super-admin-stats');
      if (response.ok) {
        const data: DashboardStats = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Memoized logout handler
  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/admin/login" });
  }, []);

  // Memoized navigation handlers


  const [isNavigating, setIsNavigating] = useState(false);
  const [isNavigatingToOrders, setIsNavigatingToOrders] = useState(false);
  const [isNavigatingToStaff, setIsNavigatingToStaff] = useState(false);

  const handleManageCustomers = useCallback(() => {
    setIsNavigating(true);
    router.push('/admin/super-admin/customers');
  }, [router]);

  const handleManageOrders = useCallback(() => {
    setIsNavigatingToOrders(true);
    router.push('/admin/orders');
  }, [router]);

  const handleManageStaff = useCallback(() => {
    setIsNavigatingToStaff(true);
    router.push('/admin/super-admin/staff');
  }, [router]);

  const handleNavigateToReports = () => {
    router.push('/admin/super-admin/reports');
  };

  const handleNavigateToServicePricing = () => {
    router.push('/admin/super-admin/service-pricing');
  };

  useEffect(() => {
    if (status === "loading") {
      return; // Still loading
    }

    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    if (session?.userType !== "admin" || session?.role !== "SUPER_ADMIN") {
      router.push("/admin/login");
      return;
    }

    // Create admin user object from session
    const user: AdminUser = {
      id: session.adminId || 0,
      email: session.user?.email || "",
      firstName: session.user?.name?.split(" ")[0] || "",
      lastName: session.user?.name?.split(" ").slice(1).join(" ") || "",
      role: session.role as UserRole,
      isActive: session.isActive || false,
      lastLoginAt: undefined // This would need to be fetched separately if needed
    };

    setAdminUser(user);
    setLoading(false);
  }, [session, status, router]);

  useEffect(() => {
    if (!loading && adminUser) {
      fetchStats();
    }
  }, [loading, adminUser, fetchStats]);

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
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Orders"
              value={stats?.totalOrders.toLocaleString() || '0'}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              bgColor="bg-blue-500"
              isLoading={statsLoading}
            />

            <StatsCard
              title="Total Customers"
              value={stats?.totalCustomers.toLocaleString() || '0'}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              bgColor="bg-green-500"
              isLoading={statsLoading}
            />

            <StatsCard
              title="Total Revenue"
              value={`$${stats?.totalRevenue.toLocaleString() || '0'}`}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
              bgColor="bg-yellow-500"
              isLoading={statsLoading}
            />

            <StatsCard
              title="Active Staff"
              value={stats?.activeStaff.toLocaleString() || '0'}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              bgColor="bg-purple-500"
              isLoading={statsLoading}
            />
          </div>

          {/* Additional Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Pending Orders"
              value={stats?.pendingOrders.toLocaleString() || '0'}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              bgColor="bg-orange-500"
              isLoading={statsLoading}
            />

            <StatsCard
              title="Completed Orders"
              value={stats?.completedOrders.toLocaleString() || '0'}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              bgColor="bg-green-600"
              isLoading={statsLoading}
            />

            <StatsCard
              title="Active Drivers"
              value={stats?.activeDrivers.toLocaleString() || '0'}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              bgColor="bg-indigo-500"
              isLoading={statsLoading}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionButton
                title="Manage Orders"
                onClick={handleManageOrders}
                bgColor="bg-blue-600"
                isLoading={isNavigatingToOrders}
              />
              <QuickActionButton
                title="Manage Customers"
                onClick={handleManageCustomers}
                bgColor="bg-green-600"
                isLoading={isNavigating}
              />
              <QuickActionButton
                title="Manage Staff"
                onClick={handleManageStaff}
                bgColor="bg-purple-600"
                isLoading={isNavigatingToStaff}
              />
              <QuickActionButton
                title="View Reports"
                onClick={handleNavigateToReports}
                bgColor="bg-yellow-600"
              />
              <QuickActionButton
                title="Manage Service & Pricing"
                onClick={handleNavigateToServicePricing}
                bgColor="bg-indigo-600"
              />
            </div>
          </div>
        </div>
      </main>
      </div>
    </PageTransition>
  );
} 