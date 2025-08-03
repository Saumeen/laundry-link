import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import {
  requireAdminRoles,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';
import { OrderStatus } from '@prisma/client';

// Utility function to convert BigInt to number for JSON serialization
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber);
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value);
    }
    return converted;
  }

  return obj;
}

export async function GET(request: Request) {
  try {
    // Require SUPER_ADMIN role
    await requireAdminRoles(['SUPER_ADMIN']);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30';
    const days = parseInt(range);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Generate date labels for charts
    const dateLabels = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dateLabels.push(
        currentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fetch revenue data by day with error handling
    let revenueData: Array<{
      date: string;
      daily_revenue: string;
      daily_orders: number;
    }> = [];
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COALESCE(CAST(SUM("invoiceTotal") AS DECIMAL(10,2)), 0) as daily_revenue
        FROM orders 
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        GROUP BY DATE("createdAt")
        ORDER BY date
      `;
      revenueData = result as any[];
    } catch (error) {
      logger.error('Error fetching revenue data:', error);
      revenueData = [];
    }

    // Fetch order status distribution with error handling
    let orderStatusData: Array<{ status: string; _count: { status: number } }> =
      [];
    try {
      const result = await prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          status: true,
        },
      });
      orderStatusData = result;
    } catch (error) {
      logger.error('Error fetching order status data:', error);
      orderStatusData = [];
    }

    // Fetch customer growth data with error handling
    let customerGrowthData: Array<{ date: string; new_customers: number }> = [];
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          CAST(COUNT(*) AS INTEGER) as new_customers
        FROM customers 
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        GROUP BY DATE("createdAt")
        ORDER BY date
      `;
      customerGrowthData = result as Array<{
        date: string;
        new_customers: number;
      }>;
    } catch (error) {
      logger.error('Error fetching customer growth data:', error);
      customerGrowthData = [];
    }

    // Fetch service usage data with error handling - count actual quantities
    let serviceUsageData: Array<{
      serviceId: number;
      _count: { serviceId: number };
    }> = [];
    try {
      const result = await prisma.orderServiceMapping.groupBy({
        by: ['serviceId'],
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        _count: {
          serviceId: true,
        },
      });
      serviceUsageData = result;
    } catch (error) {
      logger.error('Error fetching service usage data:', error);
      serviceUsageData = [];
    }

    // Get service names
    const serviceIds = serviceUsageData.map(item => item.serviceId);
    let services: Array<{ id: number; displayName: string }> = [];
    try {
      if (serviceIds.length > 0) {
        const result = await prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, displayName: true },
        });
        services = result;
      }
    } catch (error) {
      logger.error('Error fetching services:', error);
      services = [];
    }

    // Fetch staff performance data with error handling
    let staffPerformanceData: Array<{
      staffId: number;
      _count: { staffId: number };
    }> = [];
    try {
      const result = await prisma.orderProcessing.groupBy({
        by: ['staffId'],
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        _count: {
          staffId: true,
        },
      });
      staffPerformanceData = result;
    } catch (error) {
      logger.error('Error fetching staff performance data:', error);
      staffPerformanceData = [];
    }

    // Get staff names
    const staffIds = staffPerformanceData.map(item => item.staffId);
    let staffMembers: Array<{
      id: number;
      firstName: string;
      lastName: string;
    }> = [];
    try {
      if (staffIds.length > 0) {
        const result = await prisma.staff.findMany({
          where: { id: { in: staffIds } },
          select: { id: true, firstName: true, lastName: true },
        });
        staffMembers = result;
      }
    } catch (error) {
      logger.error('Error fetching staff members:', error);
      staffMembers = [];
    }

    // Fetch driver performance data with error handling
    let driverPerformanceData: Array<{
      driverId: number;
      _count: { driverId: number };
    }> = [];
    try {
      const result = await prisma.driverAssignment.groupBy({
        by: ['driverId'],
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        _count: {
          driverId: true,
        },
      });
      driverPerformanceData = result;
    } catch (error) {
      logger.error('Error fetching driver performance data:', error);
      driverPerformanceData = [];
    }

    // Get driver names
    const driverIds = driverPerformanceData.map(item => item.driverId);
    let drivers: Array<{ id: number; firstName: string; lastName: string }> =
      [];
    try {
      if (driverIds.length > 0) {
        const result = await prisma.staff.findMany({
          where: {
            id: { in: driverIds },
            role: { name: 'DRIVER' },
          },
          select: { id: true, firstName: true, lastName: true },
        });
        drivers = result;
      }
    } catch (error) {
      logger.error('Error fetching drivers:', error);
      drivers = [];
    }

    // Calculate summary stats with error handling
    let summaryStats: {
      _sum: { invoiceTotal: number | null };
      _count: { id: number };
    } | null = null;
    try {
      const rawSummaryStats = await prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          invoiceTotal: true,
        },
        _count: {
          id: true,
        },
      });

      // Convert BigInt to number to avoid serialization issues
      let invoiceTotal = null;
      if (rawSummaryStats._sum.invoiceTotal) {
        invoiceTotal = Number(rawSummaryStats._sum.invoiceTotal);
      }

      summaryStats = {
        _sum: {
          invoiceTotal: invoiceTotal,
        },
        _count: {
          id: Number(rawSummaryStats._count.id),
        },
      };
    } catch (error) {
      logger.error('Error calculating total revenue:', error);
      summaryStats = { _sum: { invoiceTotal: 0 }, _count: { id: 0 } };
    }

    // Calculate additional stats
    const completedOrders = Number(
      await prisma.order.count({
        where: {
          status: OrderStatus.DELIVERED,
          createdAt: { gte: startDate, lte: endDate },
        },
      })
    );

    const totalCustomers = Number(
      await prisma.customer.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      })
    );

    const activeDrivers = Number(
      await prisma.staff.count({
        where: {
          role: { name: 'DRIVER' },
          isActive: true,
        },
      })
    );

    const totalRevenue = summaryStats?._sum.invoiceTotal || 0;
    const totalOrders = summaryStats?._count.id || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completionRate =
      totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Process data for charts
    const revenueLabels = (revenueData || []).map(
      (item: { date: string; daily_revenue: string; daily_orders: number }) =>
        new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
    );
    const revenueValues = (revenueData || []).map(
      (item: { date: string; daily_revenue: string; daily_orders: number }) =>
        parseFloat(item.daily_revenue)
    );

    const customerLabels = (customerGrowthData || []).map(
      (item: { date: string; new_customers: number }) =>
        new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
    );
    const customerValues = (customerGrowthData || []).map(
      (item: { date: string; new_customers: number }) => item.new_customers
    );

    // Process order status data for chart
    const orderStatusLabels = (orderStatusData || []).map(item => item.status);
    const orderStatusValues = (orderStatusData || []).map(item =>
      Number(item._count.status)
    );
    const orderStatusColors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // yellow
      '#EF4444', // red
      '#8B5CF6', // purple
      '#06B6D4', // cyan
    ];

    // Process service usage data for chart - use actual quantities
    const serviceLabels = (serviceUsageData || []).map(item => {
      const service = (services || []).find(s => s.id === item.serviceId);
      return service ? service.displayName : `Service ${item.serviceId}`;
    });
    const serviceValues = (serviceUsageData || []).map(
      item => Number(item._count.serviceId) || 0
    );

    // Process staff performance data for chart
    const staffLabels = (staffPerformanceData || []).map(item => {
      const staff = (staffMembers || []).find(s => s.id === item.staffId);
      return staff
        ? `${staff.firstName} ${staff.lastName}`
        : `Staff ${item.staffId}`;
    });
    const staffValues = (staffPerformanceData || []).map(item =>
      Number(item._count.staffId)
    );

    // Process driver performance data for chart
    const driverLabels = (driverPerformanceData || []).map(item => {
      const driver = (drivers || []).find(d => d.id === item.driverId);
      return driver
        ? `${driver.firstName} ${driver.lastName}`
        : `Driver ${item.driverId}`;
    });
    const driverValues = (driverPerformanceData || []).map(item =>
      Number(item._count.driverId)
    );

    const reportData = {
      revenueData: {
        labels: dateLabels,
        datasets: [
          {
            label: 'Daily Revenue',
            data: revenueValues,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      orderStatusData: {
        labels: orderStatusLabels,
        datasets: [
          {
            data: orderStatusValues,
            backgroundColor: orderStatusColors,
            borderColor: orderStatusColors,
            borderWidth: 1,
          },
        ],
      },
      customerGrowthData: {
        labels: dateLabels,
        datasets: [
          {
            label: 'New Customers',
            data: customerValues,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      serviceUsageData: {
        labels: serviceLabels,
        datasets: [
          {
            label: 'Orders',
            data: serviceValues,
            backgroundColor: '#8B5CF6',
            borderColor: '#8B5CF6',
            borderWidth: 1,
          },
        ],
      },
      staffPerformanceData: {
        labels: staffLabels,
        datasets: [
          {
            label: 'Orders Processed',
            data: staffValues,
            backgroundColor: '#F59E0B',
            borderColor: '#F59E0B',
            borderWidth: 1,
          },
        ],
      },
      driverPerformanceData: {
        labels: driverLabels,
        datasets: [
          {
            label: 'Deliveries Completed',
            data: driverValues,
            backgroundColor: '#06B6D4',
            borderColor: '#06B6D4',
            borderWidth: 1,
          },
        ],
      },
      summaryStats: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        completionRate,
        customerSatisfaction: 95.5, // Default value
        activeDrivers,
      },
    };

    // Ensure reportData is not null before returning
    if (!reportData) {
      throw new Error('Failed to generate report data');
    }

    // Convert any remaining BigInt values to numbers for JSON serialization
    const serializableReportData = convertBigIntToNumber(reportData);

    return NextResponse.json(serializableReportData);
  } catch (error: any) {
    logger.error('Error fetching reports:',
      error?.message || error || 'Unknown error'
    );

    if (
      error instanceof Error &&
      (error.message === 'Admin authentication required' ||
        error.message.includes('Access denied'))
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
