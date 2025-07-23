import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch all services
export async function GET() {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook
    const services = await prisma.service.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new service
export async function POST(request: NextRequest) {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook
    const body = await request.json() as {
      name: string;
      displayName: string;
      description: string;
      pricingType: 'BY_WEIGHT' | 'BY_PIECE';
      pricingUnit: 'KG' | 'PIECE';
      price: string | number;
      unit: string;
      turnaround: string;
      category: string;
      features?: string[];
      sortOrder?: number;
    };
    const { name, displayName, description, pricingType, pricingUnit, price, unit, turnaround, category, features, sortOrder } = body;

    // Validation
    if (!name || !displayName || !description || !pricingType || !pricingUnit || !price || !unit || !turnaround || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if service name already exists
    const existingService = await prisma.service.findUnique({
      where: { name }
    });

    if (existingService) {
      return NextResponse.json({ error: 'Service name already exists' }, { status: 400 });
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
        isActive: true
      }
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 