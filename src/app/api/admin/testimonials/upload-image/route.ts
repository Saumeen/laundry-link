import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/adminAuth';
import { uploadImageToBlob } from '@/lib/vercel-blob';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      imageData: string;
    };

    if (!body.imageData) {
      return NextResponse.json({ 
        error: 'Image data is required' 
      }, { status: 400 });
    }

    // Validate that it's a base64 image
    if (!body.imageData.startsWith('data:image/')) {
      return NextResponse.json({ 
        error: 'Invalid image format' 
      }, { status: 400 });
    }

    // Generate filename for testimonial image
    const filename = `testimonials/customer-${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;

    // Upload to Vercel Blob
    const uploadResult = await uploadImageToBlob(body.imageData, filename);

    if (!uploadResult.success) {
      logger.error('Failed to upload testimonial image:', uploadResult.error);
      return NextResponse.json({ 
        error: uploadResult.error || 'Failed to upload image' 
      }, { status: 500 });
    }

    logger.info(`Testimonial image uploaded successfully: ${uploadResult.url}`);

    return NextResponse.json({ 
      url: uploadResult.url,
      message: 'Image uploaded successfully' 
    });

  } catch (error) {
    logger.error('Error uploading testimonial image:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image' 
    }, { status: 500 });
  }
}
