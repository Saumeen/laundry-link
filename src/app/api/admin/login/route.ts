import { NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/adminAuth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const adminUser = await authenticateAdmin(email, password);

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Invalid credentials or account inactive' },
        { status: 401 }
      );
    }

    // Create session data (you might want to use JWT or session management)
    const sessionData = {
      id: adminUser.id,
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      role: adminUser.role,
      isActive: adminUser.isActive,
      lastLoginAt: adminUser.lastLoginAt,
    };

    return NextResponse.json({
      message: 'Login successful',
      user: sessionData,
      role: adminUser.role,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
