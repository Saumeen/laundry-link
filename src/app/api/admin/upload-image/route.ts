import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/adminAuth';
import { uploadImageToBlob } from '@/lib/vercel-blob';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdminRole('SUPER_ADMIN');

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const fieldPath = formData.get('fieldPath') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!fieldPath) {
      return NextResponse.json(
        { error: 'Field path is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;
    const base64Data = `data:${mimeType};base64,${base64}`;

    // Generate filename with timestamp and field path
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `landing-page-${fieldPath.replace(/\./g, '-')}-${timestamp}.${fileExtension}`;

    // Upload to Vercel Blob
    const uploadResult = await uploadImageToBlob(base64Data, filename);

    if (!uploadResult.success) {
      logger.error('Failed to upload image to Vercel Blob:', uploadResult.error);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    logger.info(`Image uploaded successfully: ${uploadResult.url}`);

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      filename: filename
    });

  } catch (error) {
    logger.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
