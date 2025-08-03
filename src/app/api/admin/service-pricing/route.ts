import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
import logger from '@/lib/logger';
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    const serviceIdInt = parseInt(serviceId);
    if (isNaN(serviceIdInt)) {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }

    // Get pricing items mapped to this service
    const servicePricingMappings = await prisma.servicePricingMapping.findMany({
      where: {
        serviceId: serviceIdInt,
        isActive: true,
      },
      include: {
        pricingItem: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { sortOrder: 'asc' },
        { pricingItem: { sortOrder: 'asc' } },
      ],
    });

    // Group by category for better organization
    const groupedPricing = servicePricingMappings.reduce(
      (acc, mapping) => {
        const category = mapping.pricingItem.category;
        const categoryKey = category.id.toString();

        if (!acc[categoryKey]) {
          acc[categoryKey] = {
            id: category.id,
            name: category.name,
            displayName: category.displayName,
            items: [],
          };
        }

        acc[categoryKey].items.push({
          id: mapping.pricingItem.id,
          name: mapping.pricingItem.name,
          displayName: mapping.pricingItem.displayName,
          price: mapping.pricingItem.price,
          isDefault: mapping.isDefault,
          sortOrder: mapping.sortOrder,
        });

        return acc;
      },
      {} as Record<string, any>
    );

    // Convert to array and sort categories
    const result = Object.values(groupedPricing).sort(
      (a: { sortOrder: number }, b: { sortOrder: number }) => {
        // Sort by category sort order if available, otherwise by display name
        return (
          (a.sortOrder || 0) - (b.sortOrder || 0) ||
          a.displayName.localeCompare(b.displayName)
        );
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        serviceId: serviceIdInt,
        categories: result,
      },
    });
  } catch (error) {
    logger.error('Error fetching service pricing:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to fetch service pricing' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const body = (await request.json()) as {
      serviceId: string | number;
      pricingItemId: string | number;
      isDefault?: boolean;
      sortOrder?: number;
    };
    const { serviceId, pricingItemId, isDefault = false, sortOrder = 0 } = body;

    if (!serviceId || !pricingItemId) {
      return NextResponse.json(
        { error: 'Service ID and pricing item ID are required' },
        { status: 400 }
      );
    }

    // If this is being set as default, unset other defaults for this service
    if (isDefault) {
      await prisma.servicePricingMapping.updateMany({
        where: {
          serviceId: parseInt(serviceId.toString()),
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create or update the mapping
    const mapping = await prisma.servicePricingMapping.upsert({
      where: {
        serviceId_pricingItemId: {
          serviceId: parseInt(serviceId.toString()),
          pricingItemId: parseInt(pricingItemId.toString()),
        },
      },
      update: {
        isDefault,
        sortOrder,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        serviceId: parseInt(serviceId.toString()),
        pricingItemId: parseInt(pricingItemId.toString()),
        isDefault,
        sortOrder,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: mapping,
    });
  } catch (error) {
    logger.error('Error creating service pricing mapping:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to create service pricing mapping' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Require admin authentication
    await requireAuthenticatedAdmin();

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const pricingItemId = searchParams.get('pricingItemId');

    if (!serviceId || !pricingItemId) {
      return NextResponse.json(
        { error: 'Service ID and pricing item ID are required' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.servicePricingMapping.updateMany({
      where: {
        serviceId: parseInt(serviceId),
        pricingItemId: parseInt(pricingItemId),
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Service pricing mapping deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting service pricing mapping:', error);

    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }

    return NextResponse.json(
      { error: 'Failed to delete service pricing mapping' },
      { status: 500 }
    );
  }
}
