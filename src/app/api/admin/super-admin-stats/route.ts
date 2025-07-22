import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminRoles, createAdminAuthErrorResponse } from "@/lib/adminAuth";
import { UserRole } from "@/types/global";
import { OrderStatus } from "@prisma/client";

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
        invoiceTotal: true
      }
    });
    const totalRevenue = revenueResult._sum.invoiceTotal || 0;

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
          in: [OrderStatus.ORDER_PLACED, OrderStatus.PROCESSING_STARTED, OrderStatus.READY_FOR_DELIVERY]
        }
      }
    });

    // Get completed orders
    const completedOrders = await prisma.order.count({
      where: {
        status: OrderStatus.DELIVERED
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