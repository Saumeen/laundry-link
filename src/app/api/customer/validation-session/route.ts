import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Try to get customer info from various sources
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    // Check if email is provided in query params
    if (email) {
      const customer = await prisma.customer.findUnique({
        where: { email: email }
      });
      
      if (customer) {
        return NextResponse.json({
          success: true,
          customer: {
            id: customer.id,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone
          }
        });
      }
    }

    // Check cookies for session info
    const cookies = req.headers.get('cookie');
    if (cookies) {
      const cookieArray = cookies.split(';');
      for (let cookie of cookieArray) {
        const [name, value] = cookie.trim().split('=');
        if (name && (name.includes('customer') || name.includes('user') || name.includes('auth')) && value) {
          try {
            const decoded = decodeURIComponent(value);
            const parsed = JSON.parse(decoded);
            if (parsed && (parsed.email || parsed.customerEmail)) {
              const customer = await prisma.customer.findUnique({
                where: { email: parsed.email || parsed.customerEmail }
              });
              
              if (customer) {
                return NextResponse.json({
                  success: true,
                  customer: {
                    id: customer.id,
                    email: customer.email,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    phone: customer.phone
                  }
                });
              }
            }
          } catch (e) {
            // Continue checking other cookies
          }
        }
      }
    }

    return NextResponse.json({
      success: false,
      message: "No valid session found"
    });

  } catch (error) {
    console.error("Error validating session:", error);
    return NextResponse.json({
      success: false,
      message: "Session validation failed"
    }, { status: 500 });
  }
}

