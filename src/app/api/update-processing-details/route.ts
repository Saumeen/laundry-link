import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, numberOfPieces, weight, processingNotes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Update the processing details
    const updatedOrder = await prisma.order.update({
      where: {
        id: parseInt(orderId),
      },
      data: {
        numberOfPieces: numberOfPieces,
        weight: weight,
        processingNotes: processingNotes,
      },
    });

    return NextResponse.json({
      message: "Processing details updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating processing details:", error);
    return NextResponse.json(
      { error: "Failed to update processing details" },
      { status: 500 }
    );
  }
}
