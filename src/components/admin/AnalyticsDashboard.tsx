"use client";

import { memo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
    averageDeliveryTime: number;
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  isLoading: boolean;
  dateRange: string;
}

// Memoized Chart Components
const RevenueChart = memo(({ data, isLoading }: { data: any; isLoading: boolean }) => {
  // Validate data structure
  const isValidData = data && 
    data.labels && 
    Array.isArray(data.labels) && 
    data.datasets && 
    Array.isArray(data.datasets) && 
    data.datasets.length > 0 &&
    data.datasets[0].data &&
    Array.isArray(data.datasets[0].data);

  return (
    <div className="bg-white p-4 rounded-lg shadow h-80">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Revenue Trends</h3>
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>
        </div>
      ) : isValidData ? (
        <div className="h-48">
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 750,
                easing: 'easeInOutQuart'
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                  display: true,
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return '$' + value.toLocaleString();
                    }
                  }
                },
                x: {
                  ticks: {
                    maxTicksLimit: 10
                  }
                }
              },
              interaction: {
                intersect: false,
                mode: 'index' as const,
              }
            }}
          />
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
});

const OrderStatusChart = memo(({ data, isLoading }: { data: any; isLoading: boolean }) => {
  // Validate data structure
  const isValidData = data && 
    data.labels && 
    Array.isArray(data.labels) && 
    data.datasets && 
    Array.isArray(data.datasets) && 
    data.datasets.length > 0 &&
    data.datasets[0].data &&
    Array.isArray(data.datasets[0].data);

  return (
    <div className="bg-white p-4 rounded-lg shadow h-80">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Status Distribution</h3>
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>
        </div>
      ) : isValidData ? (
        <div className="h-48">
          <Doughnut
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom' as const,
                },
              },
            }}
          />
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
});

const CustomerGrowthChart = memo(({ data, isLoading }: { data: any; isLoading: boolean }) => {
  // Validate data structure
  const isValidData = data && 
    data.labels && 
    Array.isArray(data.labels) && 
    data.datasets && 
    Array.isArray(data.datasets) && 
    data.datasets.length > 0 &&
    data.datasets[0].data &&
    Array.isArray(data.datasets[0].data);

  return (
    <div className="bg-white p-4 rounded-lg shadow h-80">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Growth</h3>
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>
        </div>
      ) : isValidData ? (
        <div className="h-48">
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 750,
                easing: 'easeInOutQuart'
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                  display: true,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
                x: {
                  ticks: {
                    maxTicksLimit: 10
                  }
                }
              },
              interaction: {
                intersect: false,
                mode: 'index' as const,
              }
            }}
          />
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
});

const ServiceUsageChart = memo(({ data, isLoading }: { data: any; isLoading: boolean }) => {
  // Validate data structure
  const isValidData = data && 
    data.labels && 
    Array.isArray(data.labels) && 
    data.datasets && 
    Array.isArray(data.datasets) && 
    data.datasets.length > 0 &&
    data.datasets[0].data &&
    Array.isArray(data.datasets[0].data);

  return (
    <div className="bg-white p-4 rounded-lg shadow h-80">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Usage</h3>
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>
        </div>
      ) : isValidData ? (
        <div className="h-48">
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 750,
                easing: 'easeInOutQuart'
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                  display: true,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
                x: {
                  ticks: {
                    maxTicksLimit: 10
                  }
                }
              },
              interaction: {
                intersect: false,
                mode: 'index' as const,
              }
            }}
          />
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
});

const StaffPerformanceChart = memo(({ data, isLoading }: { data: any; isLoading: boolean }) => {
  // Validate data structure
  const isValidData = data && 
    data.labels && 
    Array.isArray(data.labels) && 
    data.datasets && 
    Array.isArray(data.datasets) && 
    data.datasets.length > 0 &&
    data.datasets[0].data &&
    Array.isArray(data.datasets[0].data);

  return (
    <div className="bg-white p-4 rounded-lg shadow h-80">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Staff Performance</h3>
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>
        </div>
      ) : isValidData ? (
        <div className="h-48">
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 750,
                easing: 'easeInOutQuart'
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                  display: true,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
                x: {
                  ticks: {
                    maxTicksLimit: 10
                  }
                }
              },
              interaction: {
                intersect: false,
                mode: 'index' as const,
              }
            }}
          />
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
});

