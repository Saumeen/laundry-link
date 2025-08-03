import { NextResponse } from 'next/server';
import { requireAuthenticatedAdmin } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    // Get authenticated admin from session
    const admin = await requireAuthenticatedAdmin();

    const body = await req.json();
    const { assignmentId, photoUrl, photoType, notes } = body as {
      assignmentId: number;
      photoUrl: string;
      photoType: string;
      notes?: string;
    };

    if (!assignmentId || !photoUrl || !photoType) {
      return NextResponse.json(
        { error: 'Assignment ID, photo URL, and photo type are required' },
        { status: 400 }
      );
    }

    // Verify the assignment belongs to the authenticated driver
    const assignment = await prisma.driverAssignment.findFirst({
      where: {
        id: assignmentId,
        driverId: admin.id,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or access denied' },
        { status: 404 }
      );
    }

    // Save the photo
    const photo = await prisma.driverPhoto.create({
      data: {
        driverAssignmentId: assignmentId,
        photoUrl,
        photoType,
        description: notes || `Photo taken during ${assignment.assignmentType}`,
      },
    });

    // Update assignment notes if provided
    if (notes) {
      await prisma.driverAssignment.update({
        where: { id: assignmentId },
        data: { notes },
      });
    }

    logger.info(`Photo saved for assignment ${assignmentId} by driver ${admin.id}`
    );

    return NextResponse.json({
      message: 'Photo saved successfully',
      photo,
    });
  } catch (error) {
    logger.error('Error saving photo:', error);
    return NextResponse.json(
      { error: 'Failed to save photo' },
      { status: 500 }
    );
  }
}
