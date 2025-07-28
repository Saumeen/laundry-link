import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get a specific configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid configuration ID' },
        { status: 400 }
      );
    }

    const config = await prisma.configuration.findUnique({
      where: { id }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

// PUT - Update a configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid configuration ID' },
        { status: 400 }
      );
    }

    const body = await request.json() as {
      key: string;
      value: string;
      category?: string;
      description?: string;
    };

    if (!body.key || !body.value) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Check if configuration exists
    const existingConfig = await prisma.configuration.findUnique({
      where: { id }
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Update the configuration
    const updatedConfig = await prisma.configuration.update({
      where: { id },
      data: {
        value: body.value,
        category: body.category || existingConfig.category,
        description: body.description,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'Configuration updated successfully',
      config: updatedConfig 
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

// PATCH - Partially update a configuration (e.g., toggle active status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid configuration ID' },
        { status: 400 }
      );
    }

    const body = await request.json() as {
      value?: string;
      category?: string;
      description?: string;
      isActive?: boolean;
    };

    // Check if configuration exists
    const existingConfig = await prisma.configuration.findUnique({
      where: { id }
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Update the configuration
    const updatedConfig = await prisma.configuration.update({
      where: { id },
      data: {
        ...(body.value !== undefined && { value: body.value }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'Configuration updated successfully',
      config: updatedConfig 
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid configuration ID' },
        { status: 400 }
      );
    }

    // Check if configuration exists
    const existingConfig = await prisma.configuration.findUnique({
      where: { id }
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Delete the configuration
    await prisma.configuration.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Configuration deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    );
  }
} 