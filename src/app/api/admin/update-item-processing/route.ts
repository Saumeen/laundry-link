// src/app/api/admin/update-item-processing/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthenticatedAdmin, createAdminAuthErrorResponse } from "@/lib/adminAuth";

interface UpdateItemProcessingRequest {
  orderId: number;
  processingItemDetailId: number;
  processedQuantity?: number;
  status: string;
  processingNotes?: string;
  qualityScore?: number;
}

export async function POST(req: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const body = await req.json() as UpdateItemProcessingRequest;
    const { 
      orderId, 
      processingItemDetailId, 
      processedQuantity, 
      status, 
      processingNotes, 
      qualityScore 
    } = body;

    if (!orderId || !processingItemDetailId || !status) {
      return NextResponse.json(
        { error: "Order ID, processing item detail ID, and status are required" },
        { status: 400 }
      );
    }

    // Verify that the order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Update the processing item detail
    const updatedProcessingItemDetail = await prisma.processingItemDetail.update({
      where: { id: processingItemDetailId },
      data: {
        processedQuantity: processedQuantity || 0,
        status,
        processingNotes: processingNotes || null,
        qualityScore: qualityScore || null,
      },
      include: {
        orderItem: {
          include: {
            orderServiceMapping: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Item processing updated successfully",
      processingItemDetail: updatedProcessingItemDetail,
    });
  } catch (error) {
    console.error("Error updating item processing:", error);
    
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return createAdminAuthErrorResponse();
    }
    
    return NextResponse.json(
      { error: "Failed to update item processing" },
      { status: 500 }
    );
  }
} 