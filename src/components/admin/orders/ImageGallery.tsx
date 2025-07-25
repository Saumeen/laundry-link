'use client';

import React, { useState } from 'react';

interface Image {
  id: number;
  photoUrl: string;
  photoType: string;
  description?: string | null;
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface ImageGalleryProps {
  images: Image[];
  title?: string;
  maxDisplay?: number;
  showLocation?: boolean;
}

export default function ImageGallery({ 
  images, 
  title = 'Photos', 
  maxDisplay = 4,
  showLocation = false 
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const displayedImages = showAll ? images : images.slice(0, maxDisplay);
  const hasMoreImages = images.length > maxDisplay;

  const getPhotoTypeLabel = (photoType: string) => {
    switch (photoType.toLowerCase()) {
      case 'pickup_photo':
        return 'Pickup';
      case 'delivery_photo':
        return 'Delivery';
      case 'issue_photo':
        return 'Issue';
      case 'manual_upload':
        return 'Uploaded';
      default:
        return photoType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getPhotoTypeColor = (photoType: string) => {
    switch (photoType.toLowerCase()) {
      case 'pickup_photo':
        return 'bg-blue-100 text-blue-800';
      case 'delivery_photo':
        return 'bg-green-100 text-green-800';
      case 'issue_photo':
        return 'bg-red-100 text-red-800';
      case 'manual_upload':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='mt-4'>
      <div className='flex items-center justify-between mb-3'>
        <h5 className='text-sm font-medium text-gray-900'>{title}</h5>
        <span className='text-xs text-gray-500'>{images.length} photos</span>
      </div>
      
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
        {displayedImages.map((image, index) => (
          <div key={image.id} className='relative group'>
            <div className='aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors'>
              <img
                src={image.photoUrl}
                alt={image.description || `Photo ${index + 1}`}
                className='w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity'
                onClick={() => setSelectedImage(image)}
              />
            </div>
            
            {/* Photo type badge */}
            <div className={`absolute top-1 left-1 px-2 py-1 rounded-full text-xs font-medium ${getPhotoTypeColor(image.photoType)}`}>
              {getPhotoTypeLabel(image.photoType)}
            </div>
            
            {/* Location indicator */}
            {showLocation && image.latitude && image.longitude && (
              <div className='absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm'>
                <svg className='w-3 h-3 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                </svg>
              </div>
            )}
            
            {/* Hover overlay with description */}
            {image.description && (
              <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-end'>
                <div className='p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity'>
                  {image.description}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Show more/less button */}
      {hasMoreImages && (
        <button
          onClick={() => setShowAll(!showAll)}
          className='mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium'
        >
          {showAll ? `Show less` : `Show ${images.length - maxDisplay} more`}
        </button>
      )}
      
      {/* Image Modal */}
      {selectedImage && (
        <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
          <div className='relative max-w-4xl max-h-full'>
            <div className='bg-white rounded-lg overflow-hidden shadow-xl'>
              {/* Modal Header */}
              <div className='flex items-center justify-between p-4 border-b border-gray-200'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {getPhotoTypeLabel(selectedImage.photoType)} Photo
                  </h3>
                  {selectedImage.description && (
                    <p className='text-sm text-gray-600 mt-1'>{selectedImage.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className='p-2 hover:bg-gray-100 rounded-full transition-colors'
                >
                  <svg className='w-6 h-6 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>
              
              {/* Modal Image */}
              <div className='p-4'>
                <img
                  src={selectedImage.photoUrl}
                  alt={selectedImage.description || 'Full size photo'}
                  className='max-w-full max-h-[70vh] object-contain rounded-lg'
                />
              </div>
              
              {/* Modal Footer */}
              <div className='flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50'>
                <div className='flex items-center space-x-4 text-sm text-gray-600'>
                  <span>Uploaded: {new Date(selectedImage.createdAt).toLocaleDateString()}</span>
                  {selectedImage.latitude && selectedImage.longitude && (
                    <span className='flex items-center space-x-1'>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                      </svg>
                      <span>Location available</span>
                    </span>
                  )}
                </div>
                
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedImage.photoUrl;
                      link.download = `photo-${selectedImage.id}.jpg`;
                      link.click();
                    }}
                    className='px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 