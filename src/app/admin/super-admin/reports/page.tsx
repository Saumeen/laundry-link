'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { AdminUser, UserRole } from '@/types/global';
import PageTransition from '@/components/ui/PageTransition';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';

interface ReportData {
  // Revenue Analytics
  revenueData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill?: boolean;
    }>;
  };

  // Order Analytics
  orderStatusData: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };

  // Customer Analytics
  customerGrowthData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill?: boolean;
    }>;
  };

  // Service Analytics
  serviceUsageData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }>;
  };

  // Staff Performance
  staffPerformanceData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }>;
  };

  // Driver Performance
  driverPerformanceData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }>;
  };

  // Summary Stats
  summaryStats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    completionRate: number;
    customerSatisfaction: number;
    activeDrivers: number;
    averageDeliveryTime: number;
  };
}

// Export Button Component
const ExportButton = memo(
  ({
    onClick,
    isLoading = false,
  }: {
    onClick: () => void;
    isLoading?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2 ${
        isLoading ? 'opacity-75 cursor-not-allowed' : ''
      }`}
    >
      {isLoading ? (
        <svg
          className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          ></circle>
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          ></path>
        </svg>
      ) : (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
      )}
      <span>{isLoading ? 'Exporting...' : 'Export Report'}</span>
    </button>
  )
);

ExportButton.displayName = 'ExportButton';

export default function ReportsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // days
  const [exportFormat, setExportFormat] = useState('csv'); // csv or json

  // Memoized fetch reports function
  const fetchReports = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await fetch(
        `/api/admin/super-admin/reports?range=${dateRange}`
      );
      if (response.ok) {
        const data: ReportData = await response.json();
        // Validate the data structure before setting it
        if (data && typeof data === 'object') {
          setReportData(data);
        } else {
          // Handle invalid data structure
          setReportData(null);
        }
      } else {
        // Handle failed request
        setReportData(null);
      }
    } catch {
      setReportData(null);
    } finally {
      setDataLoading(false);
    }
  }, [dateRange]);

  // Memoized logout handler
  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: '/admin/login' });
  }, []);

  // Memoized navigation handler
  const handleBackToDashboard = useCallback(() => {
    router.push('/admin/super-admin');
  }, [router]);

  // Export report function
  const handleExportReport = useCallback(async () => {
    try {
      setExportLoading(true);
      const response = await fetch(
        `/api/admin/super-admin/reports/export?range=${dateRange}&format=${exportFormat}`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extension = exportFormat === 'csv' ? 'csv' : 'json';
        a.download = `laundry-analytics-${dateRange}days-${new Date().toISOString().split('T')[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle export failure
        console.error('Export failed:', response.statusText);
      }
    } catch {
      console.error('Export error');
    } finally {
      setExportLoading(false);
    }
  }, [dateRange, exportFormat]);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (session?.userType !== 'admin' || session?.role !== 'SUPER_ADMIN') {
      router.push('/admin/login');
      return;
    }

    const user: AdminUser = {
      id: session.adminId || 0,
      email: session.user?.email || '',
      firstName: session.user?.name?.split(' ')[0] || '',
      lastName: session.user?.name?.split(' ').slice(1).join(' ') || '',
      role: session.role as UserRole,
      isActive: session.isActive || false,
      lastLoginAt: undefined,
    };

    setAdminUser(user);
    setLoading(false);
  }, [session, status, router]);

  useEffect(() => {
    if (!loading && adminUser) {
      fetchReports();
    }
  }, [loading, adminUser, fetchReports]);

  if (loading || status === 'loading') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <PageTransition>
      <div className='min-h-screen bg-gray-100'>
        {/* Header */}
        <header className='bg-white shadow-sm border-b'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center h-16'>
              <div className='flex items-center space-x-4'>
                <button
                  onClick={handleBackToDashboard}
                  className='text-gray-600 hover:text-gray-900'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                </button>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Analytics & Reports
                </h1>
              </div>
              <div className='flex items-center space-x-4'>
                <select
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                  className='border border-gray-300 rounded-md px-3 py-2 text-sm'
                >
                  <option value='7'>Last 7 days</option>
                  <option value='30'>Last 30 days</option>
                  <option value='90'>Last 90 days</option>
                  <option value='365'>Last year</option>
                </select>
                <select
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value)}
                  className='border border-gray-300 rounded-md px-3 py-2 text-sm'
                >
                  <option value='csv'>CSV Export</option>
                  <option value='json'>JSON Export</option>
                </select>
                <ExportButton
                  onClick={handleExportReport}
                  isLoading={exportLoading}
                />
                <span className='text-sm text-gray-600'>
                  Welcome, {adminUser.firstName} {adminUser.lastName}
                </span>
                <button
                  onClick={handleLogout}
                  className='bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700'
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='px-4 py-6 sm:px-0'>
            <AnalyticsDashboard
              key={`dashboard-${dateRange}`}
              data={reportData || {}}
              isLoading={dataLoading}
              dateRange={dateRange}
            />
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
