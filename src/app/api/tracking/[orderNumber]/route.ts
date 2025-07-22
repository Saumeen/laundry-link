import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OrderStatus, PaymentStatus, ProcessingStatus, DriverAssignmentStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: true,
        address: true,
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true
          }
        },
        orderUpdates: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            staff: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        driverAssignments: {
          include: {
            driver: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            },
            photos: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        orderProcessing: {
          include: {
            staff: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            processingItems: {
              include: {
                orderServiceMapping: {
                  include: {
                    service: true
                  }
                }
              }
            },
                         issueReports: {
               include: {
                 staff: {
                   select: {
                     firstName: true,
                     lastName: true
                   }
                 }
               },
               orderBy: {
                 reportedAt: 'desc'
               }
             }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Transform the data for public consumption
    const trackingData = {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: `${order.customerFirstName} ${order.customerLastName}`,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      pickupTime: order.pickupTime,
      deliveryTime: order.deliveryTime,
      invoiceTotal: order.invoiceTotal,
      specialInstructions: order.specialInstructions,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      
      // Services
      services: order.orderServiceMappings.map(mapping => ({
        serviceName: mapping.service.displayName,
        quantity: mapping.quantity,
        price: mapping.price,
        totalPrice: mapping.price * mapping.quantity,
        items: mapping.orderItems.map(item => ({
          itemName: item.itemName,
          itemType: item.itemType,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          totalPrice: item.totalPrice,
          notes: item.notes
        }))
      })),
      
      // Status updates
      statusUpdates: order.orderUpdates.map(update => ({
        oldStatus: update.oldStatus,
        newStatus: update.newStatus,
        notes: update.notes,
        timestamp: update.createdAt,
        staffName: update.staff ? `${update.staff.firstName} ${update.staff.lastName}` : 'System'
      })),
      
      // Driver assignments
      driverAssignments: order.driverAssignments.map(assignment => ({
        assignmentType: assignment.assignmentType,
        status: assignment.status,
        estimatedTime: assignment.estimatedTime,
        actualTime: assignment.actualTime,
        notes: assignment.notes,
        driverName: `${assignment.driver.firstName} ${assignment.driver.lastName}`,
        driverPhone: assignment.driver.phone,
        photos: assignment.photos.map(photo => ({
          photoUrl: photo.photoUrl,
          photoType: photo.photoType,
          description: photo.description,
          timestamp: photo.createdAt
        }))
      })),
      
      // Processing information
      processing: order.orderProcessing ? {
        status: order.orderProcessing.processingStatus,
        totalPieces: order.orderProcessing.totalPieces,
        totalWeight: order.orderProcessing.totalWeight,
        processingNotes: order.orderProcessing.processingNotes,
        qualityScore: order.orderProcessing.qualityScore,
        processingStartedAt: order.orderProcessing.processingStartedAt,
        processingCompletedAt: order.orderProcessing.processingCompletedAt,
        staffName: `${order.orderProcessing.staff.firstName} ${order.orderProcessing.staff.lastName}`,
        items: order.orderProcessing.processingItems.map(item => ({
          serviceName: item.orderServiceMapping.service.displayName,
          status: item.status,
          notes: item.notes
        })),
        issueReports: order.orderProcessing.issueReports.map(report => ({
          status: report.status,
          description: report.description,
          resolution: report.resolution,
          severity: report.severity,
          reportedAt: report.reportedAt,
          staffName: `${report.staff.firstName} ${report.staff.lastName}`
        }))
      } : null
    };

    return NextResponse.json(trackingData);

  } catch (error) {
    console.error("Error fetching order tracking:", error);
    return NextResponse.json(
      { error: "Failed to fetch order tracking" },
      { status: 500 }
    );
  }
} 