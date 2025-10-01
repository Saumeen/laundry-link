import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

export function useImageUpload() {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleImageUpload = async (
    file: File,
    fieldPath: string,
    onSuccess: (url: string) => void
  ) => {
    try {
      setUploading(true);
      setUploadProgress(prev => ({ ...prev, [fieldPath]: 0 }));

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        showToast('File size must be less than 10MB', 'error');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('File must be an image', 'error');
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append('image', file);
      formData.append('fieldPath', fieldPath);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [fieldPath]: Math.min(prev[fieldPath] + 10, 90)
        }));
      }, 100);

      // Upload to server
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fieldPath]: 100 }));

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json() as { success: boolean; url: string; filename: string };

      // Call success callback with the URL
      onSuccess(result.url);

      showToast('Image uploaded successfully!', 'success');
      
      // Clear progress after a short delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fieldPath];
          return newProgress;
        });
      }, 1000);

    } catch (error) {
      console.error('Error uploading image:', error);
      showToast(error instanceof Error ? error.message : 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    uploadProgress,
    handleImageUpload
  };
}


