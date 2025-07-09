import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SERVICE_TYPES } from "@/lib/pricing";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { invoiceItems: true },
    });

    if (!order || !order.invoiceItems?.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const html = generateInvoiceHTML(order);
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}

function generateInvoiceHTML(order: any) {
  const serviceLabel = (value: string) => SERVICE_TYPES.find(s => s.value === value)?.label || value;
  const subtotal = order.invoiceItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

  return `<!DOCTYPE html>
<html><head><title>Invoice - ${order.orderNumber}</title>
<style>
body { font-family: Arial; margin: 20px; }
.header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
.company-name { font-size: 28px; font-weight: bold; color: #3b82f6; }
.invoice-title { font-size: 20px; color: #666; }
.info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
.section-title { font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
.info-row { margin-bottom: 5px; }
.items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
.items-table th { background: #3b82f6; color: white; }
.total-section { margin-top: 30px; text-align: right; background: #f8f9fa; padding: 20px; }
.final-total { font-size: 20px; font-weight: bold; color: #3b82f6; border-top: 2px solid #3b82f6; padding-top: 10px; }
.print-btn { background: #3b82f6; color: white; border: none; padding: 10px 20px; margin: 20px; cursor: pointer; }
@media print { .print-btn { display: none; } }
</style></head><body>
<button class="print-btn" onclick="window.print()">🖨️ Print as PDF</button>
<div class="header">
  <div class="company-name">Laundry Link</div>
  <div class="invoice-title">INVOICE #${order.orderNumber}</div>
</div>
<div class="info-section">
  <div><div class="section-title">Customer Information</div>
    <div class="info-row"><strong>Name:</strong> ${order.customerFirstName} ${order.customerLastName}</div>
    <div class="info-row"><strong>Email:</strong> ${order.customerEmail}</div>
    <div class="info-row"><strong>Phone:</strong> ${order.customerPhone}</div>
    <div class="info-row"><strong>Address:</strong> ${order.customerAddress}</div>
  </div>
  <div><div class="section-title">Order Information</div>
    <div class="info-row"><strong>Order:</strong> ${order.orderNumber}</div>
    <div class="info-row"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
    <div class="info-row"><strong>Status:</strong> ${order.status}</div>
  </div>
</div>
<table class="items-table">
  <thead><tr><th>Item</th><th>Service</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
  <tbody>
    ${order.invoiceItems.map((item: any) => `<tr>
      <td>${item.itemType}</td><td>${serviceLabel(item.serviceType)}</td>
      <td>${item.quantity}</td><td>${item.pricePerItem.toFixed(3)} BD</td>
      <td>${item.totalPrice.toFixed(3)} BD</td></tr>`).join('')}
  </tbody>
</table>
<div class="total-section">
  <div><strong>Subtotal: ${subtotal.toFixed(3)} BD</strong></div>
  ${order.minimumOrderApplied ? '<div style="color: #f59e0b;"><strong>Minimum Fee: 4.000 BD</strong></div>' : ''}
  <div class="final-total">TOTAL: ${order.invoiceTotal.toFixed(3)} BD</div>
</div>
</body></html>`;
}

