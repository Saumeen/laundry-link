import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

// PUT - Update service-pricing mapping
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid mapping ID' },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      serviceId?: string | number;
      pricingItemId?: string | number;
      isDefault?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    };
    const { serviceId, pricingItemId, isDefault, sortOrder, isActive } = body;

    // Check if mapping exists
    const existingMapping = await prisma.servicePricingMapping.findUnique({
      where: { id },
    });

    if (!existingMapping) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }

    // If serviceId or pricingItemId is being changed, check for conflicts
    if (
      (serviceId &&
        parseInt(serviceId.toString()) !== existingMapping.serviceId) ||
      (pricingItemId &&
        parseInt(pricingItemId.toString()) !== existingMapping.pricingItemId)
    ) {
      const newServiceId = serviceId
        ? parseInt(serviceId.toString())
        : existingMapping.serviceId;
      const newPricingItemId = pricingItemId
        ? parseInt(pricingItemId.toString())
        : existingMapping.pricingItemId;

      const conflictMapping = await prisma.servicePricingMapping.findUnique({
        where: {
          serviceId_pricingItemId: {
            serviceId: newServiceId,
            pricingItemId: newPricingItemId,
          },
        },
      });

      if (conflictMapping && conflictMapping.id !== id) {
        return NextResponse.json(
          { error: 'Mapping already exists' },
          { status: 400 }
        );
      }
    }

    // If this is set as default, unset other defaults for this service
    if (isDefault && !existingMapping.isDefault) {
      const targetServiceId = serviceId
        ? parseInt(serviceId.toString())
        : existingMapping.serviceId;
      await prisma.servicePricingMapping.updateMany({
        where: {
          serviceId: targetServiceId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const updatedMapping = await prisma.servicePricingMapping.update({
      where: { id },
      data: {
        serviceId: serviceId
          ? parseInt(serviceId.toString())
          : existingMapping.serviceId,
        pricingItemId: pricingItemId
          ? parseInt(pricingItemId.toString())
          : existingMapping.pricingItemId,
        isDefault:
          isDefault !== undefined ? isDefault : existingMapping.isDefault,
        sortOrder:
          sortOrder !== undefined ? sortOrder : existingMapping.sortOrder,
        isActive: isActive !== undefined ? isActive : existingMapping.isActive,
      },
      include: {
        service: true,
        pricingItem: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMapping);
  } catch (error) {
    logger.error('Error updating service-pricing mapping:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete service-pricing mapping
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Note: Authentication will be handled by middleware or useAdminAuth hook

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid mapping ID' },
        { status: 400 }
      );
    }

    // Check if mapping exists
    const existingMapping = await prisma.servicePricingMapping.findUnique({
      where: { id },
    });

    if (!existingMapping) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }

    // Delete the mapping
    await prisma.servicePricingMapping.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Mapping deleted successfully' });
  } catch (error) {
    logger.error('Error deleting service-pricing mapping:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
