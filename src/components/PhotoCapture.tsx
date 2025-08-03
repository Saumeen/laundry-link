'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, Check } from 'lucide-react';
import logger from '@/lib/logger';

interface PhotoCaptureProps {
  onCapture: (photoData: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function PhotoCapture({
  onCapture,
  onCancel,
  isOpen,
}: PhotoCaptureProps) {
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && !photoData) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      logger.error('Error accessing camera:', err);
      setError(
        'Unable to access camera. Please check permissions and try again.'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoData(photoDataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setPhotoData(null);
    setError(null);
    startCamera();
  };

  const handleCapture = () => {
    if (photoData) {
      onCapture(photoData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-md w-full'>
        <div className='p-4 border-b'>
          <h3 className='text-lg font-semibold'>Take Photo</h3>
        </div>

        <div className='p-4'>
          {error && (
            <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
              {error}
            </div>
          )}

          {!photoData ? (
            <div className='space-y-4'>
              <div className='relative bg-gray-100 rounded-lg overflow-hidden'>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className='w-full h-64 object-cover'
                />
                {isCapturing && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
                  </div>
                )}
              </div>

              <div className='flex space-x-2'>
                <button
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className='flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center'
                >
                  <Camera className='w-4 h-4 mr-2' />
                  Capture
                </button>
                <button
                  onClick={onCancel}
                  className='flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700'
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='relative'>
                <img
                  src={photoData}
                  alt='Captured'
                  className='w-full h-64 object-cover rounded'
                />
              </div>

              <div className='flex space-x-2'>
                <button
                  onClick={retakePhoto}
                  className='flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 flex items-center justify-center'
                >
                  <RotateCcw className='w-4 h-4 mr-2' />
                  Retake
                </button>
                <button
                  onClick={handleCapture}
                  className='flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center justify-center'
                >
                  <Check className='w-4 h-4 mr-2' />
                  Use Photo
                </button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className='hidden' />
      </div>
    </div>
  );
}
