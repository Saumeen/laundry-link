'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

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

export function LandingPageManager() {
  const { showToast } = useToast();
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [approvedReviews, setApprovedReviews] = useState<ApprovedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'howItWorks' | 'services' | 'testimonials' | 'whyChooseUs'>('hero');

  useEffect(() => {
    fetchContent();
    fetchApprovedReviews();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/landing');
      if (response.ok) {
        const data = await response.json() as { content: LandingPageContent };
        setContent(data.content);
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

  const handleImageUpload = (file: File, fieldPath: string) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        
        // Update the content with the base64 image
        setContent(prev => {
          if (!prev) return prev;
          const newContent = JSON.parse(JSON.stringify(prev));
          
          // Navigate to the field and update it
          const pathParts = fieldPath.split('.');
          let current = newContent;
          for (let i = 0; i < pathParts.length - 1; i++) {
            current = current[pathParts[i]];
          }
          current[pathParts[pathParts.length - 1]] = base64;
          
          return newContent;
        });
        
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
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
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
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
                      <label className="block text-sm font-medium text-gray-700">Icon (Material Symbol)</label>
                      <input
                        type="text"
                        value={step.icon}
                        onChange={(e) => {
                          const newSteps = [...content.howItWorks.steps];
                          newSteps[index].icon = e.target.value;
                          updateContent('howItWorks.steps', newSteps);
                        }}
                        placeholder="e.g., schedule, local_shipping"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
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

        {activeTab === 'testimonials' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Testimonials</h3>
            
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
                        checked={content.testimonials.selectedReviewIds.includes(review.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...content.testimonials.selectedReviewIds, review.id]
                            : content.testimonials.selectedReviewIds.filter(id => id !== review.id);
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
                      <label className="block text-sm font-medium text-gray-700">Icon (Material Symbol)</label>
                      <input
                        type="text"
                        value={reason.icon}
                        onChange={(e) => {
                          const newReasons = [...content.whyChooseUs.reasons];
                          newReasons[index].icon = e.target.value;
                          updateContent('whyChooseUs.reasons', newReasons);
                        }}
                        placeholder="e.g., inventory_2, headset_mic"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
