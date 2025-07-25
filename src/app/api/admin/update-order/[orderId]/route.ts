import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import emailService from '@/lib/emailService';
import {
  OrderStatus,
  PaymentStatus,
  ProcessingStatus,
  DriverAssignmentStatus,
  ItemStatus,
  IssueStatus,
} from '@prisma/client';

interface UpdateOrderRequest {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  processingStatus?: ProcessingStatus;
  driverStatus?: DriverAssignmentStatus;
  itemStatus?: ItemStatus;
  issueStatus?: IssueStatus;
  notes?: string;
  // Additional fields for comprehensive order updates
  pickupStartTime?: string;
  pickupEndTime?: string;
  deliveryStartTime?: string;
  deliveryEndTime?: string;
  specialInstructions?: string;
  addressLabel?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  area?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  contactNumber?: string;
  locationType?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const admin = await requireAuthenticatedAdmin();
    const { orderId } = await params;
    const body: UpdateOrderRequest = await request.json();
    const {
      status,
      paymentStatus,
      processingStatus,
      driverStatus,
      itemStatus,
      issueStatus,
      notes,
      pickupStartTime,
      pickupEndTime,
      deliveryStartTime,
      deliveryEndTime,
      specialInstructions,
      addressLabel,
      addressLine1,
      addressLine2,
      city,
      area,
      building,
      floor,
      apartment,
      contactNumber,
      locationType,
    } = body;

    // Validate enum values
    const validStatuses = Object.values(OrderStatus);
    const validPaymentStatuses = Object.values(PaymentStatus);
    const validProcessingStatuses = Object.values(ProcessingStatus);
    const validDriverStatuses = Object.values(DriverAssignmentStatus);
    const validItemStatuses = Object.values(ItemStatus);
    const validIssueStatuses = Object.values(IssueStatus);

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      );
    }

    if (
      processingStatus &&
      !validProcessingStatuses.includes(processingStatus)
    ) {
      return NextResponse.json(
        { error: 'Invalid processing status' },
        { status: 400 }
      );
    }

    if (driverStatus && !validDriverStatuses.includes(driverStatus)) {
      return NextResponse.json(
        { error: 'Invalid driver status' },
        { status: 400 }
      );
    }

    if (itemStatus && !validItemStatuses.includes(itemStatus)) {
      return NextResponse.json(
        { error: 'Invalid item status' },
        { status: 400 }
      );
    }

    if (issueStatus && !validIssueStatuses.includes(issueStatus)) {
      return NextResponse.json(
        { error: 'Invalid issue status' },
        { status: 400 }
      );
    }

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        customer: true,
        address: true,
        orderServiceMappings: {
          include: {
            service: true,
            orderItems: true,
          },
        },
        orderProcessing: true,
        driverAssignments: true,
      },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status if provided
    if (status) {
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { status: status as OrderStatus },
      });

      // Create order update record
      await prisma.orderUpdate.create({
        data: {
          orderId: parseInt(orderId),
          staffId: admin.id,
          oldStatus: currentOrder.status,
          newStatus: status as OrderStatus,
          notes,
        },
      });

      // Send confirmation email if status is changed to CONFIRMED
      if (status === 'CONFIRMED' && currentOrder.customer) {
        try {
          await emailService.sendOrderConfirmationToCustomer(
            currentOrder,
            currentOrder.customer.email,
            `${currentOrder.customer.firstName} ${currentOrder.customer.lastName}`,
            {
              pickupDateTime: currentOrder.pickupStartTime,
              deliveryDateTime: currentOrder.deliveryStartTime,
              services: currentOrder.orderServiceMappings.map(mapping => mapping.serviceId),
              address: currentOrder.address?.addressLine1 || currentOrder.customerAddress,
            }
          );
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Continue with order update even if email fails
        }
      }
    }

    // Update payment status if provided
    if (paymentStatus) {
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { paymentStatus: paymentStatus as PaymentStatus },
      });
    }

    // Update processing status if provided
    if (processingStatus && currentOrder.orderProcessing) {
      await prisma.orderProcessing.update({
        where: { orderId: parseInt(orderId) },
        data: {
          processingStatus: processingStatus as ProcessingStatus,
          processingNotes: notes,
        },
      });
    }

    // Update driver assignment status if provided
    if (driverStatus && currentOrder.driverAssignments.length > 0) {
      await prisma.driverAssignment.updateMany({
        where: { orderId: parseInt(orderId) },
        data: { status: driverStatus as DriverAssignmentStatus },
      });
    }

    // Update processing items if item status provided
    if (itemStatus && currentOrder.orderProcessing) {
      await prisma.processingItem.updateMany({
        where: {
          orderServiceMapping: {
            orderId: parseInt(orderId),
          },
        },
        data: { status: itemStatus as ItemStatus },
      });
    }

    // Update issue reports if issue status provided
    if (issueStatus && currentOrder.orderProcessing) {
      await prisma.issueReport.updateMany({
        where: { orderProcessingId: currentOrder.orderProcessing.id },
        data: { status: issueStatus as IssueStatus },
      });
    }

    // Update order time slots and other fields if provided
    const orderUpdateData: any = {};

    if (pickupStartTime) {
      orderUpdateData.pickupStartTime = new Date(pickupStartTime);
    }
    if (pickupEndTime) {
      orderUpdateData.pickupEndTime = new Date(pickupEndTime);
    }
    if (deliveryStartTime) {
      orderUpdateData.deliveryStartTime = new Date(deliveryStartTime);
    }
    if (deliveryEndTime) {
      orderUpdateData.deliveryEndTime = new Date(deliveryEndTime);
    }
    if (specialInstructions !== undefined) {
      orderUpdateData.specialInstructions = specialInstructions;
    }

    // Update order with time slots and special instructions
    if (Object.keys(orderUpdateData).length > 0) {
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: orderUpdateData,
      });
    }

    // Update address if provided
    if (currentOrder.addressId && (
      addressLabel !== undefined ||
      addressLine1 !== undefined ||
      addressLine2 !== undefined ||
      city !== undefined ||
      area !== undefined ||
      building !== undefined ||
      floor !== undefined ||
      apartment !== undefined ||
      contactNumber !== undefined ||
      locationType !== undefined
    )) {
      const addressUpdateData: any = {};
      
      if (addressLabel !== undefined) addressUpdateData.label = addressLabel;
      if (addressLine1 !== undefined) addressUpdateData.addressLine1 = addressLine1;
      if (addressLine2 !== undefined) addressUpdateData.addressLine2 = addressLine2;
      if (city !== undefined) addressUpdateData.city = city;
      if (area !== undefined) addressUpdateData.area = area;
      if (building !== undefined) addressUpdateData.building = building;
      if (floor !== undefined) addressUpdateData.floor = floor;
      if (apartment !== undefined) addressUpdateData.apartment = apartment;
      if (contactNumber !== undefined) addressUpdateData.contactNumber = contactNumber;
      if (locationType !== undefined) addressUpdateData.locationType = locationType;

      await prisma.address.update({
        where: { id: currentOrder.addressId },
        data: addressUpdateData,
      });
    }

    return NextResponse.json({
      message: 'Order updated successfully',
      orderId: parseInt(orderId),
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
