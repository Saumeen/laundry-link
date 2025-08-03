import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

// GET - Fetch all services
export async function GET() {
  try {
    // Require SUPER_ADMIN role
    await requireAdminRole('SUPER_ADMIN');

    const services = await prisma.service.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    logger.error('Error fetching services:', error);
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new service
export async function POST(request: NextRequest) {
  try {
    // Require SUPER_ADMIN role
    await requireAdminRole('SUPER_ADMIN');

    const body = (await request.json()) as {
      name: string;
      displayName: string;
      description: string;
      pricingType: string;
      pricingUnit: string;
      price: string | number;
      unit: string;
      turnaround: string;
      category: string;
      features?: string[];
      sortOrder?: number;
    };
    const {
      name,
      displayName,
      description,
      pricingType,
      pricingUnit,
      price,
      unit,
      turnaround,
      category,
      features,
      sortOrder,
    } = body;

    // Validation
    if (
      !name ||
      !displayName ||
      !description ||
      !pricingType ||
      !pricingUnit ||
      !price ||
      !unit ||
      !turnaround ||
      !category
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if service name already exists
    const existingService = await prisma.service.findUnique({
      where: { name },
    });

    if (existingService) {
      return NextResponse.json(
        { error: 'Service name already exists' },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        displayName,
        description,
        pricingType,
        pricingUnit,
        price: parseFloat(price.toString()),
        unit,
        turnaround,
        category,
        features: features || [],
        sortOrder: sortOrder || 0,
        isActive: true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    logger.error('Error creating service:', error);
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
