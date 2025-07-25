import prisma from './prisma';
import {
  OrderStatus,
  PaymentStatus,
  DriverAssignmentStatus,
  ProcessingStatus,
  ItemStatus,
  IssueStatus,
} from '@prisma/client';
import { createOrderHistoryEntry, validateStatusChange } from './orderStatus';
import emailService from './emailService';

export interface OrderUpdateData {
  orderId: number;
  staffId?: number;
  newStatus?: OrderStatus;
  newPaymentStatus?: PaymentStatus;
  notes?: string;
  metadata?: any;
  shouldSendEmail?: boolean;
}

export interface OrderHistoryEntry {
  id: number;
  orderId: number;
  staffId: number | null;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  description: string;
  metadata: string | null;
  createdAt: Date;
  staff?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface DriverActionData {
  orderId: number;
  driverId: number;
  action:
    | 'start_pickup'
    | 'complete_pickup'
    | 'fail_pickup'
    | 'drop_off'
    | 'start_delivery'
    | 'complete_delivery'
    | 'fail_delivery';
  photoUrl?: string;
  notes?: string;
}

export interface FacilityActionData {
  orderId: number;
  staffId: number;
  action:
    | 'receive_order'
    | 'start_processing'
    | 'complete_processing'
    | 'generate_invoice'
    | 'assign_delivery_driver';
  notes?: string;
  metadata?: any;
}

export interface OperationsActionData {
  orderId: number;
  staffId: number;
  action: 'confirm_order' | 'assign_pickup_driver' | 'assign_delivery_driver';
  driverId?: number;
  estimatedTime?: string;
  notes?: string;
}

export class OrderTrackingService {
  /**
   * Update order status with comprehensive tracking
   */
  static async updateOrderStatus(
    data: OrderUpdateData
  ): Promise<{ success: boolean; message?: string; order?: any }> {
    const { orderId, staffId, newStatus, newPaymentStatus, notes, metadata } =
      data;

    try {
      // Get current order
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderUpdates: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!currentOrder) {
        return { success: false, message: 'Order not found' };
      }

      // Validate status change if status is being updated
      if (newStatus && newStatus !== currentOrder.status) {
        const validation = validateStatusChange(currentOrder.status, newStatus);
        if (!validation.isValid) {
          return { success: false, message: validation.message };
        }
      }

      // Start transaction
      const result = await prisma.$transaction(async tx => {
        const updates: any = {};
        const historyEntries: any[] = [];

        // Update order status
        if (newStatus && newStatus !== currentOrder.status) {
          updates.status = newStatus;
          historyEntries.push(
            createOrderHistoryEntry(
              orderId,
              staffId || null,
              'status_change',
              { status: currentOrder.status },
              { status: newStatus },
              `Order status changed from ${currentOrder.status} to ${newStatus}`,
              { notes, ...metadata }
            )
          );
        }

        // Update payment status
        if (
          newPaymentStatus &&
          newPaymentStatus !== currentOrder.paymentStatus
        ) {
          updates.paymentStatus = newPaymentStatus;
          historyEntries.push(
            createOrderHistoryEntry(
              orderId,
              staffId || null,
              'payment_update',
              { paymentStatus: currentOrder.paymentStatus },
              { paymentStatus: newPaymentStatus },
              `Payment status changed from ${currentOrder.paymentStatus} to ${newPaymentStatus}`,
              { notes, ...metadata }
            )
          );
        }

        // Update order
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: updates,
        });

        // Create order update record
        if (newStatus && newStatus !== currentOrder.status) {
          await tx.orderUpdate.create({
            data: {
              orderId,
              staffId: staffId || null,
              oldStatus: currentOrder.status,
              newStatus,
              notes,
            },
          });
        }

        // Create history entries
        if (historyEntries.length > 0) {
          await tx.orderHistory.createMany({
            data: historyEntries,
          });
        }

        return updatedOrder;
      });

