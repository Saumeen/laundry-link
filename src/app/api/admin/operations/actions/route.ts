import { NextResponse } from "next/server";
import { OrderTrackingService } from "@/lib/orderTracking";
import { requireAuthenticatedAdmin } from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    // Get authenticated admin from session
    const admin = await requireAuthenticatedAdmin();
    
    const body = await req.json();
    const { 
      orderId, 
      action, 
      driverId, 
      notes 
    } = body as {
      orderId: number;
      action: 'confirm_order' | 'assign_pickup_driver' | 'assign_delivery_driver';
      driverId?: number;
      notes?: string;
    };

    if (!orderId || !action) {
      return NextResponse.json(
        { error: "Order ID and action are required" },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = [
      'confirm_order', 'assign_pickup_driver', 'assign_delivery_driver'
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    // Validate driver ID for assignment actions
    if ((action === 'assign_pickup_driver' || action === 'assign_delivery_driver') && !driverId) {
      return NextResponse.json(
        { error: "Driver ID is required for assignment actions" },
        { status: 400 }
      );
    }

    // Handle operations action using the existing OrderTrackingService
    const result = await OrderTrackingService.handleOperationsAction({
      orderId,
      staffId: admin.id, // Get staff ID from backend session
      action,
      driverId,
      notes
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Failed to handle operations action" },
        { status: 400 }
      );
    }

    console.log(`Operations action completed: ${action} for order ${orderId} by staff ${admin.id}`);

    return NextResponse.json({
      message: "Operations action completed successfully",
      action,
      orderId,
      driverId
    });
  } catch (error) {
    console.error("Error handling operations action:", error);
    return NextResponse.json(
      { error: "Failed to handle operations action" },
      { status: 500 }
    );
  }
} 