// src/app/api/auth/check-email/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if customer exists with this email
    const customer = await prisma.customer.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    return NextResponse.json({
      exists: !!customer,
      isActive: customer?.isActive || false,
    });
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { error: "Failed to check email" },
      { status: 500 }
    );
  }
}

