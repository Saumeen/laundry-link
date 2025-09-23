import { put } from '@vercel/blob';

export interface ImageUploadResult {
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Upload a base64 image to Vercel Blob Storage
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param filename - Optional filename for the blob
 * @returns Promise with upload result
 */
export async function uploadImageToBlob(
  base64Data: string,
  filename?: string
): Promise<ImageUploadResult> {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, 'base64');
    
    // Generate filename if not provided
    const finalFilename = filename || `image-${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
    
    // Upload to Vercel Blob
    const blob = await put(finalFilename, buffer, {
      access: 'public',
      contentType: 'image/jpeg'
    });

    return {
      url: blob.url,
      success: true
    };
  } catch (error) {
    console.error('Error uploading image to Vercel Blob:', error);
    return {
      url: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Process content object and upload any base64 images to Vercel Blob Storage
 * @param content - Content object that may contain base64 image data
 * @returns Processed content with blob URLs
 */
export async function processContentImages(content: any): Promise<any> {
  if (!content || typeof content !== 'object') {
    return content;
  }

  const processedContent = JSON.parse(JSON.stringify(content)); // Deep clone

  // Recursively process the content object
  await processObjectImages(processedContent);

  return processedContent;
}

/**
 * Recursively process an object to find and upload base64 images
 */
async function processObjectImages(obj: any): Promise<void> {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (typeof value === 'string' && isBase64Image(value)) {
        // This is a base64 image, upload it
        const uploadResult = await uploadImageToBlob(value, `${key}-${Date.now()}.jpg`);
        if (uploadResult.success) {
          obj[key] = uploadResult.url;
        } else {
          console.error(`Failed to upload image for key ${key}:`, uploadResult.error);
          // Keep the original value or set to empty string
          obj[key] = '';
        }
      } else if (Array.isArray(value)) {
        // Process array items
        for (const item of value) {
          await processObjectImages(item);
        }
      } else if (typeof value === 'object') {
        // Recursively process nested objects
        await processObjectImages(value);
      }
    }
  }
}

/**
 * Check if a string is a base64 encoded image
 */
function isBase64Image(str: string): boolean {
  // Check if it's a data URL
  if (str.startsWith('data:image/')) {
    return true;
  }
  
  // Check if it's a base64 string (basic validation)
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str) && str.length > 100; // Reasonable length for an image
}
