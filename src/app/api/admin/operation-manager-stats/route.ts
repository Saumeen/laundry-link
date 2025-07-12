import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Fetch pending orders count
    const pendingOrders = await prisma.order.count({
      where: {
        status: {
          in: ["Order Placed", "Processing", "Ready for Delivery"]
        }
      }
    });

    // Fetch completed orders today
    const completedToday = await prisma.order.count({
      where: {
        status: "Delivered",
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Calculate average processing time (simplified - using time between order creation and delivery)
    const completedOrders = await prisma.order.findMany({
      where: {
        status: "Delivered",
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    let avgProcessingTime = 0;
    if (completedOrders.length > 0) {
      const totalTime = completedOrders.reduce((acc, order) => {
        const processingTime = order.updatedAt.getTime() - order.createdAt.getTime();
        return acc + processingTime;
      }, 0);
      avgProcessingTime = totalTime / completedOrders.length / (1000 * 60 * 60); // Convert to hours
    }

    // Fetch active drivers count
    const activeDrivers = await prisma.staff.count({
      where: {
        role: {
          name: "DRIVER"
        },
        isActive: true
      }
    });

    // Fetch recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        customer: true,
        invoiceItems: true
      }
    });

    return NextResponse.json({
      stats: {
        pendingOrders,
        completedToday,
        avgProcessingTime: Math.round(avgProcessingTime * 10) / 10, // Round to 1 decimal
        activeDrivers
      },
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching operation manager stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
} 