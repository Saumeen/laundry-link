import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get admin user to check role
    const adminUser = await prisma.staff.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    });

    if (
      !adminUser ||
      !['SUPER_ADMIN', 'OPERATION_MANAGER'].includes(adminUser.role.name)
    ) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const drivers = await prisma.staff.findMany({
      where: {
        role: { name: 'DRIVER' },
        isActive: true,
      },
      include: {
        role: true,
        driverAssignments: {
          include: {
            order: {
              include: {
                customer: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