const DriverPerformanceChart = memo(({ data, isLoading }: { data: any; isLoading: boolean }) => {
  // Validate data structure
  const isValidData = data && 
    data.labels && 
    Array.isArray(data.labels) && 
    data.datasets && 
    Array.isArray(data.datasets) && 
    data.datasets.length > 0 &&
    data.datasets[0].data &&
    Array.isArray(data.datasets[0].data);

  return (
    <div className="bg-white p-4 rounded-lg shadow h-80">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Driver Performance</h3>
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>
        </div>
      ) : isValidData ? (
        <div className="h-48">
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 750,
                easing: 'easeInOutQuart'
              },
              plugins: {
                legend: {
                  position: 'top' as const,
                  display: true,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
                x: {
                  ticks: {
                    maxTicksLimit: 10
                  }
                }
              },
              interaction: {
                intersect: false,
                mode: 'index' as const,
              }
            }}
          />
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
});

// Summary Stats Card Component
const SummaryCard = memo(({ 
  title, 
  value, 
  subtitle, 
  icon, 
  bgColor 
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
}) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 ${bgColor} rounded-md flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="ml-4 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
            <dd className="text-sm text-gray-500">{subtitle}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
));

RevenueChart.displayName = 'RevenueChart';
OrderStatusChart.displayName = 'OrderStatusChart';
CustomerGrowthChart.displayName = 'CustomerGrowthChart';
ServiceUsageChart.displayName = 'ServiceUsageChart';
StaffPerformanceChart.displayName = 'StaffPerformanceChart';
DriverPerformanceChart.displayName = 'DriverPerformanceChart';
SummaryCard.displayName = 'SummaryCard';

const AnalyticsDashboard = memo(({ data, isLoading, dateRange }: AnalyticsDashboardProps) => {
  // Validate that data exists and has the expected structure
  const hasValidData = data && 
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
      <div className="h-full overflow-y-auto">
        <div className="space-y-6 p-6">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500">There is no analytics data available for the selected time period.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Revenue"
            value={`$${data.summaryStats?.totalRevenue?.toLocaleString() || '0'}`}
            subtitle={`Last ${dateRange} days`}
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
            bgColor="bg-green-500"
          />

          <SummaryCard
            title="Total Orders"
            value={data.summaryStats?.totalOrders?.toLocaleString() || '0'}
            subtitle={`Last ${dateRange} days`}
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            bgColor="bg-blue-500"
          />

          <SummaryCard
            title="Average Order Value"
            value={`$${data.summaryStats?.averageOrderValue?.toFixed(2) || '0.00'}`}
            subtitle="Per order"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
            bgColor="bg-yellow-500"
          />

          <SummaryCard
            title="Completion Rate"
            value={`${data.summaryStats?.completionRate?.toFixed(1) || '0'}%`}
            subtitle="Orders completed"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-purple-500"
          />
        </div>

        {/* Additional Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="New Customers"
            value={data.summaryStats?.totalCustomers?.toLocaleString() || '0'}
            subtitle={`Last ${dateRange} days`}
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
            bgColor="bg-indigo-500"
          />

          <SummaryCard
            title="Active Drivers"
            value={data.summaryStats?.activeDrivers?.toLocaleString() || '0'}
            subtitle="Currently active"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            bgColor="bg-orange-500"
          />

          <SummaryCard
            title="Avg Delivery Time"
            value={`${data.summaryStats?.averageDeliveryTime?.toFixed(1) || '0'}h`}
            subtitle="Hours per order"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-teal-500"
          />

          <SummaryCard
            title="Customer Satisfaction"
            value={`${data.summaryStats?.customerSatisfaction?.toFixed(1) || '0'}%`}
            subtitle="Based on feedback"
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-pink-500"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueChart data={data.revenueData} isLoading={isLoading} />
          <OrderStatusChart data={data.orderStatusData} isLoading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CustomerGrowthChart data={data.customerGrowthData} isLoading={isLoading} />
          <ServiceUsageChart data={data.serviceUsageData} isLoading={isLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StaffPerformanceChart data={data.staffPerformanceData} isLoading={isLoading} />
          <DriverPerformanceChart data={data.driverPerformanceData} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
});

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

export default AnalyticsDashboard;