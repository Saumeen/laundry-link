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
   * Send new order notification to admin and operation teams
   */
  async sendOrderNotificationToAdminAndOperations(order, customerDetails) {
    const adminEmail = process.env.ADMIN_EMAIL || 'psaumeen@gmail.com';
    const operationEmail = process.env.OPERATION_EMAIL || 'psaumeen@gmail.com';
    
    // Get service names for better display
    const serviceNames = {
      wash: "Wash (by weight)",
      wash_iron: "Wash & Iron (by piece)", 
      dry_clean: "Dry Clean (by piece)",
      duvet_bulky: "Duvet & Bulky Items (by piece)",
      carpet: "Carpet Cleaning (by square meter)"
    };

    const servicesHtml = customerDetails.services.map(serviceId => 
      `<li>${serviceNames[serviceId] || serviceId}</li>`
    ).join('');

    const msg = {
      to: [adminEmail, operationEmail],
      from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
      subject: `NEW ORDER ALERT - #${order.orderNumber} - Action Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px;">🚨 NEW ORDER RECEIVED</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Order #${order.orderNumber}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0; color: #92400e;">⚠️ IMMEDIATE ACTION REQUIRED</h3>
            <p style="margin: 10px 0 0 0; color: #92400e;">
              <strong>Please assign a pickup driver and verify all order details.</strong>
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
              📋 ORDER DETAILS
            </h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <h4 style="color: #374151; margin-bottom: 10px;">👤 Customer Information</h4>
                <p><strong>Order Number:</strong> <span style="color: #dc2626; font-weight: bold; font-size: 16px;">${order.orderNumber}</span></p>
                <p><strong>Name:</strong> ${customerDetails.name}</p>
                <p><strong>Phone:</strong> ${customerDetails.phone}</p>
                <p><strong>Email:</strong> ${customerDetails.email}</p>
              </div>
              
              <div>
                <h4 style="color: #374151; margin-bottom: 10px;">📍 Pickup & Delivery</h4>
                <p><strong>Pickup Date/Time:</strong> ${new Date(order.pickupTime).toLocaleString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p><strong>Delivery Date/Time:</strong> ${new Date(order.deliveryTime).toLocaleString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p><strong>Address:</strong> ${customerDetails.address}</p>
              </div>
            </div>
            
            <div>
              <h4 style="color: #374151; margin-bottom: 10px;">🧺 Services Requested</h4>
              <ul style="margin: 0; padding-left: 20px;">
                ${servicesHtml}
              </ul>
            </div>
            
            ${order.specialInstructions ? `
            <div style="margin-top: 15px;">
              <h4 style="color: #374151; margin-bottom: 10px;">📝 Special Instructions</h4>
              <p style="background-color: #e0f2fe; padding: 10px; border-radius: 5px; margin: 0; border-left: 4px solid #0277bd;">
                ${order.specialInstructions}
              </p>
            </div>
            ` : ''}
          </div>
          
          <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0277bd;">
            <h3 style="color: #0277bd; margin-top: 0;">🎯 REQUIRED ACTIONS</h3>
            <ol style="color: #0277bd; margin: 0; padding-left: 20px;">
              <li><strong>Assign Pickup Driver:</strong> Select an available driver for pickup</li>
              <li><strong>Verify Order Details:</strong> Review all information for accuracy</li>
              <li><strong>Confirm Address:</strong> Ensure pickup location is accessible</li>
              <li><strong>Check Special Instructions:</strong> Review any customer requirements</li>
              <li><strong>Prepare for Pickup:</strong> Ensure driver has all necessary information</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/admin/orders/${order.id}" 
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              🔗 VIEW ORDER IN ADMIN PANEL
            </a>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Order created at:</strong> ${new Date().toLocaleString('en-GB')}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated notification from Laundry Link Order Management System
            </p>
          </div>
        </div>
      `
    };
    
    try {
      await sgMail.send(msg);
      console.log(`Order notification email sent to admin and operations: ${adminEmail}, ${operationEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending admin and operations notification email:', error);
      return false;
    }
  },

  /**
   * Send driver pickup notification to customer
   */
  async sendDriverPickupNotification(order, customerEmail, customerName, driverName) {
    const msg = {
      to: customerEmail,
      from: process.env.EMAIL_FROM || 'orders@laundrylink.net',
      subject: `🚚 Driver on the way - Order #${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin: 0;">Laundry Link</h1>
          </div>
          
          <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 24px;">🚚 Driver is on the way!</h2>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Please have your laundry ready</p>
          </div>
          
          <p style="font-size: 16px; color: #374151;">Dear ${customerName},</p>
          <p style="font-size: 16px; color: #374151;">Great news! Your driver <strong>${driverName}</strong> is on the way to collect your laundry. Please ensure your items are ready for pickup.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">📋 Pickup Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Driver:</strong> ${driverName}</p>
            <p><strong>Pickup Address:</strong> ${order.customerAddress}</p>
            <p><strong>Estimated Pickup Time:</strong> ${new Date(order.pickupTime).toLocaleString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h4 style="margin: 0; color: #92400e;">📦 Please prepare:</h4>
            <ul style="color: #92400e; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Have your laundry items ready and accessible</li>
              <li>Ensure someone is available to hand over the items</li>
              <li>Keep your phone nearby in case the driver needs to contact you</li>
              <li>Have any special instructions ready to share with the driver</li>
            </ul>
          </div>
          
          <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0277bd;">
            <h4 style="margin: 0; color: #0277bd;">⏰ What to expect:</h4>
            <ul style="color: #0277bd; margin: 10px 0 0 0; padding-left: 20px;">
              <li>The driver will arrive at your specified pickup time</li>
              <li>They will collect your laundry items</li>
              <li>You'll receive a confirmation once items are collected</li>
              <li>Your items will be processed and delivered as scheduled</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://laundrylink.net'}/customer/dashboard" 
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Track Your Order
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
      console.log(`Driver pickup notification email sent to customer: ${customerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending driver pickup notification email:', error);
      return false;
    }
  },

  /**
   * Send delivery confirmation with invoice to customer
   */
  async sendDeliveryConfirmationWithInvoice(order, customerEmail, customerName, invoiceData) {
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
            <p><strong>Delivery Date:</strong> ${new Date().toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            })}</p>
            <p><strong>Total Amount:</strong> <span style="color: #059669; font-weight: bold; font-size: 18px;">${invoiceData?.totalAmount?.toFixed(3) || '0.000'} BD</span></p>
          </div>

          ${invoiceData?.items && invoiceData.items.length > 0 ? `
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">🧾 Invoice Details</h3>
            <div style="max-height: 300px; overflow-y: auto;">
              ${invoiceData.items.map(item => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                  <div>
                    <p style="margin: 0; font-weight: 600; color: #374151;">${item.serviceName || 'Service'}</p>
                    ${item.notes ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">${item.notes}</p>` : ''}
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Qty: ${item.quantity || 0}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">@${item.unitPrice?.toFixed(3) || '0.000'} BD</p>
                    <p style="margin: 0; font-weight: 600; color: #374151;">${item.totalPrice?.toFixed(3) || '0.000'} BD</p>
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 2px solid #3b82f6; margin-top: 15px;">
              <span style="font-size: 18px; font-weight: bold; color: #1f2937;">Total</span>
              <span style="font-size: 20px; font-weight: bold; color: #059669;">${invoiceData?.totalAmount?.toFixed(3) || '0.000'} BD</span>
            </div>
          </div>
          ` : ''}
          
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
      `
    };
    
    try {
      await sgMail.send(msg);
      console.log(`Delivery confirmation email with invoice sent to customer: ${customerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending delivery confirmation email:', error);
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

