import { useState } from 'react';
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
    isVerified: false,
    orderNumber: ''
  });

  const addTestimonial = async () => {
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
          isVerified: false,
          orderNumber: ''
        });
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
          <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
            {approvedReviews.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl text-gray-400 mb-2">📝</div>
                <p className="text-gray-500 text-sm">No approved reviews available</p>
              </div>
            ) : (
              approvedReviews.map((review) => (
                <label key={review.id} className="flex items-start space-x-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
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
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-semibold text-gray-900">
                        {review.customer.name}
                      </span>
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
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {review.comment}
                    </p>
                    {review.order && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Order #{review.order.orderNumber}
                      </p>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
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
            onClick={() => setShowAddTestimonial(true)}
            className="flex items-center gap-1 bg-yellow-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-yellow-700 transition-colors"
          >
            + New Testimonial
          </button>
        </div>
      </div>

      {/* Add Testimonial Form */}
      {showAddTestimonial && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Testimonial</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                value={newTestimonial.customerName}
                onChange={(e) => setNewTestimonial({...newTestimonial, customerName: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter customer name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Email</label>
              <input
                type="email"
                value={newTestimonial.customerEmail}
                onChange={(e) => setNewTestimonial({...newTestimonial, customerEmail: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter customer email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Rating</label>
              <select
                value={newTestimonial.rating}
                onChange={(e) => setNewTestimonial({...newTestimonial, rating: parseInt(e.target.value)})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value={1}>1 Star</option>
                <option value={2}>2 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={5}>5 Stars</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newTestimonial.title}
                onChange={(e) => setNewTestimonial({...newTestimonial, title: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter testimonial title"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Comment</label>
              <textarea
                value={newTestimonial.comment}
                onChange={(e) => setNewTestimonial({...newTestimonial, comment: e.target.value})}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter customer testimonial"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Order Number (Optional)</label>
              <input
                type="text"
                value={newTestimonial.orderNumber}
                onChange={(e) => setNewTestimonial({...newTestimonial, orderNumber: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter order number"
              />
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newTestimonial.isVerified}
                  onChange={(e) => setNewTestimonial({...newTestimonial, isVerified: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Verified Purchase</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={() => setShowAddTestimonial(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addTestimonial}
              disabled={!newTestimonial.customerName || !newTestimonial.customerEmail || !newTestimonial.comment}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Testimonial
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
              
              <div className="space-y-2">
                {displayReviews.map((review, index) => (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {review.customer.name}
                          </span>
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
                            <span className="ml-2 text-xs text-gray-500">
                              {review.rating}/5
                            </span>
                          </div>
                          {review.order && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              Verified
                            </span>
                          )}
                        </div>
                        
                        {review.title && (
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            "{review.title}"
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {review.comment}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                          <span>
                            Order #{review.order?.orderNumber || 'N/A'}
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

