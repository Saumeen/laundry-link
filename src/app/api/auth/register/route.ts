// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { emailService } from "@/lib/emailService";

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName, phone } = await req.json();

    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: "Email, password, and first name are required" },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new customer
    const customer = await prisma.customer.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName: lastName || firstName,
        phone: phone || null,
        password: hashedPassword,
        isActive: true, // Immediately active for direct registration
        walletBalance: 0,
      },
    });

    // Send welcome email (optional for direct registration)
    try {
      await emailService.sendWelcomeEmail(
        customer.email,
        `${customer.firstName} ${customer.lastName}`
      );
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail registration if email fails
    }

    // Return customer data (excluding password)
    const customerData = {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      walletBalance: customer.walletBalance,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
    };

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      customer: customerData,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
