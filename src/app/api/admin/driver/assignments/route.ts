import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin } from "@/lib/adminAuth";
import { DriverAssignmentStatus, OrderStatus } from "@prisma/client";
import { OrderTrackingService } from "@/lib/orderTracking";
import  emailService  from "@/lib/emailService";

interface DriverAssignmentRequest {
  orderId: number;
  driverId: number;
  assignmentType: 'pickup' | 'delivery';
  status: DriverAssignmentStatus;
  estimatedTime?: Date;
  notes?: string;
}

interface DriverAssignmentUpdateRequest {
  assignmentId: number;
  status: DriverAssignmentStatus;
  notes?: string;
  photoUrl?: string;
  photoType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const body: DriverAssignmentRequest = await request.json();
    
    const {
      orderId,
      driverId,
      assignmentType,
      status,
      estimatedTime,
      notes
    } = body;

    // Validate enum values
    const validStatuses = Object.values(DriverAssignmentStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid driver status" }, { status: 400 });
    }

    // Check if driver exists and is active
    const driver = await prisma.staff.findFirst({
      where: {
        id: driverId,
        role: {
          name: 'DRIVER'
        },
        isActive: true
      }
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found or inactive" }, { status: 404 });
    }

    // Check if assignment already exists for this order and type
    const existingAssignment = await prisma.driverAssignment.findFirst({
      where: {
        orderId,
        assignmentType
      }
    });

    if (existingAssignment) {
      return NextResponse.json({ error: "Assignment already exists for this order and type" }, { status: 400 });
    }

    // Create driver assignment
    const assignment = await prisma.driverAssignment.create({
      data: {
        orderId,
        driverId,
        assignmentType,
        status,
        estimatedTime,
        notes
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        order: {
          include: {
            customer: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: "Driver assignment created successfully",
      assignment 
    });

  } catch (error) {
    console.error("Error creating driver assignment:", error);
    return NextResponse.json(
      { error: "Failed to create driver assignment" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const body: DriverAssignmentUpdateRequest = await request.json();
    
    const {
      assignmentId,
      status,
      notes,
      photoUrl,
      photoType
    } = body;

    if (!assignmentId || !status) {
      return NextResponse.json({ error: "Assignment ID and status are required" }, { status: 400 });
    }

    // Validate enum values
    const validStatuses = Object.values(DriverAssignmentStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid driver status" }, { status: 400 });
    }

    // Get the assignment to check time validation
    const assignment = await prisma.driverAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        order: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Ensure only the assigned driver can update the assignment
    if (assignment.driverId !== admin.id) {
      return NextResponse.json({ error: "Access denied. You can only update your own assignments." }, { status: 403 });
    }

    // Time validation for starting assignments
    if (status === 'IN_PROGRESS') {
      const now = new Date();
      const estimatedTime = assignment.estimatedTime ? new Date(assignment.estimatedTime) : null;
      
      if (estimatedTime) {
        // Allow starting 30 minutes before and 2 hours after estimated time
        // For development environment, allow same-day assignments
        const isDev = process.env.NODE_ENV === 'development';
        const earliestStart = isDev 
          ? new Date() // Allow immediate assignments in dev
          : new Date(estimatedTime.getTime() - 30 * 60 * 1000); // 30 minutes before
        const latestStart = isDev
          ? new Date(estimatedTime.getTime() + 24 * 60 * 60 * 1000) // 24 hours after in dev
          : new Date(estimatedTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours after
        
        if (now < earliestStart) {
          return NextResponse.json({ 
            error: `Cannot start ${assignment.assignmentType} yet. Earliest start time is ${earliestStart.toLocaleString()}` 
          }, { status: 400 });
        }
        
        if (now > latestStart) {
          return NextResponse.json({ 
            error: `Cannot start ${assignment.assignmentType}. Time window has expired. Please contact support.` 
          }, { status: 400 });
        }
      }
    }

    // Update the assignment
    const updatedAssignment = await prisma.driverAssignment.update({
      where: { id: assignmentId },
      data: {
        status,
        notes: notes || null,
        actualTime: new Date()
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        order: {
          include: {
            customer: true
          }
        },
        photos: true
      }
    });

    // --- Update Order Status if needed ---
    if (status && updatedAssignment.order) {
      let newOrderStatus: OrderStatus | undefined;
      if (updatedAssignment.assignmentType === 'pickup') {
        if (status === 'IN_PROGRESS') newOrderStatus = OrderStatus.PICKUP_IN_PROGRESS;
        else if (status === 'COMPLETED') newOrderStatus = OrderStatus.PICKUP_COMPLETED;
        else if (status === 'FAILED') newOrderStatus = OrderStatus.PICKUP_FAILED;
      } else if (updatedAssignment.assignmentType === 'delivery') {
        if (status === 'IN_PROGRESS') newOrderStatus = OrderStatus.DELIVERY_IN_PROGRESS;
        else if (status === 'COMPLETED') newOrderStatus = OrderStatus.DELIVERED;
        else if (status === 'FAILED') newOrderStatus = OrderStatus.DELIVERY_FAILED;
      }
      if (newOrderStatus) {
        await OrderTrackingService.updateOrderStatus({
          orderId: updatedAssignment.orderId,
          newStatus: newOrderStatus,
          notes,
        });
      }
    }
    // --- End update order status ---

    // If photo is provided, save it
    if (photoUrl && photoType) {
      await prisma.driverPhoto.create({
        data: {
          driverAssignmentId: assignmentId,
          photoUrl,
          photoType,
          description: notes || null
        }
      });
    }

    // Send delivery confirmation email with invoice when delivery is completed
    if (updatedAssignment.assignmentType === 'delivery' && status === 'COMPLETED' && updatedAssignment.order?.customer) {
      try {
        // Fetch order details with invoice information
        const orderWithInvoice = await prisma.order.findUnique({
          where: { id: updatedAssignment.orderId },
          include: {
            customer: true,
            orderServiceMappings: {
              include: {
                service: true,
                orderItems: true
              }
            }
          }
        });

        if (orderWithInvoice && orderWithInvoice.customer) {
          // Prepare invoice data
          const invoiceData = {
            totalAmount: orderWithInvoice.invoiceTotal || 0,
            items: orderWithInvoice.orderServiceMappings.map(mapping => ({
              serviceName: mapping.service.displayName,
              quantity: mapping.quantity,
              unitPrice: mapping.price,
              totalPrice: mapping.price * mapping.quantity,
              notes: mapping.orderItems.length > 0 ? 
                mapping.orderItems.map(item => item.itemName).join(', ') : 
                undefined
            }))
          };

          // Send delivery confirmation email with invoice
          await emailService.sendDeliveryConfirmationWithInvoice(
            orderWithInvoice,
            orderWithInvoice.customer.email,
            `${orderWithInvoice.customer.firstName} ${orderWithInvoice.customer.lastName}`,
            invoiceData
          );

          console.log(`Delivery confirmation email sent for order #${orderWithInvoice.orderNumber}`);
        }
      } catch (emailError) {
        console.error('Error sending delivery confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      message: "Driver assignment updated successfully",
      assignment: updatedAssignment 
    });

  } catch (error) {
    console.error("Error updating driver assignment:", error);
    return NextResponse.json(
      { error: "Failed to update driver assignment" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuthenticatedAdmin();
    
    // Ensure the user is a driver
    if (admin.role !== "DRIVER") {
      return NextResponse.json({ error: "Access denied. Driver role required." }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as DriverAssignmentStatus;
    const driverId = searchParams.get('driverId');
    const orderId = searchParams.get('orderId');
    const showCompleted = searchParams.get('showCompleted') === 'true';

    const where: any = {
      driverId: admin.id // Only show assignments for the current driver
    };
    
    if (status) {
      where.status = status;
    }
    
    if (orderId) {
      where.orderId = parseInt(orderId);
    }

    // Filter out completed assignments unless explicitly requested
    if (!showCompleted) {
      where.status = {
        notIn: [DriverAssignmentStatus.COMPLETED, DriverAssignmentStatus.FAILED]
      };
    }

    const assignments = await prisma.driverAssignment.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        order: {
          include: {
            customer: true,
            address: true
          }
        },
        photos: true
      },
      orderBy: [
        {
          estimatedTime: 'asc' // Sort by estimated time for today's assignments
        },
        {
          createdAt: 'desc'
        }
      ]
    });

    // Auto-move previous assignments to today if they're still pending
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const updatedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        // If assignment is from previous days and still pending, update estimated time to today
        if (assignment.status === DriverAssignmentStatus.ASSIGNED && 
            assignment.estimatedTime && 
            new Date(assignment.estimatedTime) < today) {
          
          const newEstimatedTime = new Date(today);
          newEstimatedTime.setHours(
            new Date(assignment.estimatedTime).getHours(),
            new Date(assignment.estimatedTime).getMinutes(),
            0, 0
          );
          
          // Update the assignment in database
          await prisma.driverAssignment.update({
            where: { id: assignment.id },
            data: { estimatedTime: newEstimatedTime }
          });
          
          // Return updated assignment
          return {
            ...assignment,
            estimatedTime: newEstimatedTime.toISOString()
          };
        }
        
        return assignment;
      })
    );

    return NextResponse.json(updatedAssignments);

  } catch (error) {
    console.error("Error fetching driver assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver assignments" },
      { status: 500 }
    );
  }
} 