import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      displayName?: string;
      description?: string;
      pricingType?: string;
      pricingUnit?: string;
      price?: string | number;
      unit?: string;
      turnaround?: string;
      category?: string;
      features?: string[];
      sortOrder?: number;
      isActive?: boolean;
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
      isActive,
    } = body;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if new name conflicts with existing service (excluding current service)
    if (name && name !== existingService.name) {
      const nameConflict = await prisma.service.findUnique({
        where: { name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Service name already exists' },
          { status: 400 }
        );
      }
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: name,
        displayName: displayName,
        description: description,
        pricingType: pricingType,
        pricingUnit: pricingUnit,
        price:
          price !== undefined
            ? parseFloat(price.toString())
            : existingService.price,
        unit: unit,
        turnaround: turnaround,
        category: category,
        features: features,
        sortOrder:
          sortOrder !== undefined ? sortOrder : existingService.sortOrder,
        isActive: isActive !== undefined ? isActive : existingService.isActive,
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: {
        orderServiceMappings: true,
        servicePricingMappings: true,
      },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if service is being used in orders
    if (existingService.orderServiceMappings.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete service that is being used in orders',
        },
        { status: 400 }
      );
    }

    // Delete service pricing mappings first
    if (existingService.servicePricingMappings.length > 0) {
      await prisma.servicePricingMapping.deleteMany({
        where: { serviceId: id },
      });
    }

    // Delete the service
    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
