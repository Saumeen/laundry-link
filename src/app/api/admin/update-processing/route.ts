// src/app/api/admin/update-processing/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { orderId, totalPieces, totalWeight, processingNotes } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: parseInt(orderId),
      },
      data: {
        totalPieces: totalPieces || 0,
        totalWeight: totalWeight || 0,
        processingNotes: processingNotes || null,
      },
    });

    return NextResponse.json({
      message: "Processing data updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating processing data:", error);
    return NextResponse.json(
      { error: "Failed to update processing data" },
      { status: 500 }
    );
  }
}

