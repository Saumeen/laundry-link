import prisma from './prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { createOrderHistoryEntry, validateStatusChange } from './orderStatus';

export interface OrderUpdateData {
  orderId: number;
  staffId?: number;
  newStatus?: OrderStatus;
  newPaymentStatus?: PaymentStatus;
  notes?: string;
  metadata?: any;
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

export class OrderTrackingService {
  /**
   * Update order status with comprehensive tracking
   */
  static async updateOrderStatus(data: OrderUpdateData): Promise<{ success: boolean; message?: string; order?: any }> {
    const { orderId, staffId, newStatus, newPaymentStatus, notes, metadata } = data;

    try {
      // Get current order
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderUpdates: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
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
      const result = await prisma.$transaction(async (tx) => {
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
        if (newPaymentStatus && newPaymentStatus !== currentOrder.paymentStatus) {
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
          data: updates
        });

        // Create order update record
        if (newStatus && newStatus !== currentOrder.status) {
          await tx.orderUpdate.create({
            data: {
              orderId,
              staffId: staffId || null,
              oldStatus: currentOrder.status,
              newStatus,
              notes
            }
          });
        }

        // Create history entries
        if (historyEntries.length > 0) {
          await tx.orderHistory.createMany({
            data: historyEntries
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
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
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
        )
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
        )
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
    processingStatus: string,
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
        )
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
        )
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
      const [history, updates, driverAssignments, processing] = await Promise.all([
        prisma.orderHistory.findMany({
          where: { orderId },
          include: { staff: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.orderUpdate.findMany({
          where: { orderId },
          include: { staff: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.driverAssignment.findMany({
          where: { orderId },
          include: { driver: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.orderProcessing.findMany({
          where: { orderId },
          include: { staff: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      // Combine and sort all events
      const timeline = [
        ...history.map(h => ({ ...h, type: 'history' })),
        ...updates.map(u => ({ ...u, type: 'update' })),
        ...driverAssignments.map(d => ({ ...d, type: 'driver_assignment' })),
        ...processing.map(p => ({ ...p, type: 'processing' }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return timeline;
    } catch (error) {
      console.error('Error fetching order timeline:', error);
      return [];
    }
  }
} 