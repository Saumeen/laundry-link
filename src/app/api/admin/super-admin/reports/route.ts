import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRoles, createAdminAuthErrorResponse } from "@/lib/adminAuth";
import { OrderStatus } from "@prisma/client";

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
    await requireAdminRoles(["SUPER_ADMIN"]);

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
      dateLabels.push(currentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fetch revenue data by day with error handling
    let revenueData: any[] = [];
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
    } catch (error: any) {
      console.error('Error fetching revenue data:', error?.message || error || 'Unknown error');
      revenueData = [];
    }

    // Fetch order status distribution with error handling
    let orderStatusData: any[] = [];
    try {
      const result = await prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          status: true
        }
      });
      orderStatusData = result as any[];
    } catch (error: any) {
      console.error('Error fetching order status data:', error?.message || error || 'Unknown error');
      orderStatusData = [];
    }

    // Fetch customer growth data with error handling
    let customerGrowthData: any[] = [];
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
      customerGrowthData = result as any[];
    } catch (error: any) {
      console.error('Error fetching customer growth data:', error?.message || error || 'Unknown error');
      customerGrowthData = [];
    }

    // Fetch service usage data with error handling - count actual quantities
    let serviceUsageData: any[] = [];
    try {
      const result = await prisma.orderServiceMapping.groupBy({
        by: ['serviceId'],
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        _sum: {
          quantity: true
        },
        _count: {
          serviceId: true
        }
      });
      serviceUsageData = result as any[];
    } catch (error: any) {
      console.error('Error fetching service usage data:', error?.message || error || 'Unknown error');
      serviceUsageData = [];
    }

    // Get service names for the chart with error handling
    let services: any[] = [];
    try {
      const serviceIds = serviceUsageData.map(item => item.serviceId);
      if (serviceIds.length > 0) {
        services = await prisma.service.findMany({
          where: {
            id: {
              in: serviceIds
            }
          },
          select: {
            id: true,
            displayName: true
          }
        });
      }
    } catch (error: any) {
      console.error('Error fetching services:', error?.message || error || 'Unknown error');
      services = [];
    }

    // Fetch staff performance data with error handling
    let staffPerformanceData: any[] = [];
    try {
      const result = await prisma.orderProcessing.groupBy({
        by: ['staffId'],
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        _count: {
          staffId: true
        },
        _avg: {
          qualityScore: true
        }
      });
      staffPerformanceData = result as any[];
    } catch (error: any) {
      console.error('Error fetching staff performance data:', error?.message || error || 'Unknown error');
      staffPerformanceData = [];
    }

    // Get staff names for the chart with error handling
    let staffMembers: any[] = [];
    try {
      const staffIds = staffPerformanceData.map(item => item.staffId);
      if (staffIds.length > 0) {
        staffMembers = await prisma.staff.findMany({
          where: {
            id: {
              in: staffIds
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        });
      }
    } catch (error: any) {
      console.error('Error fetching staff members:', error?.message || error || 'Unknown error');
      staffMembers = [];
    }

    // Fetch driver performance data with error handling
    let driverPerformanceData: any[] = [];
    try {
      const result = await prisma.driverAssignment.groupBy({
        by: ['driverId'],
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        _count: {
          driverId: true
        }
      });
      driverPerformanceData = result as any[];
    } catch (error: any) {
      console.error('Error fetching driver performance data:', error?.message || error || 'Unknown error');
      driverPerformanceData = [];
    }

    // Get driver names for the chart with error handling
    let drivers: any[] = [];
    try {
      const driverIds = driverPerformanceData.map(item => item.driverId);
      if (driverIds.length > 0) {
        drivers = await prisma.staff.findMany({
          where: {
            id: {
              in: driverIds
            },
            role: {
              name: 'DRIVER'
            }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        });
      }
    } catch (error: any) {
      console.error('Error fetching drivers:', error?.message || error || 'Unknown error');
      drivers = [];
    }

    // Calculate summary stats with error handling
    let totalRevenue = { _sum: { invoiceTotal: 0 } };
    let totalOrders = 0;
    let totalCustomers = 0;
    let completedOrders = 0;
    let activeDrivers = 0;
    let averageDeliveryTime = 0;
    let customerSatisfaction = 95.5; // Default value

    try {
<<<<<<< Updated upstream
      const revenueResult = await prisma.order.aggregate({
=======
      const rawSummaryStats = await prisma.order.aggregate({
>>>>>>> Stashed changes
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          invoiceTotal: true
        }
      });
<<<<<<< Updated upstream
      totalRevenue = { _sum: { invoiceTotal: revenueResult._sum.invoiceTotal || 0 } };
    } catch (error: any) {
      console.error('Error calculating total revenue:', error?.message || error || 'Unknown error');
    }

    try {
      totalOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
    } catch (error: any) {
      console.error('Error counting total orders:', error?.message || error || 'Unknown error');
    }

    try {
      totalCustomers = await prisma.customer.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
    } catch (error: any) {
      console.error('Error counting total customers:', error?.message || error || 'Unknown error');
    }

    try {
      completedOrders = await prisma.order.count({
        where: {
          status: OrderStatus.DELIVERED,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });
    } catch (error: any) {
      console.error('Error counting completed orders:', error?.message || error || 'Unknown error');
    }

    try {
      activeDrivers = await prisma.staff.count({
        where: {
          role: {
            name: 'DRIVER'
          },
          isActive: true
        }
      });
    } catch (error: any) {
      console.error('Error counting active drivers:', error?.message || error || 'Unknown error');
    }

    // Calculate average delivery time
    try {
      // This is a simplified calculation - in a real app you'd track actual delivery times
      // For now, we'll use a default value since deliveredAt field doesn't exist in the schema
      averageDeliveryTime = 24.5; // Default to 24.5 hours
    } catch (error: any) {
      console.error('Error calculating average delivery time:', error?.message || error || 'Unknown error');
      averageDeliveryTime = 24.5; // Default value
    }

    // Process revenue data for chart
    const revenueChartData = dateLabels.map(label => {
      const date = new Date(label);
      const revenueEntry = (revenueData as any[]).find(
        (item: any) => new Date(item.date).toDateString() === date.toDateString()
      );
      return revenueEntry ? parseFloat(revenueEntry.daily_revenue) : 0;
    });

    // Process customer growth data for chart
    const customerChartData = dateLabels.map(label => {
      const date = new Date(label);
      const customerEntry = (customerGrowthData as any[]).find(
        (item: any) => new Date(item.date).toDateString() === date.toDateString()
      );
      return customerEntry ? parseInt(customerEntry.new_customers) : 0;
    });

    // Process order status data for chart
    const orderStatusLabels = (orderStatusData || []).map(item => item.status);
    const orderStatusValues = (orderStatusData || []).map(item => item._count.status);
=======
      
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
      console.error('Error calculating total revenue:', error);
      summaryStats = { _sum: { invoiceTotal: 0 }, _count: { id: 0 } };
    }

    // Calculate additional stats
    const completedOrders = Number(await prisma.order.count({
      where: {
        status: OrderStatus.DELIVERED,
        createdAt: { gte: startDate, lte: endDate },
      },
    }));

    const totalCustomers = Number(await prisma.customer.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }));

    const activeDrivers = Number(await prisma.staff.count({
      where: {
        role: { name: 'DRIVER' },
        isActive: true,
      },
    }));

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
    const orderStatusValues = (orderStatusData || []).map(
      item => Number(item._count.status)
    );
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    const serviceValues = (serviceUsageData || []).map(item => item._sum.quantity || 0);
=======
    const serviceValues = (serviceUsageData || []).map(
      item => Number(item._count.serviceId) || 0
    );
>>>>>>> Stashed changes

    // Process staff performance data for chart
    const staffLabels = (staffPerformanceData || []).map(item => {
      const staff = (staffMembers || []).find(s => s.id === item.staffId);
      return staff ? `${staff.firstName} ${staff.lastName}` : `Staff ${item.staffId}`;
    });
<<<<<<< Updated upstream
    const staffValues = (staffPerformanceData || []).map(item => item._count.staffId);
=======
    const staffValues = (staffPerformanceData || []).map(
      item => Number(item._count.staffId)
    );
>>>>>>> Stashed changes

    // Process driver performance data for chart
    const driverLabels = (driverPerformanceData || []).map(item => {
      const driver = (drivers || []).find(d => d.id === item.driverId);
      return driver ? `${driver.firstName} ${driver.lastName}` : `Driver ${item.driverId}`;
    });
<<<<<<< Updated upstream
    const driverValues = (driverPerformanceData || []).map(item => item._count.driverId);
=======
    const driverValues = (driverPerformanceData || []).map(
      item => Number(item._count.driverId)
    );
>>>>>>> Stashed changes

    const reportData = {
      revenueData: {
        labels: dateLabels,
        datasets: [
          {
            label: 'Daily Revenue',
            data: revenueChartData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      orderStatusData: {
        labels: orderStatusLabels,
        datasets: [
          {
            data: orderStatusValues,
            backgroundColor: orderStatusColors,
            borderColor: orderStatusColors,
            borderWidth: 1
          }
        ]
      },
      customerGrowthData: {
        labels: dateLabels,
        datasets: [
          {
            label: 'New Customers',
            data: customerChartData,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      serviceUsageData: {
        labels: serviceLabels,
        datasets: [
          {
            label: 'Orders',
            data: serviceValues,
            backgroundColor: '#8B5CF6',
            borderColor: '#8B5CF6',
            borderWidth: 1
          }
        ]
      },
      staffPerformanceData: {
        labels: staffLabels,
        datasets: [
          {
            label: 'Orders Processed',
            data: staffValues,
            backgroundColor: '#F59E0B',
            borderColor: '#F59E0B',
            borderWidth: 1
          }
        ]
      },
      driverPerformanceData: {
        labels: driverLabels,
        datasets: [
          {
            label: 'Deliveries Completed',
            data: driverValues,
            backgroundColor: '#06B6D4',
            borderColor: '#06B6D4',
            borderWidth: 1
          }
        ]
      },
      summaryStats: {
        totalRevenue: totalRevenue._sum.invoiceTotal || 0,
        totalOrders,
        totalCustomers,
        averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.invoiceTotal || 0) / totalOrders : 0,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        customerSatisfaction,
        activeDrivers,
        averageDeliveryTime
      }
    };

    // Ensure reportData is not null before returning
    if (!reportData) {
      throw new Error('Failed to generate report data');
    }

    // Convert any remaining BigInt values to numbers for JSON serialization
    const serializableReportData = convertBigIntToNumber(reportData);

    return NextResponse.json(serializableReportData);
  } catch (error: any) {
    console.error('Error fetching reports:', error?.message || error || 'Unknown error');
    
    if (error instanceof Error && (error.message === 'Admin authentication required' || error.message.includes('Access denied'))) {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
} 