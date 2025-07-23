import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

// GET - Fetch all service-pricing mappings
export async function GET() {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook
    const mappings = await prisma.servicePricingMapping.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        service: true,
        pricingItem: {
          include: {
            category: true
          }
        }
      }
    });

    return NextResponse.json(mappings);
  } catch (error) {
    console.error('Error fetching service-pricing mappings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new service-pricing mapping
export async function POST(request: NextRequest) {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook
    const body = await request.json() as {
      serviceId: string | number;
      pricingItemId: string | number;
      isDefault?: boolean;
      sortOrder?: number;
    };
    const { serviceId, pricingItemId, isDefault, sortOrder } = body;
    
    const serviceIdNum = parseInt(serviceId.toString());
    const pricingItemIdNum = parseInt(pricingItemId.toString());

    // Validation
    if (!serviceId || !pricingItemId) {
      return NextResponse.json({ error: 'Service and pricing item are required' }, { status: 400 });
    }

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceIdNum }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 400 });
    }

    // Check if pricing item exists
    const pricingItem = await prisma.pricingItem.findUnique({
      where: { id: pricingItemIdNum }
    });

    if (!pricingItem) {
      return NextResponse.json({ error: 'Pricing item not found' }, { status: 400 });
    }

    // Check if mapping already exists
    const existingMapping = await prisma.servicePricingMapping.findUnique({
      where: {
        serviceId_pricingItemId: {
          serviceId: serviceIdNum,
          pricingItemId: pricingItemIdNum
        }
      }
    });

    if (existingMapping) {
      return NextResponse.json({ error: 'Mapping already exists' }, { status: 400 });
    }

    // If this is set as default, unset other defaults for this service
    if (isDefault) {
      await prisma.servicePricingMapping.updateMany({
        where: { 
          serviceId: serviceIdNum,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const mapping = await prisma.servicePricingMapping.create({
      data: {
        serviceId: serviceIdNum,
        pricingItemId: pricingItemIdNum,
        isDefault: isDefault || false,
        sortOrder: sortOrder || 0,
        isActive: true
      },
      include: {
        service: true,
        pricingItem: {
          include: {
            category: true
          }
        }
      }
    });

    return NextResponse.json(mapping, { status: 201 });
  } catch (error) {
    console.error('Error creating service-pricing mapping:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 