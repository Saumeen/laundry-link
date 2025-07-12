import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SERVICE_TYPES } from "@/lib/pricing";

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    // Fetch order with invoice items
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        invoiceItems: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!order.invoiceItems || order.invoiceItems.length === 0) {
      return NextResponse.json(
        { error: "No invoice items found for this order" },
        { status: 400 }
      );
    }

    // Generate HTML invoice that can be printed as PDF
    const html = generatePrintableInvoiceHTML(order);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${order.orderNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}

function generatePrintableInvoiceHTML(order: any) {
  const serviceTypeLabel = (value: string) => {
    return SERVICE_TYPES.find(s => s.value === value)?.label || value;
  };

  const subtotal = order.invoiceItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice - ${order.orderNumber}</title>
        <style>
            @media print {
                body { margin: 0; }
                .no-print { display: none; }
            }
            
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #333; 
                line-height: 1.4;
            }
            
            .invoice-container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white;
                padding: 30px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            
            .header { 
                text-align: center; 
                margin-bottom: 40px; 
                border-bottom: 3px solid #3b82f6; 
                padding-bottom: 20px; 
            }
            
            .company-name { 
                font-size: 32px; 
                font-weight: bold; 
                color: #3b82f6; 
                margin-bottom: 5px; 
            }
            
            .invoice-title { 
                font-size: 24px; 
                color: #666; 
                margin-bottom: 10px;
            }
            
            .invoice-number {
                font-size: 16px;
                color: #888;
            }
            
            .info-section { 
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 40px; 
            }
            
            .customer-info, .order-info { 
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
            }
            
            .section-title { 
                font-size: 18px; 
                font-weight: bold; 
                margin-bottom: 15px; 
                color: #3b82f6; 
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            
            .info-row { 
                margin-bottom: 8px; 
                display: flex;
            }
            
            .label { 
                font-weight: bold; 
                min-width: 100px;
                color: #555;
            }
            
            .value {
                flex: 1;
            }
            
            .items-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 30px 0; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .items-table th, .items-table td { 
                border: 1px solid #ddd; 
                padding: 12px 8px; 
                text-align: left; 
            }
            
            .items-table th { 
                background-color: #3b82f6; 
                color: white;
                font-weight: bold; 
                text-align: center;
            }
            
            .items-table tr:nth-child(even) { 
                background-color: #f8f9fa; 
            }
            
            .items-table td:nth-child(3),
            .items-table td:nth-child(4),
            .items-table td:nth-child(5) {
                text-align: center;
            }
            
            .total-section { 
                margin-top: 40px; 
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
            }
            
            .total-row { 
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px; 
                padding: 5px 0;
            }
            
            .subtotal-row {
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
                margin-bottom: 10px;
            }
            
            .minimum-fee-row {
                color: #f59e0b;
                font-weight: bold;
            }
            
            .final-total { 
                font-size: 24px; 
                font-weight: bold; 
                color: #3b82f6; 
                border-top: 3px solid #3b82f6; 
                padding-top: 15px;
                margin-top: 15px;
            }
            
            .special-instructions {
                margin-top: 40px;
                background: #fff3cd;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #ffc107;
            }
            
            .footer { 
                margin-top: 50px; 
                text-align: center; 
                color: #666; 
                font-size: 14px; 
                border-top: 1px solid #ddd;
                padding-top: 20px;
            }
            
            .print-button {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                margin: 20px 0;
                display: block;
                margin-left: auto;
                margin-right: auto;
            }
            
            .print-button:hover {
                background: #2563eb;
            }
        </style>
        <script>
            function printInvoice() {
                window.print();
            }
        </script>
    </head>
    <body>
        <div class="invoice-container">
            <button class="print-button no-print" onclick="printInvoice()">🖨️ Print Invoice as PDF</button>
            
            <div class="header">
                <div class="company-name">Laundry Link</div>
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">Invoice #${order.orderNumber}</div>
            </div>

            <div class="info-section">
                <div class="customer-info">
                    <div class="section-title">👤 Customer Information</div>
                    <div class="info-row">
                        <span class="label">Name:</span>
                        <span class="value">${order.customerFirstName} ${order.customerLastName}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Email:</span>
                        <span class="value">${order.customerEmail}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Phone:</span>
                        <span class="value">${order.customerPhone}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Address:</span>
                        <span class="value">${order.customerAddress}</span>
                    </div>
                </div>
                
                <div class="order-info">
                    <div class="section-title">📋 Order Information</div>
                    <div class="info-row">
                        <span class="label">Order #:</span>
                        <span class="value">${order.orderNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Date:</span>
                        <span class="value">${new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Pickup:</span>
                        <span class="value">${new Date(order.pickupTime).toLocaleDateString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Status:</span>
                        <span class="value">${order.status}</span>
                    </div>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item Type</th>
                        <th>Service</th>
                        <th>Qty</th>
                        <th>Price/Item</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.invoiceItems.map((item: any) => `
                        <tr>
                            <td>${item.itemType}</td>
                            <td>${serviceTypeLabel(item.serviceType)}</td>
                            <td>${item.quantity}</td>
                            <td>${item.pricePerItem.toFixed(3)} BD</td>
                            <td><strong>${item.totalPrice.toFixed(3)} BD</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-row subtotal-row">
                    <span><strong>Subtotal:</strong></span>
                    <span><strong>${subtotal.toFixed(3)} BD</strong></span>
                </div>
                ${order.minimumOrderApplied ? `
                    <div class="total-row minimum-fee-row">
                        <span>⚠️ Minimum Order Fee Applied:</span>
                        <span>4.000 BD</span>
                    </div>
                ` : ''}
                <div class="total-row final-total">
                    <span>💰 TOTAL AMOUNT:</span>
                    <span>${order.invoiceTotal.toFixed(3)} BD</span>
                </div>
            </div>

            ${order.specialInstructions ? `
                <div class="special-instructions">
                    <div class="section-title">📝 Special Instructions</div>
                    <p>${order.specialInstructions}</p>
                </div>
            ` : ''}

            <div class="footer">
                <p><strong>Thank you for choosing Laundry Link!</strong></p>
                <p>📧 support@laundrylink.net | 📱 For any questions about your order</p>
                <p><em>This invoice was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</em></p>
            </div>
        </div>
    </body>
    </html>
  `;
}
