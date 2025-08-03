import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get admin user from database
    const adminUser = await prisma.staff.findUnique({
      where: { email: session.user.email },
      include: {
        role: true,
      },
    });

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: adminUser.id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        phone: adminUser.phone,
        role: {
          id: adminUser.role.id,
          name: adminUser.role.name,
          permissions: adminUser.role.permissions,
        },
        createdAt: adminUser.createdAt,
        updatedAt: adminUser.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error fetching admin user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
