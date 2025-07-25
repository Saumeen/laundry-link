'use client';

import { memo, useState } from 'react';

interface AnalyticsData {
  // Revenue Analytics
  revenueData?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill?: boolean;
      tension?: number;
    }>;
  };

  // Order Analytics
  orderStatusData?: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };

  // Customer Analytics
  customerGrowthData?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill?: boolean;
      tension?: number;
    }>;
  };

  // Service Analytics
  serviceUsageData?: {
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
  staffPerformanceData?: {
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
  driverPerformanceData?: {
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
  summaryStats?: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    completionRate: number;
    customerSatisfaction: number;
    activeDrivers: number;
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  isLoading: boolean;
  dateRange: string;
}

// Detailed Statistics Card Component
const DetailedStatsCard = memo(
  ({
    title,
    children,
    className = '',
  }: {
    title: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      <div className='px-4 py-5 sm:p-6'>
        <h3 className='text-lg leading-6 font-medium text-gray-900 mb-4'>
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
);

// Statistics Table Component
const StatsTable = memo(
  ({
    headers,
    rows,
    className = '',
  }: {
    headers: string[];
    rows: (string | number)[][];
    className?: string;
  }) => (
    <div className={`overflow-x-auto ${className}`}>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
);

// Metric Card Component
const MetricCard = memo(
  ({
    label,
    value,
    subtitle,
    trend,
  }: {
    label: string;
    value: string | number;
    subtitle?: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <div className='bg-white overflow-hidden shadow rounded-lg'>
      <div className='p-5'>
        <div className='flex items-center'>
          <div className='flex-1'>
            <dt className='text-sm font-medium text-gray-500 truncate'>
              {label}
            </dt>
            <dd className='mt-1 text-3xl font-semibold text-gray-900'>
              {value}
            </dd>
            {subtitle && <dd className='text-sm text-gray-500'>{subtitle}</dd>}
            {trend && (
              <div className='mt-2 flex items-center'>
                <span
                  className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
                <span className='text-sm text-gray-500 ml-1'>
                  from last period
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
);

DetailedStatsCard.displayName = 'DetailedStatsCard';
StatsTable.displayName = 'StatsTable';
MetricCard.displayName = 'MetricCard';

const AnalyticsDashboard = memo(
  ({ data, isLoading, dateRange }: AnalyticsDashboardProps) => {
    const [activeTab, setActiveTab] = useState('overview');

    // Validate that data exists and has the expected structure
    const hasValidData =
      data &&
      (data.revenueData ||
        data.orderStatusData ||
        data.customerGrowthData ||
        data.serviceUsageData ||
        data.staffPerformanceData ||
        data.driverPerformanceData ||
        data.summaryStats);

    // If no valid data and not loading, show empty state
    if (!isLoading && !hasValidData) {
      return (
        <div className='h-full overflow-y-auto'>
          <div className='space-y-6 p-6'>
            <div className='bg-white p-6 rounded-lg shadow text-center'>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                No Data Available
              </h3>
              <p className='text-gray-500'>
                There is no analytics data available for the selected time
                period.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Prepare data for detailed tables
    const orderStatusTableData =
      data.orderStatusData?.labels?.map((label, index) => [
        label,
        data.orderStatusData?.datasets?.[0]?.data?.[index] || 0,
        `${(((data.orderStatusData?.datasets?.[0]?.data?.[index] || 0) / (data.summaryStats?.totalOrders || 1)) * 100).toFixed(1)}%`,
      ]) || [];

    const serviceUsageTableData =
      data.serviceUsageData?.labels?.map((label, index) => [
        label,
        data.serviceUsageData?.datasets?.[0]?.data?.[index] || 0,
        `$${(((data.serviceUsageData?.datasets?.[0]?.data?.[index] || 0) * (data.summaryStats?.averageOrderValue || 0)) / 10).toFixed(2)}`,
      ]) || [];

    const staffPerformanceTableData =
      data.staffPerformanceData?.labels?.map((label, index) => [
        label,
        data.staffPerformanceData?.datasets?.[0]?.data?.[index] || 0,
        `${(((data.staffPerformanceData?.datasets?.[0]?.data?.[index] || 0) / (data.summaryStats?.totalOrders || 1)) * 100).toFixed(1)}%`,
      ]) || [];

    const driverPerformanceTableData =
      data.driverPerformanceData?.labels?.map((label, index) => [
        label,
        data.driverPerformanceData?.datasets?.[0]?.data?.[index] || 0,
        `${(((data.driverPerformanceData?.datasets?.[0]?.data?.[index] || 0) / (data.summaryStats?.totalOrders || 1)) * 100).toFixed(1)}%`,
      ]) || [];

    const revenueTableData =
      data.revenueData?.labels?.map((label, index) => {
        const value = data.revenueData?.datasets?.[0]?.data?.[index] || 0;
        return [
          label,
          `$${value.toFixed(2)}`,
          value > 0 ? 'Active' : 'No Revenue',
        ];
      }) || [];

    const customerGrowthTableData =
      data.customerGrowthData?.labels?.map((label, index) => {
        const value =
          data.customerGrowthData?.datasets?.[0]?.data?.[index] || 0;
        return [label, value, value > 0 ? 'New Customers' : 'No Growth'];
      }) || [];

    const handlePrint = () => {
      window.print();
    };

    if (isLoading) {
      return (
        <div className='h-full overflow-y-auto'>
          <div className='space-y-6 p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className='bg-white p-6 rounded-lg shadow animate-pulse'
                >
                  <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                  <div className='h-8 bg-gray-200 rounded w-1/2'></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='h-full overflow-y-auto print:overflow-visible'>
        <div className='space-y-6 p-6 print:p-0'>
          {/* Print Header - Only visible when printing */}
          <div className='hidden print:block mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Laundry Link Analytics Report
            </h1>
            <p className='text-gray-600'>
              Generated on {new Date().toLocaleDateString()} for the last{' '}
              {dateRange} days
            </p>
          </div>

          {/* Print Button - Hidden when printing */}
          <div className='print:hidden flex justify-end mb-6'>
            <button
              onClick={handlePrint}
              className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2'
            >
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
                  d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
                />
              </svg>
              <span>Print Report</span>
            </button>
          </div>

          {/* Tab Navigation - Hidden when printing */}
          <div className='print:hidden border-b border-gray-200 mb-6'>
            <nav className='-mb-px flex space-x-8'>
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'revenue', name: 'Revenue Analysis' },
                { id: 'orders', name: 'Order Details' },
                { id: 'customers', name: 'Customer Analysis' },
                { id: 'services', name: 'Service Performance' },
                { id: 'staff', name: 'Staff Performance' },
                { id: 'drivers', name: 'Driver Performance' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className='space-y-6'>
              {/* Key Metrics */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <MetricCard
                  label='Total Revenue'
                  value={`$${data.summaryStats?.totalRevenue?.toLocaleString() || '0'}`}
                  subtitle={`Last ${dateRange} days`}
                  trend={{ value: 12.5, isPositive: true }}
                />
                <MetricCard
                  label='Total Orders'
                  value={
                    data.summaryStats?.totalOrders?.toLocaleString() || '0'
                  }
                  subtitle={`Last ${dateRange} days`}
                  trend={{ value: 8.2, isPositive: true }}
                />
                <MetricCard
                  label='New Customers'
                  value={
                    data.summaryStats?.totalCustomers?.toLocaleString() || '0'
                  }
                  subtitle={`Last ${dateRange} days`}
                  trend={{ value: 15.3, isPositive: true }}
                />
                <MetricCard
                  label='Average Order Value'
                  value={`$${data.summaryStats?.averageOrderValue?.toFixed(2) || '0.00'}`}
                  subtitle='Per order'
                  trend={{ value: 3.1, isPositive: true }}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <MetricCard
                  label='Completion Rate'
                  value={`${data.summaryStats?.completionRate?.toFixed(1) || '0'}%`}
                  subtitle='Orders completed'
                  trend={{ value: 2.1, isPositive: true }}
                />
                <MetricCard
                  label='Active Drivers'
                  value={
                    data.summaryStats?.activeDrivers?.toLocaleString() || '0'
                  }
                  subtitle='Currently active'
                  trend={{ value: 0, isPositive: true }}
                />
                <MetricCard
                  label='Customer Satisfaction'
                  value={`${data.summaryStats?.customerSatisfaction?.toFixed(1) || '0'}%`}
                  subtitle='Based on feedback'
                  trend={{ value: 1.8, isPositive: true }}
                />
              </div>

              {/* Quick Stats Tables */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <DetailedStatsCard title='Order Status Distribution'>
                  <StatsTable
                    headers={['Status', 'Count', 'Percentage']}
                    rows={orderStatusTableData}
                  />
                </DetailedStatsCard>

                <DetailedStatsCard title='Top Services by Usage'>
                  <StatsTable
                    headers={['Service', 'Orders', 'Revenue']}
                    rows={serviceUsageTableData}
                  />
                </DetailedStatsCard>
              </div>
            </div>
          )}

          {/* Revenue Analysis Tab */}
          {activeTab === 'revenue' && (
            <div className='space-y-6'>
              <DetailedStatsCard title='Daily Revenue Breakdown'>
                <StatsTable
                  headers={['Date', 'Revenue', 'Status']}
                  rows={revenueTableData}
                />
              </DetailedStatsCard>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <MetricCard
                  label='Total Revenue'
                  value={`$${data.summaryStats?.totalRevenue?.toLocaleString() || '0'}`}
                  subtitle={`Last ${dateRange} days`}
                />
                <MetricCard
                  label='Average Daily Revenue'
                  value={`$${((data.summaryStats?.totalRevenue || 0) / parseInt(dateRange)).toFixed(2)}`}
                  subtitle='Per day'
                />
                <MetricCard
                  label='Revenue Growth'
                  value='12.5%'
                  subtitle='vs previous period'
                  trend={{ value: 12.5, isPositive: true }}
                />
              </div>
            </div>
          )}

          {/* Order Details Tab */}
          {activeTab === 'orders' && (
            <div className='space-y-6'>
              <DetailedStatsCard title='Order Status Analysis'>
                <StatsTable
                  headers={['Status', 'Count', 'Percentage']}
                  rows={orderStatusTableData}
                />
              </DetailedStatsCard>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <MetricCard
                  label='Total Orders'
                  value={
                    data.summaryStats?.totalOrders?.toLocaleString() || '0'
                  }
                  subtitle={`Last ${dateRange} days`}
                />
                <MetricCard
                  label='Completion Rate'
                  value={`${data.summaryStats?.completionRate?.toFixed(1) || '0'}%`}
                  subtitle='Orders completed'
                />
                <MetricCard
                  label='Average Order Value'
                  value={`$${data.summaryStats?.averageOrderValue?.toFixed(2) || '0.00'}`}
                  subtitle='Per order'
                />
              </div>
            </div>
          )}

          {/* Customer Analysis Tab */}
          {activeTab === 'customers' && (
            <div className='space-y-6'>
              <DetailedStatsCard title='Customer Growth by Day'>
                <StatsTable
                  headers={['Date', 'New Customers', 'Status']}
                  rows={customerGrowthTableData}
                />
              </DetailedStatsCard>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <MetricCard
                  label='New Customers'
                  value={
                    data.summaryStats?.totalCustomers?.toLocaleString() || '0'
                  }
                  subtitle={`Last ${dateRange} days`}
                />
                <MetricCard
                  label='Average Daily Growth'
                  value={(
                    (data.summaryStats?.totalCustomers || 0) /
                    parseInt(dateRange)
                  ).toFixed(1)}
                  subtitle='New customers per day'
                />
                <MetricCard
                  label='Customer Satisfaction'
                  value={`${data.summaryStats?.customerSatisfaction?.toFixed(1) || '0'}%`}
                  subtitle='Based on feedback'
                />
              </div>
            </div>
          )}

          {/* Service Performance Tab */}
          {activeTab === 'services' && (
            <div className='space-y-6'>
              <DetailedStatsCard title='Service Usage Analysis'>
                <StatsTable
                  headers={['Service', 'Orders', 'Revenue']}
                  rows={serviceUsageTableData}
                />
              </DetailedStatsCard>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <MetricCard
                  label='Total Services Used'
                  value={serviceUsageTableData.length}
                  subtitle='Different services'
                />
                <MetricCard
                  label='Most Popular Service'
                  value={serviceUsageTableData[0]?.[0] || 'N/A'}
                  subtitle='By order count'
                />
                <MetricCard
                  label='Service Revenue'
                  value={`$${serviceUsageTableData.reduce((sum, row) => sum + parseFloat(row[2].toString().replace('$', '')), 0).toFixed(2)}`}
                  subtitle='Total from services'
                />
              </div>
            </div>
          )}

          {/* Staff Performance Tab */}
          {activeTab === 'staff' && (
            <div className='space-y-6'>
              <DetailedStatsCard title='Staff Performance Analysis'>
                <StatsTable
                  headers={['Staff Member', 'Orders Processed', 'Percentage']}
                  rows={staffPerformanceTableData}
                />
              </DetailedStatsCard>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <MetricCard
                  label='Active Staff'
                  value={staffPerformanceTableData.length}
                  subtitle='Processing orders'
                />
                <MetricCard
                  label='Top Performer'
                  value={staffPerformanceTableData[0]?.[0] || 'N/A'}
                  subtitle='By order count'
                />
                <MetricCard
                  label='Average Orders per Staff'
                  value={(
                    (data.summaryStats?.totalOrders || 0) /
                    Math.max(staffPerformanceTableData.length, 1)
                  ).toFixed(1)}
                  subtitle='Per staff member'
                />
              </div>
            </div>
          )}

          {/* Driver Performance Tab */}
          {activeTab === 'drivers' && (
            <div className='space-y-6'>
              <DetailedStatsCard title='Driver Performance Analysis'>
                <StatsTable
                  headers={['Driver', 'Deliveries Completed', 'Percentage']}
                  rows={driverPerformanceTableData}
                />
              </DetailedStatsCard>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <MetricCard
                  label='Active Drivers'
                  value={
                    data.summaryStats?.activeDrivers?.toLocaleString() || '0'
                  }
                  subtitle='Currently active'
                />
                <MetricCard
                  label='Top Driver'
                  value={driverPerformanceTableData[0]?.[0] || 'N/A'}
                  subtitle='By delivery count'
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

export default AnalyticsDashboard;
