'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { IconPicker } from '@/components/ui/IconPicker';

interface LandingPageContent {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    backgroundImage: string;
    sideImage: string;
  };
  howItWorks: {
    title: string;
    steps: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
  };
  services: {
    title: string;
    items: Array<{
      id: string;
      name: string;
      description: string;
      image: string;
    }>;
  };
  testimonials: {
    title: string;
    displayMode: "auto" | "manual";
    selectedReviewIds: number[];
  };
  whyChooseUs: {
    title: string;
    reasons: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
  };
}

interface ApprovedReview {
  id: number;
  rating: number;
  title: string | null;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  order: {
    id: number;
    orderNumber: string;
  } | null;
}

interface NewTestimonial {
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  orderNumber?: string;
}

export function LandingPageManager() {
  const { showToast } = useToast();
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [approvedReviews, setApprovedReviews] = useState<ApprovedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'hero' | 'howItWorks' | 'services' | 'testimonials' | 'whyChooseUs'>('hero');
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

  useEffect(() => {
    fetchContent();
    fetchApprovedReviews();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/landing');
      if (response.ok) {
        const data = await response.json() as { content: LandingPageContent };
        
        // Ensure testimonials structure is properly initialized
        const content = {
          ...data.content,
          testimonials: {
            title: data.content.testimonials?.title || "What Our Customers Say",
            displayMode: data.content.testimonials?.displayMode || "auto",
            selectedReviewIds: data.content.testimonials?.selectedReviewIds || []
          }
        };
        
        setContent(content);
      } else {
        showToast('Failed to fetch landing page content', 'error');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      showToast('Failed to fetch landing page content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedReviews = async () => {
    try {
      const response = await fetch('/api/admin/reviews/approved');
      if (response.ok) {
        const data = await response.json() as { reviews: ApprovedReview[] };
        setApprovedReviews(data.reviews);
      } else {
        console.error('Failed to fetch approved reviews');
      }
    } catch (error) {
      console.error('Error fetching approved reviews:', error);
    }
  };

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
        // Refresh the reviews list
        fetchApprovedReviews();
      } else {
        const errorData = await response.json() as { error?: string };
        showToast(errorData.error || 'Failed to add testimonial', 'error');
      }
    } catch (error) {
      console.error('Error adding testimonial:', error);
      showToast('Failed to add testimonial', 'error');
    }
  };


  const handleSave = async () => {
    if (!content) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/landing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        showToast('Landing page content saved successfully!', 'success');
      } else {
        showToast('Failed to save landing page content', 'error');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      showToast('Failed to save landing page content', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File, fieldPath: string) => {
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

      // Update the content with the uploaded image URL
      setContent(prev => {
        if (!prev) return prev;
        const newContent = JSON.parse(JSON.stringify(prev));
        
        // Navigate to the field and update it
        const pathParts = fieldPath.split('.');
        let current = newContent;
        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = result.url;
        
        return newContent;
      });

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

  const updateContent = (path: string, value: any) => {
    setContent(prev => {
      if (!prev) return prev;
      const newContent = JSON.parse(JSON.stringify(prev));
      
      const pathParts = path.split('.');
      let current = newContent;
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;
      
      return newContent;
    });
  };

  const addStep = () => {
    if (!content) return;
    const newStep = {
      id: Date.now().toString(),
      title: '',
      description: '',
      icon: ''
    };
    setContent(prev => ({
      ...prev!,
      howItWorks: {
        ...prev!.howItWorks,
        steps: [...prev!.howItWorks.steps, newStep]
      }
    }));
  };

  const removeStep = (index: number) => {
    if (!content) return;
    setContent(prev => ({
      ...prev!,
      howItWorks: {
        ...prev!.howItWorks,
        steps: prev!.howItWorks.steps.filter((_, i) => i !== index)
      }
    }));
  };

  const addService = () => {
    if (!content) return;
    const newService = {
      id: Date.now().toString(),
      name: '',
      description: '',
      image: ''
    };
    setContent(prev => ({
      ...prev!,
      services: {
        ...prev!.services,
        items: [...prev!.services.items, newService]
      }
    }));
  };

  const removeService = (index: number) => {
    if (!content) return;
    setContent(prev => ({
      ...prev!,
      services: {
        ...prev!.services,
        items: prev!.services.items.filter((_, i) => i !== index)
      }
    }));
  };

  const addReason = () => {
    if (!content) return;
    const newReason = {
      id: Date.now().toString(),
      title: '',
      description: '',
      icon: ''
    };
    setContent(prev => ({
      ...prev!,
      whyChooseUs: {
        ...prev!.whyChooseUs,
        reasons: [...prev!.whyChooseUs.reasons, newReason]
      }
    }));
  };

  const removeReason = (index: number) => {
    if (!content) return;
    setContent(prev => ({
      ...prev!,
      whyChooseUs: {
        ...prev!.whyChooseUs,
        reasons: prev!.whyChooseUs.reasons.filter((_, i) => i !== index)
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load landing page content</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'hero', name: 'Hero Section' },
            { id: 'howItWorks', name: 'How It Works' },
            { id: 'services', name: 'Services' },
            { id: 'testimonials', name: 'Testimonials' },
            { id: 'whyChooseUs', name: 'Why Choose Us' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Forms */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Hero Section</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={content.hero.title}
                onChange={(e) => updateContent('hero.title', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Subtitle</label>
              <textarea
                value={content.hero.subtitle}
                onChange={(e) => updateContent('hero.subtitle', e.target.value)}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">CTA Text</label>
              <input
                type="text"
                value={content.hero.ctaText}
                onChange={(e) => updateContent('hero.ctaText', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Background Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file, 'hero.backgroundImage');
                  }
                }}
                disabled={uploading}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {uploadProgress['hero.backgroundImage'] !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress['hero.backgroundImage']}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploading... {uploadProgress['hero.backgroundImage']}%
                  </p>
                </div>
              )}
              {content.hero.backgroundImage && (
                <div className="mt-2">
                  <img
                    src={content.hero.backgroundImage}
                    alt="Background image preview"
                    className="h-32 w-auto rounded-lg object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Side Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file, 'hero.sideImage');
                  }
                }}
                disabled={uploading}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {uploadProgress['hero.sideImage'] !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress['hero.sideImage']}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploading... {uploadProgress['hero.sideImage']}%
                  </p>
                </div>
              )}
              {content.hero.sideImage && (
                <div className="mt-2">
                  <img
                    src={content.hero.sideImage}
                    alt="Side image preview"
                    className="h-32 w-auto rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'howItWorks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">How It Works</h3>
              <button
                onClick={addStep}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Add Step
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Section Title</label>
              <input
                type="text"
                value={content.howItWorks.title}
                onChange={(e) => updateContent('howItWorks.title', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="space-y-4">
              {content.howItWorks.steps.map((step, index) => (
                <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Step {index + 1}</h4>
                    <button
                      onClick={() => removeStep(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => {
                          const newSteps = [...content.howItWorks.steps];
                          newSteps[index].title = e.target.value;
                          updateContent('howItWorks.steps', newSteps);
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={step.description}
                        onChange={(e) => {
                          const newSteps = [...content.howItWorks.steps];
                          newSteps[index].description = e.target.value;
                          updateContent('howItWorks.steps', newSteps);
                        }}
                        rows={2}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Icon</label>
                      <IconPicker
                        value={step.icon}
                        onChange={(iconName) => {
                          const newSteps = [...content.howItWorks.steps];
                          newSteps[index].icon = iconName;
                          updateContent('howItWorks.steps', newSteps);
                        }}
                        placeholder="Select an icon"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Services</h3>
              <button
                onClick={addService}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Add Service
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Section Title</label>
              <input
                type="text"
                value={content.services.title}
                onChange={(e) => updateContent('services.title', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="space-y-4">
              {content.services.items.map((service, index) => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Service {index + 1}</h4>
                    <button
                      onClick={() => removeService(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => {
                          const newItems = [...content.services.items];
                          newItems[index].name = e.target.value;
                          updateContent('services.items', newItems);
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={service.description}
                        onChange={(e) => {
                          const newItems = [...content.services.items];
                          newItems[index].description = e.target.value;
                          updateContent('services.items', newItems);
                        }}
                        rows={2}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Service Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file, `services.items.${index}.image`);
                        }
                      }}
                      disabled={uploading}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    {uploadProgress[`services.items.${index}.image`] !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress[`services.items.${index}.image`]}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploading... {uploadProgress[`services.items.${index}.image`]}%
                        </p>
                      </div>
                    )}
                    {service.image && (
                      <div className="mt-2">
                        <img
                          src={service.image}
                          alt="Service preview"
                          className="h-32 w-auto rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'testimonials' && content && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Testimonials</h3>
              <button
                onClick={() => setShowAddTestimonial(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Testimonial
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Section Title</label>
              <input
                type="text"
                value={content.testimonials.title}
                onChange={(e) => updateContent('testimonials.title', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Display Mode</label>
              <select
                value={content.testimonials.displayMode}
                onChange={(e) => updateContent('testimonials.displayMode', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="auto">Auto - Show latest approved reviews</option>
                <option value="manual">Manual - Select specific reviews</option>
              </select>
            </div>

            {content.testimonials.displayMode === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Reviews</label>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-4">
                  {approvedReviews.map((review) => (
                    <label key={review.id} className="flex items-start space-x-3">
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
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {review.customer.name}
                          </span>
                          <div className="flex">
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
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {review.comment}
                        </p>
                        {review.order && (
                          <p className="text-xs text-gray-500">
                            Order #{review.order.orderNumber}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
                    onClick={() => setShowAddTestimonial(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
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
                {(() => {
                  let displayReviews = [];
                  
                  if (content.testimonials.displayMode === 'auto') {
                    // Show latest 6 approved reviews
                    displayReviews = approvedReviews
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 6);
                  } else {
                    // Show selected reviews
                    displayReviews = approvedReviews.filter(review => 
                      content.testimonials.selectedReviewIds?.includes(review.id) || false
                    );
                  }
                  
                  if (displayReviews.length === 0) {
                    return (
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
                    );
                  }
                  
                  return (
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
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'whyChooseUs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Why Choose Us</h3>
              <button
                onClick={addReason}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Add Reason
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Section Title</label>
              <input
                type="text"
                value={content.whyChooseUs.title}
                onChange={(e) => updateContent('whyChooseUs.title', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="space-y-4">
              {content.whyChooseUs.reasons.map((reason, index) => (
                <div key={reason.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Reason {index + 1}</h4>
                    <button
                      onClick={() => removeReason(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={reason.title}
                        onChange={(e) => {
                          const newReasons = [...content.whyChooseUs.reasons];
                          newReasons[index].title = e.target.value;
                          updateContent('whyChooseUs.reasons', newReasons);
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={reason.description}
                        onChange={(e) => {
                          const newReasons = [...content.whyChooseUs.reasons];
                          newReasons[index].description = e.target.value;
                          updateContent('whyChooseUs.reasons', newReasons);
                        }}
                        rows={2}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Icon</label>
                      <IconPicker
                        value={reason.icon}
                        onChange={(iconName) => {
                          const newReasons = [...content.whyChooseUs.reasons];
                          newReasons[index].icon = iconName;
                          updateContent('whyChooseUs.reasons', newReasons);
                        }}
                        placeholder="Select an icon"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
