import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import logger from '@/lib/logger';
import {
  requireAuthenticatedAdmin,
  createAdminAuthErrorResponse,
} from '@/lib/adminAuth';

// GET - List all customers with pagination and search
export async function GET(req: Request) {
  try {
    await requireAuthenticatedAdmin();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.isActive = status === 'active';
    }

    // Get customers with their addresses and order count
    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            balance: true,
            currency: true,
          },
        },
        addresses: {
          select: {
            id: true,
            label: true,
            addressLine1: true,
            city: true,
            isDefault: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.customer.count({ where });
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: unknown) {
    logger.error('Error in customers API:', error);
    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// PUT - Update customer details
export async function PUT(req: Request) {
  try {
    await requireAuthenticatedAdmin();
    const body = (await req.json()) as {
      customerId: number;
      updates: Record<string, unknown>;
    };
    const { customerId, updates } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Validate updates
    const allowedFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'isActive',
    ];
    const validUpdates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;
      }
    }

    // Check if email is being updated and if it's already taken
    if (validUpdates.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email: validUpdates.email,
          id: { not: customerId },
        },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: 'Email is already taken by another customer' },
          { status: 400 }
        );
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: validUpdates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            balance: true,
            currency: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: 'Customer updated successfully',
    });
  } catch (error: unknown) {
    logger.error('Error updating customer:', error);
    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate customer (soft delete)
export async function DELETE(req: Request) {
  try {
    await requireAuthenticatedAdmin();
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Deactivate customer
    await prisma.customer.update({
      where: { id: parseInt(customerId) },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Customer deactivated successfully',
    });
  } catch (error: unknown) {
    logger.error('Error deactivating customer:', error);
    if (
      error instanceof Error &&
      error.message === 'Admin authentication required'
    ) {
      return createAdminAuthErrorResponse();
    }
    return NextResponse.json(
      { error: 'Failed to deactivate customer' },
      { status: 500 }
    );
  }
}
