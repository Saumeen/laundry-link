import { NextResponse } from "next/server";
import { OrderTrackingService } from "@/lib/orderTracking";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamType = searchParams.get('team') as 'driver' | 'facility' | 'operations';
    const status = searchParams.get('status');
    const driverId = searchParams.get('driverId');
    const staffId = searchParams.get('staffId');

    if (!teamType) {
      return NextResponse.json(
        { error: "Team type is required" },
        { status: 400 }
      );
    }

    // Validate team type
    const validTeamTypes = ['driver', 'facility', 'operations'];
    if (!validTeamTypes.includes(teamType)) {
      return NextResponse.json(
        { error: "Invalid team type" },
        { status: 400 }
      );
    }

    // Build filters
    const filters: any = {};
    if (status) {
      filters.status = status;
    }
    if (driverId) {
      filters.driverAssignments = {
        some: {
          driverId: parseInt(driverId)
        }
      };
    }
    if (staffId) {
      filters.orderUpdates = {
        some: {
          staffId: parseInt(staffId)
        }
      };
    }

    // Get orders for the specified team using the existing OrderTrackingService
    const orders = await OrderTrackingService.getOrdersForTeam(teamType, filters);

    return NextResponse.json({
      success: true,
      orders,
      teamType,
      count: orders.length
    });
  } catch (error) {
    console.error("Error getting team orders:", error);
    return NextResponse.json(
      { error: "Failed to get team orders" },
      { status: 500 }
    );
  }
} 