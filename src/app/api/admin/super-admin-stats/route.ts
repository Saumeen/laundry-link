import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRoles, createAdminAuthErrorResponse } from "@/lib/adminAuth";
import { UserRole } from "@/types/global";

export async function GET() {
  try {
    // Require SUPER_ADMIN or OPERATION_MANAGER role
    await requireAdminRoles(["SUPER_ADMIN", "OPERATION_MANAGER"]);
    // Get total orders
    const totalOrders = await prisma.order.count();

    // Get total customers
    const totalCustomers = await prisma.customer.count();

    // Get total revenue (sum of all order amounts)
    const revenueResult = await prisma.order.aggregate({
      _sum: {
        totalAmount: true
      }
    });
    const totalRevenue = revenueResult._sum.totalAmount || 0;

    // Get active staff count
    const activeStaff = await prisma.staff.count({
      where: {
        isActive: true
      }
    });

    // Get pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        status: {
          in: ["Order Placed", "Processing", "Ready for Delivery"]
        }
      }
    });

    // Get completed orders
    const completedOrders = await prisma.order.count({
      where: {
        status: "Delivered"
      }
    });

    // Get active drivers
    const activeDrivers = await prisma.staff.count({
      where: {
        role: {
          name: "DRIVER"
        },
        isActive: true
      }
    });

    return NextResponse.json({
      totalOrders,
      totalCustomers,
      totalRevenue,
      activeStaff,
      pendingOrders,
      completedOrders,
      activeDrivers
    });
  } catch (error) {
    console.error('Error fetching super admin stats:', error || 'Unknown error');
    
    if (error instanceof Error && (error.message === 'Admin authentication required' || error.message.includes('Access denied'))) {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
} 