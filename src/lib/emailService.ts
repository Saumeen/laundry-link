import * as sgMail from '@sendgrid/mail';
import prisma from './prisma';
import { OrderStatus } from '@prisma/client';
import logger from '@/lib/logger';

// Helper function to convert UTC time to Bahrain time (AST - UTC+3)
function convertToBahrainTime(date: Date): string {
  return date.toLocaleString('en-GB', {
    timeZone: 'Asia/Bahrain',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper function to convert UTC date to Bahrain date
function convertToBahrainDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Bahrain',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Type definitions
interface ServiceInfo {
  id: number;
  displayName: string;
  name: string;
}

interface OrderDetails {
  services: number[];
  pickupDateTime: Date;
  deliveryDateTime: Date;
  address: string;
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  services: string[];
}

interface InvoiceData {
  totalAmount: number;
  items: Array<{
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }>;
}

interface StatusMessage {
  subject: string;
  message: string;
  color: string;
  icon: string;
}

interface OrderWithRelations {
  id: number;
  orderNumber: string;
  customerId: number;
  pickupStartTime: Date;
  pickupEndTime: Date;
  deliveryStartTime: Date;
  deliveryEndTime: Date;
  specialInstructions?: string | null;
  customerAddress: string;
  paymentStatus?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  orderServiceMappings: Array<{
    id: number;
    quantity: number;
    price: number;
    service: {
      id: number;
      displayName: string;
      name: string;
    };
    orderItems: Array<{
      id: number;
      itemName: string;
      quantity: number;
      pricePerItem: number;
      totalPrice: number;
      notes?: string | null;
    }>;
  }>;
}

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export default {
  /**
   * Get service names from database with proper error handling
   */
  async getServiceNames(serviceIds: number[]): Promise<Record<number, string>> {
    try {
      // Convert service IDs to integers to ensure proper type handling
      const numericServiceIds = serviceIds.map(id => parseInt(id.toString()));

      const services = await prisma.service.findMany({
        where: {
          id: {
            in: numericServiceIds,
          },
        },
        select: {
          id: true,
          displayName: true,
          name: true,
        },
      });

      // Create mapping of service ID to display name
      const serviceMap: Record<number, string> = {};
      services.forEach(service => {
        serviceMap[service.id] = service.displayName || service.name;
      });

      return serviceMap;
    } catch (error) {
      logger.error('Error fetching service names:', error);
      // Fallback to hardcoded mapping
      return {
        1: 'Wash (by weight)',
        2: 'Wash & Iron (by piece)',
        3: 'Dry Clean (by piece)',
        4: 'Duvet & Bulky Items (by piece)',
        5: 'Carpet Cleaning (by square meter)',
      };
    }
  },

  /**
   * Send order confirmation to customer
   */
  async sendOrderConfirmationToCustomer(
    order: OrderWithRelations,
    customerEmail: string,
    customerName: string,
    orderDetails: OrderDetails
  ): Promise<boolean> {
    try {
      // Get proper service names
      const serviceNames = await this.getServiceNames(orderDetails.services);

      const servicesHtml = orderDetails.services
        .map(
          serviceId =>
            `<li>${serviceNames[serviceId] || `Service ${serviceId}`}</li>`
        )
        .join('');

      const hasSpecialItems = orderDetails.services.some(service =>
        ['duvet_bulky', 'carpet', 'dry_clean', '4', '5', '3'].includes(
          service.toString()
        )
      );

      const msg = {
        to: customerEmail,
        from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
        subject: `Order Confirmation - #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">Laundry Link</h1>
              <h2 style="color: #374151; margin: 10px 0;">Order Confirmation</h2>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
            <p style="font-size: 16px; color: #374151;">Thank you for your order! Here are the details:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Order Details</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Customer Name:</strong> ${customerName}</p>
              <p><strong>Pickup Date/Time:</strong> ${convertToBahrainTime(orderDetails.pickupDateTime)}</p>
              <p><strong>Delivery Date/Time:</strong> ${convertToBahrainTime(orderDetails.deliveryDateTime)}</p>
              
              <h4 style="color: #1f2937; margin-bottom: 10px;">Services Selected:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                ${servicesHtml}
              </ul>
              
              <p><strong>Collection Address:</strong> ${orderDetails.address}</p>
              ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
            </div>
            
            ${
              hasSpecialItems
                ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;"><strong>Please Note:</strong> Duvet, carpet, and dry clean items usually take 72 hours of processing, so the delivery timing might be different from your selected time.</p>
            </div>
            `
                : ''
            }
            
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #0277bd;"><strong>Important:</strong> The invoice and service value will be available to view once the items are sorted in our facility.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; color: #374151;">Need help? Contact us on WhatsApp:</p>
              <a href="https://wa.me/97333440841" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📱 +973 3344 0841
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">Thank you for choosing Laundry Link!</p>
            </div>
          </div>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Order confirmation email sent to customer: ${customerEmail}`
      );
      return true;
    } catch (error) {
      logger.error('Error sending order confirmation email:', error);
      return false;
    }
  },

  /**
   * Send order update notification to customer
   */
  async sendOrderUpdateToCustomer(
    order: OrderWithRelations,
    customerEmail: string,
    customerName: string,
    orderDetails: OrderDetails,
    changes: string[]
  ): Promise<boolean> {
    try {
      // Get proper service names
      const serviceNames = await this.getServiceNames(orderDetails.services);

      const servicesHtml = orderDetails.services
        .map(
          serviceId =>
            `<li>${serviceNames[serviceId] || `Service ${serviceId}`}</li>`
        )
        .join('');

      const changesHtml = changes.map(change => `<li>${change}</li>`).join('');

      const msg = {
        to: customerEmail,
        from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
        subject: `Order Updated - #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">Laundry Link</h1>
              <h2 style="color: #374151; margin: 10px 0;">Order Updated</h2>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
            <p style="font-size: 16px; color: #374151;">Your order has been updated by our team. Here are the updated details:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Updated Order Details</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Customer Name:</strong> ${customerName}</p>
              <p><strong>Pickup Date/Time:</strong> ${convertToBahrainTime(orderDetails.pickupDateTime)}</p>
              <p><strong>Delivery Date/Time:</strong> ${convertToBahrainTime(orderDetails.deliveryDateTime)}</p>
              
              <h4 style="color: #1f2937; margin-bottom: 10px;">Services Selected:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                ${servicesHtml}
              </ul>
              
              <p><strong>Collection Address:</strong> ${orderDetails.address}</p>
              ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
            </div>

            ${
              changes.length > 0
                ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h4 style="margin: 0; color: #92400e;">📝 Changes Made:</h4>
              <ul style="margin: 10px 0 0 0; color: #92400e; padding-left: 20px;">
                ${changesHtml}
              </ul>
            </div>
            `
                : ''
            }
            
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #0277bd;"><strong>Important:</strong> If you have any questions about these changes, please contact us immediately.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; color: #374151;">Need help? Contact us on WhatsApp:</p>
              <a href="https://wa.me/97333440841" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📱 +973 3344 0841
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">Thank you for choosing Laundry Link!</p>
            </div>
          </div>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Order update email sent to customer: ${customerEmail}`);
      return true;
    } catch (error) {
      logger.error('Error sending order update email:', error);
      return false;
    }
  },

  /**
   * Send order creation email to customer
   */
  async sendOrderCreationToCustomer(
    order: OrderWithRelations,
    customerEmail: string,
    customerName: string,
    orderDetails: OrderDetails
  ): Promise<boolean> {
    try {
      // Get proper service names
      const serviceNames = await this.getServiceNames(orderDetails.services);

      const servicesHtml = orderDetails.services
        .map(
          serviceId =>
            `<li>${serviceNames[serviceId] || `Service ${serviceId}`}</li>`
        )
        .join('');

      const hasSpecialItems = orderDetails.services.some(service =>
        ['duvet_bulky', 'carpet', 'dry_clean', '4', '5', '3'].includes(
          service.toString()
        )
      );

      const msg = {
        to: customerEmail,
        from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
        subject: `Order Received - #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">Laundry Link</h1>
              <h2 style="color: #374151; margin: 10px 0;">Order Received</h2>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
            <p style="font-size: 16px; color: #374151;">Thank you for placing your order with Laundry Link! We have received your order and it is currently being reviewed by our team.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Order Details</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Customer Name:</strong> ${customerName}</p>
              <p><strong>Pickup Date/Time:</strong> ${convertToBahrainTime(orderDetails.pickupDateTime)}</p>
              <p><strong>Delivery Date/Time:</strong> ${convertToBahrainTime(orderDetails.deliveryDateTime)}</p>
              
              <h4 style="color: #1f2937; margin-bottom: 10px;">Services Selected:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                ${servicesHtml}
              </ul>
              
              <p><strong>Collection Address:</strong> ${orderDetails.address}</p>
              ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
            </div>
            
            ${
              hasSpecialItems
                ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;"><strong>Please Note:</strong> Duvet, carpet, and dry clean items usually take 72 hours of processing, so the delivery timing might be different from your selected time.</p>
            </div>
            `
                : ''
            }
            
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #0277bd;"><strong>Next Steps:</strong> Our team will review your order and send you a confirmation email once it's approved. You will also receive updates on your order status throughout the process.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; color: #374151;">Need help? Contact us on WhatsApp:</p>
              <a href="https://wa.me/97333440841" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📱 +973 3344 0841
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">Thank you for choosing Laundry Link!</p>
            </div>
          </div>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Order creation email sent to customer: ${customerEmail}`);
      return true;
    } catch (error) {
      logger.error('Error sending order creation email:', error);
      return false;
    }
  },



  /**
   * Send welcome email with login credentials
   */
  async sendWelcomeEmailWithCredentials(
    customer: any,
    customerName: string,
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
        subject: 'Welcome to Laundry Link - Your Account Details',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">Welcome to Laundry Link!</h1>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
            <p style="font-size: 16px; color: #374151;">We've automatically created an account for you to track your orders and manage your laundry services.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Your Login Information</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${password}</code></p>
            </div>
            
            <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0277bd; margin-top: 0;">What you can do in your account:</h3>
              <ul style="color: #0277bd; margin: 0; padding-left: 20px;">
                <li>View all your orders and their status</li>
                <li>Track order progress in real-time</li>
                <li>Manage your saved addresses</li>
                <li>Check your wallet balance</li>
                <li>View payment history</li>
                <li>Update your profile information</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/registerlogin" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Access Your Dashboard
              </a>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;"><strong>Security Tip:</strong> We recommend changing your password after your first login for better security.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">If you have any questions, feel free to contact us!</p>
            </div>
          </div>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Welcome email sent to customer: ${email}`);
      return true;
    } catch (error) {
      logger.error('Error sending welcome email:', error);
      return false;
    }
  },

  /**
   * Send new order notification to admin
   */
  async sendOrderNotificationToAdmin(
    order: OrderWithRelations,
    customerDetails: CustomerDetails
  ): Promise<boolean> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@laundrylink.net';

      const msg = {
        to: adminEmail,
        from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
        subject: `New Order Received - #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">New Order Alert</h2>
            <p>A new order has been placed on Laundry Link.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Customer:</strong> ${customerDetails.name}</p>
              <p><strong>Email:</strong> ${customerDetails.email}</p>
              <p><strong>Phone:</strong> ${customerDetails.phone}</p>
              <p><strong>Address:</strong> ${customerDetails.address}</p>
              <p><strong>Services:</strong> ${customerDetails.services.join(', ')}</p>
              <p><strong>Pickup Time:</strong> ${convertToBahrainTime(new Date(order.pickupStartTime))}</p>
              <p><strong>Delivery Time:</strong> ${convertToBahrainTime(new Date(order.deliveryStartTime))}</p>
              ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
            </div>
            
            <p>Please process this order in the admin panel.</p>
          </div>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Order notification email sent to admin: ${adminEmail}`);
      return true;
    } catch (error) {
      logger.error('Error sending admin notification email:', error);
      return false;
    }
  },

  /**
   * Send comprehensive status update to customer
   */
  async sendStatusUpdateToCustomer(
    order: OrderWithRelations,
    customerEmail: string,
    customerName: string,
    newStatus: string
  ): Promise<boolean> {
    try {
      const statusMessages: Record<string, StatusMessage> = {
        ORDER_PLACED: {
          subject: 'Order Confirmation',
          message:
            "We have received your order and it's being prepared for pickup.",
          color: '#3b82f6',
          icon: '📋',
        },
        CONFIRMED: {
          subject: 'Order Confirmed',
          message: 'Your order has been confirmed and is being processed.',
          color: '#10b981',
          icon: '✅',
        },
        PICKUP_ASSIGNED: {
          subject: 'Pickup Driver Assigned',
          message: 'A driver has been assigned to collect your items.',
          color: '#8b5cf6',
          icon: '🚚',
        },
        PICKUP_IN_PROGRESS: {
          subject: 'Driver on the way for Pickup',
          message:
            'Your driver is on the way to collect your laundry. Please have your items ready.',
          color: '#f59e0b',
          icon: '🔄',
        },
        PICKUP_COMPLETED: {
          subject: 'Items Picked Up Successfully',
          message:
            'Your items have been collected and are on their way to our facility.',
          color: '#06b6d4',
          icon: '📦',
        },
        PICKUP_FAILED: {
          subject: 'Pickup Failed',
          message:
            "We were unable to collect your items. We'll reschedule and contact you shortly.",
          color: '#ef4444',
          icon: '❌',
        },
        RECEIVED_AT_FACILITY: {
          subject: 'Items Received at Facility',
          message:
            'Your items have been received at our processing facility and are being sorted.',
          color: '#6366f1',
          icon: '🏭',
        },
        PROCESSING_STARTED: {
          subject: 'Processing Started',
          message:
            'Your items are now being processed. Our facility team is sorting and organizing your laundry items.',
          color: '#f59e0b',
          icon: '⚙️',
        },
        PROCESSING_COMPLETED: {
          subject: 'Processing Completed',
          message:
            'Your items have been processed and are ready for quality check.',
          color: '#10b981',
          icon: '✅',
        },
        DELIVERY_ASSIGNED: {
          subject: 'Delivery Driver Assigned',
          message: 'A driver has been assigned to deliver your items.',
          color: '#8b5cf6',
          icon: '🚚',
        },
        DELIVERY_IN_PROGRESS: {
          subject: 'Driver on the way for Delivery',
          message:
            'Your driver is on the way to deliver your items. Please be available to receive them.',
          color: '#f59e0b',
          icon: '🔄',
        },
        DELIVERED: {
          subject: 'Order Delivered Successfully',
          message:
            'Your order has been delivered successfully! Thank you for choosing Laundry Link.',
          color: '#059669',
          icon: '🎉',
        },
        DELIVERY_FAILED: {
          subject: 'Delivery Failed',
          message:
            "We were unable to deliver your items. We'll reschedule and contact you shortly.",
          color: '#ef4444',
          icon: '❌',
        },
        CANCELLED: {
          subject: 'Order Cancelled',
          message:
            'Your order has been cancelled. If you have any questions, please contact us.',
          color: '#6b7280',
          icon: '🚫',
        },
      };

      const statusInfo = statusMessages[newStatus] ;

      if (!statusInfo) {
        return false;
      }

      const msg = {
        to: customerEmail,
        from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
        subject: `${statusInfo.icon} ${statusInfo.subject} - Order #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">Laundry Link</h1>
            </div>
            
            <div style="background-color: ${statusInfo.color}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">${statusInfo.icon} ${statusInfo.subject}</h2>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
            <p style="font-size: 16px; color: #374151;">${statusInfo.message}</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Current Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${newStatus.replace(/_/g, ' ')}</span></p>
              <p><strong>Updated:</strong> ${convertToBahrainTime(new Date())}</p>
            </div>
            
            ${
              newStatus === 'READY_FOR_DELIVERY'
                ? `
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0277bd;">
              <h4 style="margin: 0; color: #0277bd;">💳 Payment Information</h4>
              <p style="margin: 10px 0 0 0; color: #0277bd;">
                Your invoice has been generated. Please check your dashboard to view the invoice and arrange payment if not already paid.
              </p>
            </div>
            `
                : ''
            }
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/customer/dashboard" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Order Details
              </a>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; color: #374151;">Questions? Contact us on WhatsApp:</p>
              <a href="https://wa.me/97333440841" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📱 +973 3344 0841
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">Thank you for choosing Laundry Link!</p>
            </div>
          </div>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Status update email sent to customer: ${customerEmail} for status: ${newStatus}`
      );
      return true;
    } catch (error) {
      logger.error('Error sending status update email:', error);
      return false;
    }
  },

  /**
   * Send delivery confirmation with invoice to customer
   */
  async sendDeliveryConfirmationWithInvoice(
    order: OrderWithRelations,
    customerEmail: string,
    customerName: string,
    invoiceData: InvoiceData
  ): Promise<boolean> {
    try {
      // Get order items from the order
      const orderItems = order.orderServiceMappings.flatMap(mapping =>
        mapping.orderItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          totalPrice: item.totalPrice,
          notes: item.notes,
        }))
      );

      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      const msg = {
        to: customerEmail,
        from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
        subject: `✅ Order Delivered - Invoice #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">Laundry Link</h1>
              <h2 style="color: #374151; margin: 10px 0;">Order Delivered Successfully!</h2>
            </div>
            
            <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">✅ Delivery Complete</h2>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your order has been delivered successfully</p>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
            <p style="font-size: 16px; color: #374151;">Great news! Your order has been delivered successfully. Please find your invoice attached below.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">📋 Order Summary</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Delivery Date:</strong> ${convertToBahrainDate(new Date())}</p>
              <p><strong>Total Amount:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">${totalAmount.toFixed(3)} BD</span></p>
            </div>

            ${
              orderItems.length > 0
                ? `
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">🧾 Invoice Details</h3>
              <div style="max-height: 300px; overflow-y: auto;">
                ${orderItems
                  .map(
                    item => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                    <div>
                      <p style="margin: 0; font-weight: 600; color: #374151;">${item.itemName || 'Item'}</p>
                      ${item.notes ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">${item.notes}</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Qty: ${item.quantity || 0}</p>
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">@${item.pricePerItem?.toFixed(3) || '0.000'} BD</p>
                      <p style="margin: 0; font-weight: 600; color: #374151;">${item.totalPrice?.toFixed(3) || '0.000'} BD</p>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 2px solid #3b82f6; margin-top: 15px;">
                <span style="font-size: 18px; font-weight: bold; color: #1f2937;">Total</span>
                <span style="font-size: 20px; font-weight: bold; color: #059669;">${totalAmount.toFixed(3)} BD</span>
              </div>
            </div>
            `
                : ''
            }
            
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0277bd;">
              <h4 style="margin: 0; color: #0277bd;">💳 Payment Information</h4>
              <p style="margin: 10px 0 0 0; color: #0277bd;">
                Payment has been processed successfully. You can view your complete order history and payment details in your account dashboard.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/customer/dashboard" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Order History
              </a>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; color: #374151;">Need help? Contact us on WhatsApp:</p>
              <a href="https://wa.me/97333440841" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📱 +973 3344 0841
              </a>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h4 style="margin: 0; color: #92400e;">⭐ Rate Your Experience</h4>
              <p style="margin: 10px 0 0 0; color: #92400e;">
                We hope you're satisfied with our service! Your feedback helps us improve and serve you better.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">Thank you for choosing Laundry Link!</p>
            </div>
          </div>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Delivery confirmation email with invoice sent to customer: ${customerEmail}`
      );
      return true;
    } catch (error) {
      logger.error('Error sending delivery confirmation email:', error);
      return false;
    }
  },

  /**
   * Send invoice generation notification to customer
   */
  async sendInvoiceGeneratedNotification(
    order: OrderWithRelations,
    customerEmail: string,
    customerName: string,
    invoiceData: InvoiceData,
    pdfBuffer?: ArrayBuffer
  ): Promise<boolean> {
    try {
      // Get order items from the order
      const orderItems = order.orderServiceMappings.flatMap(mapping =>
        mapping.orderItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          totalPrice: item.totalPrice,
          notes: item.notes,
        }))
      );

      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      const isPaymentCompleted = order.paymentStatus === 'PAID';
      
      const msg: any = {
        to: customerEmail,
        from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
        subject: isPaymentCompleted 
          ? `✅ Payment Confirmed - Order #${order.orderNumber}` 
          : `🧾 Invoice Generated - Order #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/images/toplogo.png" 
                   alt="Laundry Link" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: ${isPaymentCompleted ? '#059669' : '#3b82f6'}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">${isPaymentCompleted ? '✅ Payment Confirmed' : '🧾 Invoice Generated'}</h2>
              <p style="margin: 10px 0 0 0; font-size: 16px;">${isPaymentCompleted ? 'Your payment has been received and confirmed' : 'Your invoice has been prepared and is ready for review'}</p>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
            <p style="font-size: 16px; color: #374151;">${isPaymentCompleted 
              ? 'Excellent! Your payment has been successfully processed and confirmed. Your order is now being prepared for processing.' 
              : 'Great news! Your invoice has been generated and is ready for review. Please take a moment to review the details below and ensure your account balance is maintained.'}</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">📋 Order Summary</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Invoice Date:</strong> ${convertToBahrainDate(new Date())}</p>
              <p><strong>Total Amount:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">${totalAmount.toFixed(3)} BD</span></p>
            </div>

            ${
              orderItems.length > 0
                ? `
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">🧾 Invoice Details</h3>
              <div style="max-height: 300px; overflow-y: auto;">
                ${orderItems
                  .map(
                    item => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                    <div>
                      <p style="margin: 0; font-weight: 600; color: #374151;">${item.itemName || 'Item'}</p>
                      ${item.notes ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">${item.notes}</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Qty: ${item.quantity || 0}</p>
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">@${item.pricePerItem?.toFixed(3) || '0.000'} BD</p>
                      <p style="margin: 0; font-weight: 600; color: #374151;">${item.totalPrice?.toFixed(3) || '0.000'} BD</p>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 2px solid #3b82f6; margin-top: 15px;">
                <span style="font-size: 18px; font-weight: bold; color: #1f2937;">Total</span>
                <span style="font-size: 20px; font-weight: bold; color: #059669;">${totalAmount.toFixed(3)} BD</span>
              </div>
            </div>
            `
                : ''
            }
            
            ${!isPaymentCompleted ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h4 style="margin: 0; color: #92400e;">💰 Account Balance Reminder</h4>
              <p style="margin: 10px 0 0 0; color: #92400e;">
                Please ensure your account balance is maintained to avoid any delays in service. You can add funds to your account through our customer portal.
              </p>
            </div>
            ` : `
            <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <h4 style="margin: 0; color: #065f46;">✅ Payment Confirmed</h4>
              <p style="margin: 10px 0 0 0; color: #065f46;">
                Your payment of ${totalAmount.toFixed(3)} BD has been successfully processed. Your order is now confirmed and will be processed according to your selected service timeline.
              </p>
            </div>
            `}
            
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0277bd;">
              <h4 style="margin: 0; color: #0277bd;">📱 Next Steps</h4>
              <p style="margin: 10px 0 0 0; color: #0277bd;">
                ${isPaymentCompleted 
                  ? 'Your order has been confirmed and is now in our processing queue. We\'ll notify you at each stage of the process, from pickup to delivery. You can track your order status in your account dashboard.'
                  : 'Your order is being processed. We\'ll notify you once it\'s ready for delivery. You can track your order status in your account dashboard.'}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/customer/dashboard" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Order Details
              </a>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; color: #374151;">Need help? Contact us on WhatsApp:</p>
              <a href="https://wa.me/97333440841" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📱 +973 3344 0841
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">Thank you for choosing Laundry Link!</p>
            </div>
          </div>
        `,
      };

      // Add PDF attachment if provided
      if (pdfBuffer) {
        msg.attachments = [
          {
            content: Buffer.from(pdfBuffer).toString('base64'),
            filename: `invoice-${order.orderNumber}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ];
      }

      await sgMail.send(msg);
      logger.info(`Invoice generation notification sent to customer: ${customerEmail}`
      );
      return true;
    } catch (error) {
      logger.error('Error sending invoice generation notification:', error);
      return false;
    }
  },

  /**
   * Send processing completed notification to customer
   */
  async sendProcessingCompletedNotification(
    order: OrderWithRelations,
    customerEmail: string,
    customerName: string,
    invoiceData: InvoiceData
  ): Promise<boolean> {
    try {
      // Get order items from the order
      const orderItems = order.orderServiceMappings.flatMap(mapping =>
        mapping.orderItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          pricePerItem: item.pricePerItem,
          totalPrice: item.totalPrice,
          notes: item.notes,
        }))
      );

      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      const msg = {
        to: customerEmail,
        from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
        subject: `✅ Processing Completed - Order #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/images/toplogo.png" 
                   alt="Laundry Link" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">✅ Processing Completed</h2>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your order has been processed successfully and is ready for delivery</p>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
            <p style="font-size: 16px; color: #374151;">Great news! Your order has been processed successfully and is now ready for delivery. Please ensure your account balance is maintained to receive your delivery.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">📋 Order Summary</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Processing Completed:</strong> ${convertToBahrainDate(new Date())}</p>
              <p><strong>Total Amount:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">${totalAmount.toFixed(3)} BD</span></p>
            </div>

            ${
              orderItems.length > 0
                ? `
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">🧾 Order Details</h3>
              <div style="max-height: 300px; overflow-y: auto;">
                ${orderItems
                  .map(
                    item => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                    <div>
                      <p style="margin: 0; font-weight: 600; color: #374151;">${item.itemName || 'Item'}</p>
                      ${item.notes ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">${item.notes}</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Qty: ${item.quantity || 0}</p>
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">@${item.pricePerItem?.toFixed(3) || '0.000'} BD</p>
                      <p style="margin: 0; font-weight: 600; color: #374151;">${item.totalPrice?.toFixed(3) || '0.000'} BD</p>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 2px solid #3b82f6; margin-top: 15px;">
                <span style="font-size: 18px; font-weight: bold; color: #1f2937;">Total</span>
                <span style="font-size: 20px; font-weight: bold; color: #059669;">${totalAmount.toFixed(3)} BD</span>
              </div>
            </div>
            `
                : ''
            }
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h4 style="margin: 0; color: #92400e;">💰 Payment Required for Delivery</h4>
              <p style="margin: 10px 0 0 0; color: #92400e;">
                <strong>Please add payment to your account vault to receive your delivery.</strong> Your order total is ${totalAmount.toFixed(3)} BD. You can add funds through your customer portal.
              </p>
            </div>
            
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0277bd;">
              <h4 style="margin: 0; color: #0277bd;">📱 Next Steps</h4>
              <p style="margin: 10px 0 0 0; color: #0277bd;">
                Once payment is confirmed, we'll assign a driver for delivery. You'll receive a notification when your order is out for delivery.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/customer/dashboard" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Order Details
              </a>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; color: #374151;">Need help? Contact us on WhatsApp:</p>
              <a href="https://wa.me/97333440841" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📱 +973 3344 0841
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">Thank you for choosing Laundry Link!</p>
            </div>
          </div>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Processing completed notification sent to customer: ${customerEmail}`
      );
      return true;
    } catch (error) {
      logger.error('Error sending processing completed notification:', error);
      return false;
    }
  },

  /**
   * Send welcome email (legacy function for compatibility)
   */
  async sendWelcomeEmail(
    customer: any,
    customerName: string
  ): Promise<boolean> {
    // This is kept for backward compatibility
    // New orders should use sendWelcomeEmailWithCredentials instead
    return this.sendWelcomeEmailWithCredentials(
      customer,
      customerName,
      customer.email,
      'Please contact support for password'
    );
  },

  /**
   * Send order payment completion notification to customer
   */
  async sendOrderPaymentCompletionNotification(
    order: OrderWithRelations,
    customerEmail: string,
    customerName: string,
    paymentAmount: number,
    paymentMethod: string,
    transactionId: string,
    pdfBuffer?: ArrayBuffer
  ): Promise<boolean> {
    try {
      const msg: any = {
        to: customerEmail,
        from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
        subject: `✅ Payment Completed - Order #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/images/toplogo.png" 
                   alt="Laundry Link" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">✅ Payment Completed Successfully</h2>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your order payment has been processed and confirmed</p>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
            <p style="font-size: 16px; color: #374151;">Great news! Your payment for order #${order.orderNumber} has been completed successfully. Your order is now being processed and you'll receive updates as it progresses.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">📋 Payment Details</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Payment Amount:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">${paymentAmount.toFixed(3)} BD</span></p>
              <p><strong>Payment Method:</strong> ${paymentMethod}</p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Payment Date:</strong> ${convertToBahrainDate(new Date())}</p>
            </div>
            
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0277bd;">
              <h4 style="margin: 0; color: #0277bd;">📱 Next Steps</h4>
              <p style="margin: 10px 0 0 0; color: #0277bd;">
                Your order is now being processed. You'll receive notifications as your order progresses through our system. You can track your order status in your account dashboard.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/customer/dashboard" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Order Details
              </a>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; color: #374151;">Need help? Contact us on WhatsApp:</p>
              <a href="https://wa.me/97333440841" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📱 +973 3344 0841
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">Thank you for choosing Laundry Link!</p>
            </div>
          </div>
        `,
      };

      // Add PDF attachment if provided
      if (pdfBuffer) {
        msg.attachments = [
          {
            content: Buffer.from(pdfBuffer).toString('base64'),
            filename: `invoice-${order.orderNumber}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ];
      }

      await sgMail.send(msg);
      logger.info(`Order payment completion notification sent to customer: ${customerEmail} for order: ${order.orderNumber}${pdfBuffer ? ' with PDF attachment' : ''}`);
      return true;
    } catch (error) {
      logger.error('Error sending order payment completion notification:', error);
      return false;
    }
  },

  /**
   * Send wallet top-up completion notification to customer
   */
  async sendWalletTopUpCompletionNotification(
    customerEmail: string,
    customerName: string,
    topUpAmount: number,
    newBalance: number,
    paymentMethod: string,
    transactionId: string,
    rewardAmount?: number
  ): Promise<boolean> {
    try {
      const totalAdded = topUpAmount + (rewardAmount || 0);
      const hasReward = rewardAmount && rewardAmount > 0;

      const msg = {
        to: customerEmail,
        from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
        subject: `✅ Wallet Top-Up Completed - ${topUpAmount.toFixed(3)} BD Added`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/images/toplogo.png" 
                   alt="Laundry Link" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">✅ Wallet Top-Up Completed</h2>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your wallet has been successfully topped up</p>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
            <p style="font-size: 16px; color: #374151;">Great news! Your wallet top-up has been completed successfully. Your account balance has been updated and you're ready to use our services.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">💰 Transaction Details</h3>
              <p><strong>Top-Up Amount:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">${topUpAmount.toFixed(3)} BD</span></p>
              ${hasReward ? `<p><strong>Bonus Reward:</strong> <span style="color: #f59e0b; font-weight: bold; font-size: 16px;">+${rewardAmount!.toFixed(3)} BD</span></p>` : ''}
              <p><strong>Total Added:</strong> <span style="color: #059669; font-weight: bold; font-size: 20px;">${totalAdded.toFixed(3)} BD</span></p>
              <p><strong>New Balance:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">${newBalance.toFixed(3)} BD</span></p>
              <p><strong>Payment Method:</strong> ${paymentMethod}</p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Transaction Date:</strong> ${convertToBahrainDate(new Date())}</p>
            </div>
            
            ${hasReward ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h4 style="margin: 0; color: #92400e;">🎁 Bonus Reward Applied!</h4>
              <p style="margin: 10px 0 0 0; color: #92400e;">
                Congratulations! You've received a bonus reward of ${rewardAmount!.toFixed(3)} BD for your top-up. This has been automatically added to your wallet balance.
              </p>
            </div>
            ` : ''}
            
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0277bd;">
              <h4 style="margin: 0; color: #0277bd;">📱 What's Next?</h4>
              <p style="margin: 10px 0 0 0; color: #0277bd;">
                Your wallet is now ready to use! You can place new orders, pay for existing orders, or use your balance for any of our services. Your balance will be automatically deducted when you make purchases.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/customer/wallet" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Wallet Balance
              </a>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; color: #374151;">Need help? Contact us on WhatsApp:</p>
              <a href="https://wa.me/97333440841" style="display: inline-block; background-color: #25d366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📱 +973 3344 0841
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">Thank you for choosing Laundry Link!</p>
            </div>
          </div>
        `,
      };

      await sgMail.send(msg);
      logger.info(`Wallet top-up completion notification sent to customer: ${customerEmail} for amount: ${topUpAmount} BD`);
      return true;
    } catch (error) {
      logger.error('Error sending wallet top-up completion notification:', error);
      return false;
    }
  },
};
