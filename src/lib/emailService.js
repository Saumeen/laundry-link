import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const emailService = {
  /**
   * Send order confirmation to customer
   */
  async sendOrderConfirmationToCustomer(order, customerEmail, customerName, orderDetails) {
    const serviceNames = {
      wash: "Wash (by weight)",
      wash_iron: "Wash & Iron (by piece)", 
      dry_clean: "Dry Clean (by piece)",
      duvet_bulky: "Duvet & Bulky Items (by piece)",
      carpet: "Carpet Cleaning (by square meter)"
    };

    const servicesHtml = orderDetails.services.map(serviceId => 
      `<li>${serviceNames[serviceId] || serviceId}</li>`
    ).join('');

    const hasSpecialItems = orderDetails.services.some(service => 
      ['duvet_bulky', 'carpet', 'dry_clean'].includes(service)
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
            <p><strong>Pickup Date/Time:</strong> ${orderDetails.pickupDateTime.toLocaleString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p><strong>Delivery Date/Time:</strong> ${orderDetails.deliveryDateTime.toLocaleString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            
            <h4 style="color: #1f2937; margin-bottom: 10px;">Services Selected:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${servicesHtml}
            </ul>
            
            <p><strong>Collection Address:</strong> ${orderDetails.address}</p>
            ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
          </div>
          
          ${hasSpecialItems ? `
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;"><strong>Please Note:</strong> Duvet, carpet, and dry clean items usually take 72 hours of processing, so the delivery timing might be different from your selected time.</p>
          </div>
          ` : ''}
          
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
      `
    };
    
    try {
      await sgMail.send(msg);
      console.log(`Order confirmation email sent to customer: ${customerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return false;
    }
  },

  /**
   * Send welcome email with login credentials
   */
  async sendWelcomeEmailWithCredentials(customer, customerName, email, password) {
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
      `
    };
    
    try {
      await sgMail.send(msg);
      console.log(`Welcome email sent to customer: ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  },

  /**
   * Send new order notification to admin
   */
  async sendOrderNotificationToAdmin(order, customerDetails) {
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
            <p><strong>Pickup Time:</strong> ${new Date(order.pickupTime).toLocaleString()}</p>
            <p><strong>Delivery Time:</strong> ${new Date(order.deliveryTime).toLocaleString()}</p>
            ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
          </div>
          
          <p>Please process this order in the admin panel.</p>
        </div>
      `
    };
    
    try {
      await sgMail.send(msg);
      console.log(`Order notification email sent to admin: ${adminEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending admin notification email:', error);
      return false;
    }
  },

  /**
   * Send status update to customer
   */
  async sendStatusUpdateToCustomer(order, customerEmail, customerName, newStatus) {
    const statusMessages = {
      pending: {
        subject: "Order Received",
        message: "We have received your order and it's being prepared for pickup.",
        color: "#f59e0b"
      },
      picked_up: {
        subject: "Items Picked Up",
        message: "Your items have been collected and are on their way to our facility.",
        color: "#3b82f6"
      },
      in_progress: {
        subject: "Order In Progress", 
        message: "Your items are being processed at our facility. We'll update you once they're ready.",
        color: "#8b5cf6"
      },
      ready: {
        subject: "Order Ready for Delivery",
        message: "Great news! Your items are clean and ready for delivery.",
        color: "#10b981"
      },
      out_for_delivery: {
        subject: "Out for Delivery",
        message: "Your order is out for delivery and will arrive soon.",
        color: "#06b6d4"
      },
      delivered: {
        subject: "Order Delivered",
        message: "Your order has been successfully delivered. Thank you for choosing Laundry Link!",
        color: "#059669"
      }
    };

    const statusInfo = statusMessages[newStatus] || {
      subject: "Order Status Update",
      message: `Your order status has been updated to: ${newStatus}`,
      color: "#6b7280"
    };

    const msg = {
      to: customerEmail,
      from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
      subject: `${statusInfo.subject} - Order #${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin: 0;">Laundry Link</h1>
          </div>
          
          <div style="background-color: ${statusInfo.color}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 24px;">${statusInfo.subject}</h2>
          </div>
          
          <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
          <p style="font-size: 16px; color: #374151;">${statusInfo.message}</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Current Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${newStatus.replace(/_/g, ' ').toUpperCase()}</span></p>
          </div>
          
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
      `
    };
    
    try {
      await sgMail.send(msg);
      console.log(`Status update email sent to customer: ${customerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending status update email:', error);
      return false;
    }
  },

  /**
   * Send welcome email (legacy function for compatibility)
   */
  async sendWelcomeEmail(customer, customerName) {
    // This is kept for backward compatibility
    // New orders should use sendWelcomeEmailWithCredentials instead
    return this.sendWelcomeEmailWithCredentials(customer, customerName, customer.email, 'Please contact support for password');
  }
};

