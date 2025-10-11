import { useState, useMemo, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import type { LandingPageContent, ApprovedReview, NewTestimonial } from './types';
import { SectionHeader } from './SectionHeader';

interface TestimonialsEditorProps {
  content: LandingPageContent;
  approvedReviews: ApprovedReview[];
  updateContent: (path: string, value: any) => void;
  onRefreshReviews: () => void;
}

export function TestimonialsEditor({
  content,
  approvedReviews,
  updateContent,
  onRefreshReviews
}: TestimonialsEditorProps) {
  const { showToast } = useToast();
  const [showAddTestimonial, setShowAddTestimonial] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState<NewTestimonial>({
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    comment: '',
    imageUrl: '',
    isVerified: false,
    orderNumber: ''
  });

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'name'>('newest');
  const [selectAll, setSelectAll] = useState(false);
  const itemsPerPage = 5;

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<ApprovedReview | null>(null);

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newTestimonial.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }

    if (!newTestimonial.customerEmail.trim()) {
      errors.customerEmail = 'Customer email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTestimonial.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email address';
    }

    if (!newTestimonial.comment.trim()) {
      errors.comment = 'Testimonial comment is required';
    } else if (newTestimonial.comment.trim().length < 10) {
      errors.comment = 'Comment must be at least 10 characters long';
    }

    if (newTestimonial.title && newTestimonial.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addTestimonial = async () => {
    if (!validateForm()) {
      showToast('Please fix the form errors before submitting', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTestimonial),
      });

      if (response.ok) {
        setNewTestimonial({
          customerName: '',
          customerEmail: '',
          rating: 5,
          title: '',
          comment: '',
          imageUrl: '',
          isVerified: false,
          orderNumber: ''
        });
        setFormErrors({});
        setImagePreview(null);
        setShowAddTestimonial(false);
        showToast('Testimonial added successfully', 'success');
        onRefreshReviews();
      } else {
        const errorData = await response.json() as { error?: string };
        showToast(errorData.error || 'Failed to add testimonial', 'error');
      }
    } catch (error) {
      console.error('Error adding testimonial:', error);
      showToast('Failed to add testimonial', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const editTestimonial = (testimonial: ApprovedReview) => {
    setEditingTestimonial(testimonial);
    setNewTestimonial({
      customerName: testimonial.customer.name,
      customerEmail: testimonial.customer.email,
      rating: testimonial.rating,
      title: testimonial.title || '',
      comment: testimonial.comment,
      imageUrl: testimonial.imageUrl || '',
      isVerified: testimonial.isVerified,
      orderNumber: testimonial.order?.orderNumber || ''
    });
    setShowAddTestimonial(true);
    
    // Scroll to the form after a brief delay to ensure it's rendered
    setTimeout(() => {
      const formElement = document.getElementById('testimonial-form');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        // Focus on the first input field
        const firstInput = formElement.querySelector('input[type="text"]') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }
    }, 100);
  };

  const updateTestimonial = async () => {
    if (!editingTestimonial) return;
    
    if (!validateForm()) {
      showToast('Please fix the form errors before submitting', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/reviews/${editingTestimonial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTestimonial),
      });

      if (response.ok) {
        setEditingTestimonial(null);
        setNewTestimonial({
          customerName: '',
          customerEmail: '',
          rating: 5,
          title: '',
          comment: '',
          imageUrl: '',
          isVerified: false,
          orderNumber: ''
        });
        setFormErrors({});
        setImagePreview(null);
        setShowAddTestimonial(false);
        showToast('Testimonial updated successfully', 'success');
        onRefreshReviews();
      } else {
        const errorData = await response.json() as { error?: string };
        showToast(errorData.error || 'Failed to update testimonial', 'error');
      }
    } catch (error) {
      console.error('Error updating testimonial:', error);
      showToast('Failed to update testimonial', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTestimonial = async (id: number) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Testimonial deleted successfully', 'success');
        onRefreshReviews();
      } else {
        const errorData = await response.json() as { error?: string };
        showToast(errorData.error || 'Failed to delete testimonial', 'error');
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      showToast('Failed to delete testimonial', 'error');
    }
  };

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let filtered = approvedReviews;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(review => {
        const fullName = review.customer.name;
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.title?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Rating filter
    if (filterRating !== 'all') {
      filtered = filtered.filter(review => review.rating === filterRating);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered = filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'rating':
        filtered = filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        filtered = filtered.sort((a, b) => {
          const nameA = a.customer.name;
          const nameB = b.customer.name;
          return nameA.localeCompare(nameB);
        });
        break;
    }

    return filtered;
  }, [approvedReviews, searchTerm, filterRating, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  // Bulk selection handlers
  const handleSelectAll = () => {
    const currentIds = content.testimonials.selectedReviewIds || [];
    const pageIds = paginatedReviews.map(review => review.id);
    
    if (selectAll) {
      // Deselect all on current page
      const newIds = currentIds.filter(id => !pageIds.includes(id));
      updateContent('testimonials.selectedReviewIds', newIds);
    } else {
      // Select all on current page
      const newIds = [...new Set([...currentIds, ...pageIds])];
      updateContent('testimonials.selectedReviewIds', newIds);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredReviews.map(review => review.id);
    updateContent('testimonials.selectedReviewIds', allFilteredIds);
    setSelectAll(true);
  };

  const handleClearAll = () => {
    updateContent('testimonials.selectedReviewIds', []);
    setSelectAll(false);
  };

  // Image upload functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setNewTestimonial({...newTestimonial, imageUrl: result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imagePreview) {
      showToast('Please select an image first', 'error');
      return;
    }

    setIsUploadingImage(true);
    try {
      const response = await fetch('/api/admin/testimonials/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData: imagePreview }),
      });

      if (response.ok) {
        const result = await response.json() as { url: string };
        setNewTestimonial({...newTestimonial, imageUrl: result.url});
        setImagePreview(null);
        showToast('Image uploaded successfully', 'success');
      } else {
        const errorData = await response.json() as { error?: string };
        showToast(errorData.error || 'Failed to upload image', 'error');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setNewTestimonial({...newTestimonial, imageUrl: ''});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear field error when user starts typing
  const clearFieldError = (fieldName: string) => {
    if (formErrors[fieldName]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };


  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      // Validate file size (5MB limit)
      if (imageFile.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setNewTestimonial({...newTestimonial, imageUrl: result});
      };
      reader.readAsDataURL(imageFile);
    } else {
      showToast('Please drop a valid image file', 'error');
    }
  };

  const displayReviews = content.testimonials.displayMode === 'auto'
    ? approvedReviews
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)
    : approvedReviews.filter(review => 
        content.testimonials.selectedReviewIds?.includes(review.id) || false
      );

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Testimonials Section</h3>
            <p className="text-xs text-gray-500">Display customer reviews and testimonials</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Section Title</label>
          <input
            type="text"
            value={content.testimonials.title}
            onChange={(e) => updateContent('testimonials.title', e.target.value)}
            placeholder="e.g., What Our Customers Say"
            className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Display Mode</label>
          <select
            value={content.testimonials.displayMode}
            onChange={(e) => updateContent('testimonials.displayMode', e.target.value)}
            className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm px-3 py-2"
          >
            <option value="auto">Auto - Show latest approved reviews</option>
            <option value="manual">Manual - Select specific reviews</option>
          </select>
        </div>
      </div>

      {/* Review Selection (Manual Mode) */}
      {content.testimonials.displayMode === 'manual' && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            ✅ Select Reviews to Display
            <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded">
              {content.testimonials.selectedReviewIds?.length || 0} selected
            </span>
          </h4>

          {/* Search and Filter Controls */}
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  placeholder="Search by name, comment, or title..."
                  className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm px-3 py-2"
                />
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Rating</label>
                <select
                  value={filterRating}
                  onChange={(e) => {
                    setFilterRating(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm px-3 py-2"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm px-3 py-2"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="rating">Highest Rating</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            {/* Results Summary and Bulk Actions */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredReviews.length)} of {filteredReviews.length} reviews
              </span>
              <div className="flex items-center space-x-2">
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    className="text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>

            {/* Bulk Selection Controls */}
            <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Select all on this page
                  </span>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAllFiltered}
                  className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Select All Filtered ({filteredReviews.length})
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl text-gray-400 mb-2">📝</div>
                <p className="text-gray-500 text-sm">
                  {approvedReviews.length === 0 
                    ? 'No approved reviews available' 
                    : 'No reviews match your search criteria'
                  }
                </p>
              </div>
            ) : (
              paginatedReviews.map((review) => (
                <div key={review.id} className="flex items-start space-x-3 p-2 hover:bg-white rounded transition-colors border border-gray-100">
                  <input
                    type="checkbox"
                    checked={content.testimonials.selectedReviewIds?.includes(review.id) || false}
                    onChange={(e) => {
                      const currentIds = content.testimonials.selectedReviewIds || [];
                      const newIds = e.target.checked
                        ? [...currentIds, review.id]
                        : currentIds.filter(id => id !== review.id);
                      updateContent('testimonials.selectedReviewIds', newIds);
                    }}
                    className="mt-1 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        {review.imageUrl ? (
                          <img 
                            src={review.imageUrl} 
                            alt={`${review.customer.name} avatar`}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-xs font-medium">
                              {review.customer.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                            <span className="text-sm font-semibold text-gray-900">
                              {review.customer.name || 'Unknown Customer'}
                            </span>
                          <div className="flex items-center space-x-1">
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span
                                  key={i}
                                  className={`text-xs ${
                                    i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {review.rating}/5
                            </span>
                            {review.isVerified && (
                              <span className="text-xs text-green-600">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editTestimonial(review);
                          }}
                          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTestimonial(review.id);
                          }}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {review.title && (
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        "{review.title}"
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                      {review.comment}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span>Email: {review.customer.email}</span>
                        {review.order && (
                          <span>Order: #{review.order.orderNumber}</span>
                        )}
                      </div>
                      <span className="text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && filteredReviews.length > 5 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
              </div>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2 py-1 text-xs border rounded ${
                        currentPage === pageNum
                          ? 'bg-yellow-600 text-white border-yellow-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Testimonial Button */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">➕ Create New Testimonial</h4>
            <p className="text-xs text-gray-500 mt-0.5">Add a manual testimonial from a customer</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowAddTestimonial(true);
              // Scroll to the form after a brief delay to ensure it's rendered
              setTimeout(() => {
                const formElement = document.getElementById('testimonial-form');
                if (formElement) {
                  formElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                  // Focus on the first input field
                  const firstInput = formElement.querySelector('input[type="text"]') as HTMLInputElement;
                  if (firstInput) {
                    firstInput.focus();
                  }
                }
              }, 100);
            }}
            className="flex items-center gap-1 bg-yellow-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-yellow-700 transition-colors"
          >
            + New Testimonial
          </button>
        </div>
      </div>

      {/* Add Testimonial Form */}
      {showAddTestimonial && (
        <div id="testimonial-form" className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
            </h4>
            <button
              onClick={() => {
                setShowAddTestimonial(false);
                setFormErrors({});
                setEditingTestimonial(null);
                setNewTestimonial({
                  customerName: '',
                  customerEmail: '',
                  rating: 5,
                  title: '',
                  comment: '',
                  imageUrl: '',
                  isVerified: false,
                  orderNumber: ''
                });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newTestimonial.customerName}
                onChange={(e) => {
                  setNewTestimonial({...newTestimonial, customerName: e.target.value});
                  clearFieldError('customerName');
                }}
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm px-3 py-2 ${
                  formErrors.customerName ? 'border-red-300' : ''
                }`}
                placeholder="Enter customer name"
              />
              {formErrors.customerName && (
                <p className="mt-1 text-xs text-red-600">{formErrors.customerName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={newTestimonial.customerEmail}
                onChange={(e) => {
                  setNewTestimonial({...newTestimonial, customerEmail: e.target.value});
                  clearFieldError('customerEmail');
                }}
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm px-3 py-2 ${
                  formErrors.customerEmail ? 'border-red-300' : ''
                }`}
                placeholder="Enter customer email"
              />
              {formErrors.customerEmail && (
                <p className="mt-1 text-xs text-red-600">{formErrors.customerEmail}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating <span className="text-red-500">*</span>
              </label>
              <select
                value={newTestimonial.rating}
                onChange={(e) => {
                  setNewTestimonial({...newTestimonial, rating: parseInt(e.target.value)});
                }}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm px-3 py-2"
              >
                <option value={1}>1 Star</option>
                <option value={2}>2 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={5}>5 Stars</option>
              </select>
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Testimonial Title
                <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                value={newTestimonial.title}
                onChange={(e) => {
                  setNewTestimonial({...newTestimonial, title: e.target.value});
                  clearFieldError('title');
                }}
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm px-3 py-2 ${
                  formErrors.title ? 'border-red-300' : ''
                }`}
                placeholder="Enter testimonial title"
              />
              {formErrors.title && (
                <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
              )}
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Testimonial Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newTestimonial.comment}
                onChange={(e) => {
                  setNewTestimonial({...newTestimonial, comment: e.target.value});
                  clearFieldError('comment');
                }}
                rows={4}
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm px-3 py-2 resize-none ${
                  formErrors.comment ? 'border-red-300' : ''
                }`}
                placeholder="Enter testimonial comment"
              />
              <div className="flex justify-between items-center mt-1">
                {formErrors.comment && (
                  <p className="text-xs text-red-600">{formErrors.comment}</p>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {newTestimonial.comment.length}/500 characters
                </span>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Image (Optional)</label>
              
              <div className="mt-1">
                <div 
                  className={`border-2 border-dashed rounded-md p-4 ${
                    isDragOver ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Choose Image
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      or drag and drop an image here (PNG, JPG, GIF up to 5MB)
                    </p>
                  </div>

                  {/* Image Preview and Upload */}
                  {imagePreview && (
                    <div className="mt-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-12 h-12 rounded object-cover border border-gray-200"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Image selected</p>
                          <div className="flex space-x-2 mt-1">
                            <button
                              type="button"
                              onClick={handleImageUpload}
                              disabled={isUploadingImage}
                              className="inline-flex items-center px-2 py-1 text-xs border border-transparent rounded text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                            >
                              {isUploadingImage ? 'Uploading...' : 'Upload'}
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Image Preview */}
                {newTestimonial.imageUrl && !imagePreview && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Current Image:</p>
                    <div className="flex items-center space-x-3">
                      <img 
                        src={newTestimonial.imageUrl} 
                        alt="Customer preview" 
                        className="w-12 h-12 rounded object-cover border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setNewTestimonial({...newTestimonial, imageUrl: ''})}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Number
                <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                value={newTestimonial.orderNumber}
                onChange={(e) => {
                  setNewTestimonial({...newTestimonial, orderNumber: e.target.value});
                }}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm px-3 py-2"
                placeholder="Enter order number"
              />
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTestimonial.isVerified}
                  onChange={(e) => {
                    setNewTestimonial({...newTestimonial, isVerified: e.target.checked});
                  }}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <div className="ml-2">
                  <span className="text-sm font-medium text-gray-700">Verified Purchase</span>
                  <p className="text-xs text-gray-500">This testimonial is from a verified customer</p>
                </div>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowAddTestimonial(false);
                setFormErrors({});
                setEditingTestimonial(null);
                setNewTestimonial({
                  customerName: '',
                  customerEmail: '',
                  rating: 5,
                  title: '',
                  comment: '',
                  imageUrl: '',
                  isVerified: false,
                  orderNumber: ''
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={editingTestimonial ? updateTestimonial : addTestimonial}
              disabled={isSubmitting || !newTestimonial.customerName || !newTestimonial.customerEmail || !newTestimonial.comment}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting 
                ? (editingTestimonial ? 'Updating...' : 'Creating...') 
                : (editingTestimonial ? 'Update Testimonial' : 'Add Testimonial')
              }
            </button>
          </div>
        </div>
      )}

      {/* Testimonials Display List */}
      <div className="mt-8">
        <h4 className="text-md font-medium text-gray-900 mb-4">Testimonials that will be displayed on homepage</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          {displayReviews.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500">
                {content.testimonials.displayMode === 'auto' 
                  ? 'No approved reviews available yet'
                  : 'No reviews selected for display'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">
                  {displayReviews.length} testimonial{displayReviews.length !== 1 ? 's' : ''} will be displayed
                </span>
                <span className="text-xs text-gray-500">
                  {content.testimonials.displayMode === 'auto' ? 'Auto mode (latest 6)' : 'Manual selection'}
                </span>
              </div>
              
              <div className="space-y-3">
                {displayReviews.map((review, index) => (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start space-x-4">
                      {/* Customer Image */}
                      <div className="flex-shrink-0">
                        {review.imageUrl ? (
                          <img 
                            src={review.imageUrl} 
                            alt={`${review.customer.name} avatar`}
                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm font-medium">
                              {review.customer.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Testimonial Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {review.customer.name || 'Unknown Customer'}
                              </span>
                              <span className="text-xs text-gray-500">
                                #{index + 1}
                              </span>
                              {review.isVerified && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="flex items-center">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${
                                      i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-xs text-gray-500">
                                {review.rating}/5
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => editTestimonial(review)}
                              className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTestimonial(review.id)}
                              className="px-3 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md border border-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        {review.title && (
                          <p className="text-sm font-semibold text-gray-900 mb-2">
                            "{review.title}"
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {review.comment}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2">
                          <div className="flex items-center space-x-4">
                            <span>
                              <strong>Email:</strong> {review.customer.email}
                            </span>
                            <span>
                              <strong>Order:</strong> #{review.order?.orderNumber || 'N/A'}
                            </span>
                          </div>
                          <span className="text-gray-400">
                            ID: {review.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