      return { success: true, order: result };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, message: 'Failed to update order status' };
    }
  }

  /**
   * Update order status with email notification
   */
  static async updateOrderStatusWithEmail(
    data: OrderUpdateData
  ): Promise<{ success: boolean; message?: string; order?: any }> {
    const { orderId, newStatus, shouldSendEmail = true } = data;

    try {
      // Get order with customer details for email
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          orderServiceMappings: {
            include: {
              service: true,
              orderItems: true,
            },
          },
        },
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      // Update order status using existing method
      const result = await this.updateOrderStatus(data);

      if (!result.success) {
        return result;
      }

      // Send email notification if required
      if (shouldSendEmail && newStatus && order.customer?.email) {
        await this.sendStatusUpdateEmail(order, newStatus);
      }

      return { success: true, order: result.order };
    } catch (error) {
      console.error('Error updating order status with email:', error);
      return { success: false, message: 'Failed to update order status' };
    }
  }

  /**
   * Handle driver actions with automatic status updates
   */
  static async handleDriverAction(
    data: DriverActionData
  ): Promise<{ success: boolean; message?: string }> {
    const { orderId, driverId, action, photoUrl, notes } = data;

    try {
      let newStatus: OrderStatus;
      const shouldSendEmail = true;

      switch (action) {
        case 'start_pickup':
          newStatus = OrderStatus.PICKUP_IN_PROGRESS;
          break;
        case 'complete_pickup':
          newStatus = OrderStatus.PICKUP_COMPLETED;
          break;
        case 'fail_pickup':
          newStatus = OrderStatus.PICKUP_FAILED;
          break;
        case 'drop_off':
          newStatus = OrderStatus.RECEIVED_AT_FACILITY;
          break;
        case 'start_delivery':
          newStatus = OrderStatus.DELIVERY_IN_PROGRESS;
          break;
        case 'complete_delivery':
          newStatus = OrderStatus.DELIVERED;
          break;
        case 'fail_delivery':
          newStatus = OrderStatus.DELIVERY_FAILED;
          break;
        default:
          return { success: false, message: 'Invalid driver action' };
      }

      // Update order status
      const result = await this.updateOrderStatusWithEmail({
        orderId,
        newStatus,
        staffId: driverId,
        notes,
        metadata: { action },
        shouldSendEmail,
      });

      if (!result.success) {
        return result;
      }

      // Handle special cases
      if (action === 'drop_off') {
        // Remove from driver's pickup list
        await this.removeFromDriverList(orderId, 'pickup');
      } else if (action === 'complete_delivery' || action === 'fail_delivery') {
        // Remove from driver's delivery list
        await this.removeFromDriverList(orderId, 'delivery');
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling driver action:', error);
      return { success: false, message: 'Failed to handle driver action' };
    }
  }

  /**
   * Handle facility team actions with automatic status updates
   */
  static async handleFacilityAction(
    data: FacilityActionData
  ): Promise<{ success: boolean; message?: string }> {
    const { orderId, staffId, action, notes, metadata } = data;

    try {
      // Handle generate_invoice action separately - only send email, don't change status
      if (action === 'generate_invoice') {
        // Send invoice email without changing order status
        await this.sendInvoiceEmail(orderId);

        // Update order to mark invoice as generated
        await prisma.order.update({
          where: { id: orderId },
          data: { invoiceGenerated: true },
        });

        // Add to order history for tracking
        await this.addOrderNote(
          orderId,
          staffId,
          'Invoice generated and sent to customer',
          metadata
        );

        return { success: true };
      }

      // Handle complete_processing action separately - send custom email with payment reminder
      if (action === 'complete_processing') {
        // Send processing completion email with payment reminder
        await this.sendProcessingCompletedEmail(orderId);

        // Update order status
        const result = await this.updateOrderStatus({
          orderId,
          newStatus: OrderStatus.PROCESSING_COMPLETED,
          staffId,
          notes,
          metadata,
        });

        if (!result.success) {
          return result;
        }

        // Add to order history for tracking
        await this.addOrderNote(
          orderId,
          staffId,
          'Processing completed and customer notified',
          metadata
        );

        return { success: true };
      }

      let newStatus: OrderStatus;
      let shouldSendEmail = true;

      switch (action) {
        case 'receive_order':
          newStatus = OrderStatus.RECEIVED_AT_FACILITY;
          break;
        case 'start_processing':
          newStatus = OrderStatus.PROCESSING_STARTED;
          break;
        case 'assign_delivery_driver':
          newStatus = OrderStatus.DELIVERY_ASSIGNED;
          shouldSendEmail = false; // Don't send email for this status
          break;
        default:
          return { success: false, message: 'Invalid facility action' };
      }

      // Update order status
      const result = await this.updateOrderStatusWithEmail({
        orderId,
        newStatus,
        staffId,
        notes,
        metadata,
        shouldSendEmail,
      });

      if (!result.success) {
        return result;
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling facility action:', error);
      return { success: false, message: 'Failed to handle facility action' };
    }
  }

  /**
   * Handle operations team actions
   */
  static async handleOperationsAction(
    data: OperationsActionData
  ): Promise<{ success: boolean; message?: string }> {
    const { orderId, staffId, action, driverId, estimatedTime, notes } = data;

    try {
      let newStatus: OrderStatus;
      let shouldSendEmail = true;

      switch (action) {
        case 'confirm_order':
          newStatus = OrderStatus.CONFIRMED;
          break;
        case 'assign_pickup_driver':
          newStatus = OrderStatus.PICKUP_ASSIGNED;
          break;
        case 'assign_delivery_driver':
          newStatus = OrderStatus.DELIVERY_ASSIGNED;
          shouldSendEmail = false; // Don't send email for this status
          break;
        default:
          return { success: false, message: 'Invalid operations action' };
      }

      // Update order status
      const result = await this.updateOrderStatusWithEmail({
        orderId,
        newStatus,
        staffId,
        notes,
        metadata: { action, driverId },
        shouldSendEmail,
      });

      if (!result.success) {
        return result;
      }

      // Create driver assignment if driver is provided
      if (
        driverId &&
        (action === 'assign_pickup_driver' ||
          action === 'assign_delivery_driver')
      ) {
        await this.createDriverAssignment(
          orderId,
          driverId,
          action === 'assign_pickup_driver' ? 'pickup' : 'delivery',
          estimatedTime
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling operations action:', error);
      return { success: false, message: 'Failed to handle operations action' };
    }
  }

  /**
   * Check if order should be ready for delivery (payment check)
   */
  static async checkPaymentAndUpdateStatus(orderId: number): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) return;

      // If processing is completed and payment is done, update to ready for delivery
      if (
        order.status === OrderStatus.PROCESSING_COMPLETED &&
        order.paymentStatus === PaymentStatus.PAID
      ) {
        await this.updateOrderStatusWithEmail({
          orderId,
          newStatus: OrderStatus.READY_FOR_DELIVERY,
          shouldSendEmail: true,
        });
      }
    } catch (error) {
      console.error('Error checking payment and updating status:', error);
    }
  }

  /**
   * Get orders for specific team members
   */
  static async getOrdersForTeam(
    teamType: 'driver' | 'facility' | 'operations',
    filters?: any
  ): Promise<any[]> {
    try {
      let whereClause: any = {};

      switch (teamType) {
        case 'driver':
          whereClause = {
            OR: [
              { status: OrderStatus.PICKUP_ASSIGNED },
              { status: OrderStatus.PICKUP_IN_PROGRESS },
              { status: OrderStatus.DELIVERY_ASSIGNED },
              { status: OrderStatus.DELIVERY_IN_PROGRESS },
            ],
          };
          break;
        case 'facility':
          whereClause = {
            OR: [
              { status: OrderStatus.RECEIVED_AT_FACILITY },
              { status: OrderStatus.PROCESSING_STARTED },
              { status: OrderStatus.PROCESSING_COMPLETED },
              { status: OrderStatus.READY_FOR_DELIVERY },
            ],
          };
          break;
        case 'operations':
          whereClause = {
            OR: [
              { status: OrderStatus.ORDER_PLACED },
              { status: OrderStatus.CONFIRMED },
              { status: OrderStatus.PICKUP_FAILED },
              { status: OrderStatus.DELIVERY_FAILED },
            ],
          };
          break;
      }

      // Add additional filters
      if (filters) {
        whereClause = { ...whereClause, ...filters };
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          customer: true,
          orderServiceMappings: {
            include: {
              service: true,
            },
          },
          driverAssignments: {
            include: {
              driver: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return orders;
    } catch (error) {
      console.error('Error getting orders for team:', error);
      return [];
    }
  }

  /**
   * Send status update email based on status
   */
  private static async sendStatusUpdateEmail(
    order: any,
    status: OrderStatus
  ): Promise<void> {
    // Only send emails for specific statuses as per requirements
    const emailStatuses = new Set([
      OrderStatus.ORDER_PLACED,
      OrderStatus.CONFIRMED,
      OrderStatus.PICKUP_IN_PROGRESS,
      OrderStatus.PICKUP_COMPLETED,
      OrderStatus.PICKUP_FAILED,
      OrderStatus.PROCESSING_STARTED,
      OrderStatus.PROCESSING_COMPLETED,
      OrderStatus.READY_FOR_DELIVERY,
      OrderStatus.DELIVERY_IN_PROGRESS,
      OrderStatus.DELIVERED,
      OrderStatus.DELIVERY_FAILED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ]);

    if (!emailStatuses.has(status as any) || !order.customer?.email) {
      return;
    }

    try {
      // Use any type since email service is JavaScript and supports all OrderStatus values
      await emailService.sendStatusUpdateToCustomer(
        order,
        order.customer.email,
        `${order.customer.firstName} ${order.customer.lastName}`,
        status.toString()
      );
    } catch (error) {
      console.error('Error sending status update email:', error);
    }
  }

  /**
   * Send invoice email when order is ready for delivery
   */
  private static async sendInvoiceEmail(orderId: number): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          orderServiceMappings: {
            include: {
              service: true,
              orderItems: true,
            },
          },
        },
      });

      if (!order || !order.customer?.email) {
        return;
      }

      // Prepare invoice data - only individual order items
      const invoiceItems: Array<{
        serviceName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        notes?: string;
      }> = [];

      // Add only individual order items
      order.orderServiceMappings.forEach(mapping => {
        mapping.orderItems.forEach(item => {
          invoiceItems.push({
            serviceName: `${mapping.service.displayName} - ${item.itemName}`,
            quantity: item.quantity,
            unitPrice: item.pricePerItem,
            totalPrice: item.totalPrice,
            notes: item.notes || undefined,
          });
        });
      });

      const invoiceData = {
        totalAmount: order.invoiceTotal || 0,
        items: invoiceItems,
      };

      // Send invoice generation notification email
      await emailService.sendInvoiceGeneratedNotification(
        order,
        order.customer.email,
        `${order.customer.firstName} ${order.customer.lastName}`,
        invoiceData
      );
    } catch (error) {
      console.error('Error sending invoice email:', error);
    }
  }

  /**
   * Send processing completed email with payment reminder
   */
  private static async sendProcessingCompletedEmail(
    orderId: number
  ): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          orderServiceMappings: {
            include: {
              service: true,
              orderItems: true,
            },
          },
        },
      });

      if (!order || !order.customer?.email) {
        return;
      }

      // Prepare invoice data for the email
      const invoiceItems: Array<{
        serviceName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        notes?: string;
      }> = [];

      // Add only individual order items
      order.orderServiceMappings.forEach(mapping => {
        mapping.orderItems.forEach(item => {
          invoiceItems.push({
            serviceName: `${mapping.service.displayName} - ${item.itemName}`,
            quantity: item.quantity,
            unitPrice: item.pricePerItem,
            totalPrice: item.totalPrice,
            notes: item.notes || undefined,
          });
        });
      });

      const invoiceData = {
        totalAmount: order.invoiceTotal || 0,
        items: invoiceItems,
      };

      // Send processing completed email with payment reminder
      await emailService.sendProcessingCompletedNotification(
        order,
        order.customer.email,
        `${order.customer.firstName} ${order.customer.lastName}`,
        invoiceData
      );
    } catch (error) {
      console.error('Error sending processing completed email:', error);
    }
  }

  /**
   * Remove order from driver's list
   */
  private static async removeFromDriverList(
    orderId: number,
    assignmentType: 'pickup' | 'delivery'
  ): Promise<void> {
    try {
      await prisma.driverAssignment.updateMany({
        where: {
          orderId,
          assignmentType,
          status: DriverAssignmentStatus.IN_PROGRESS,
        },
        data: {
          status: DriverAssignmentStatus.COMPLETED,
        },
      });
    } catch (error) {
      console.error('Error removing order from driver list:', error);
    }
  }

  /**
   * Create driver assignment
   */
  private static async createDriverAssignment(
    orderId: number,
    driverId: number,
    assignmentType: 'pickup' | 'delivery',
    estimatedTime?: string
  ): Promise<void> {
    try {
      await prisma.driverAssignment.create({
        data: {
          orderId,
          driverId,
          assignmentType,
          status: DriverAssignmentStatus.ASSIGNED,
          estimatedTime: estimatedTime ? new Date(estimatedTime) : null,
        },
      });
    } catch (error) {
      console.error('Error creating driver assignment:', error);
    }
  }

  /**
   * Get comprehensive order history
   */
  static async getOrderHistory(orderId: number): Promise<OrderHistoryEntry[]> {
    try {
      const history = await prisma.orderHistory.findMany({
        where: { orderId },
        include: {
          staff: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return history;
    } catch (error) {
      console.error('Error fetching order history:', error);
      return [];
    }
  }

  /**
   * Add a note to order history
   */
  static async addOrderNote(
    orderId: number,
    staffId: number | null,
    note: string,
    metadata?: any
  ): Promise<{ success: boolean; message?: string }> {
    try {
      await prisma.orderHistory.create({
        data: createOrderHistoryEntry(
          orderId,
          staffId,
          'note_added',
          null,
          { note },
          note,
          metadata
        ),
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding order note:', error);
      return { success: false, message: 'Failed to add note' };
    }
  }

  /**
   * Track driver assignment
   */
  static async trackDriverAssignment(
    orderId: number,
    driverId: number,
    assignmentType: 'pickup' | 'delivery',
    staffId?: number
  ): Promise<{ success: boolean; message?: string }> {
    try {
      await prisma.orderHistory.create({
        data: createOrderHistoryEntry(
          orderId,
          staffId || null,
          'driver_assignment',
          null,
          { driverId, assignmentType },
          `Driver assigned for ${assignmentType}`,
          { driverId, assignmentType }
        ),
      });

      return { success: true };
    } catch (error) {
      console.error('Error tracking driver assignment:', error);
      return { success: false, message: 'Failed to track driver assignment' };
    }
  }

  /**
   * Track processing updates
   */
  static async trackProcessingUpdate(
    orderId: number,
    staffId: number,
    processingStatus: ProcessingStatus,
    notes?: string,
    metadata?: any
  ): Promise<{ success: boolean; message?: string }> {
    try {
      await prisma.orderHistory.create({
        data: createOrderHistoryEntry(
          orderId,
          staffId,
          'processing_update',
          null,
          { processingStatus },
          `Processing status updated to ${processingStatus}`,
          { notes, ...metadata }
        ),
      });

      return { success: true };
    } catch (error) {
      console.error('Error tracking processing update:', error);
      return { success: false, message: 'Failed to track processing update' };
    }
  }

  /**
   * Track issue reports
   */
  static async trackIssueReport(
    orderId: number,
    staffId: number,
    issueType: string,
    description: string,
    severity: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      await prisma.orderHistory.create({
        data: createOrderHistoryEntry(
          orderId,
          staffId,
          'issue_reported',
          null,
          { issueType, description, severity },
          `Issue reported: ${issueType} - ${description}`,
          { issueType, description, severity }
        ),
      });

      return { success: true };
    } catch (error) {
      console.error('Error tracking issue report:', error);
      return { success: false, message: 'Failed to track issue report' };
    }
  }

  /**
   * Get order timeline
   */
  static async getOrderTimeline(orderId: number): Promise<any[]> {
    try {
      const [history, updates, driverAssignments, processing] =
        await Promise.all([
          prisma.orderHistory.findMany({
            where: { orderId },
            include: { staff: { select: { firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.orderUpdate.findMany({
            where: { orderId },
            include: { staff: { select: { firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.driverAssignment.findMany({
            where: { orderId },
            include: {
              driver: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.orderProcessing.findMany({
            where: { orderId },
            include: { staff: { select: { firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

      // Combine and sort all events
      const timeline = [
        ...history.map(h => ({ ...h, type: 'history' })),
        ...updates.map(u => ({ ...u, type: 'update' })),
        ...driverAssignments.map(d => ({ ...d, type: 'driver_assignment' })),
        ...processing.map(p => ({ ...p, type: 'processing' })),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return timeline;
    } catch (error) {
      console.error('Error fetching order timeline:', error);
      return [];
    }
  }
}
