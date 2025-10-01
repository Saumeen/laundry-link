'use client';

import { useState } from 'react';
import { useLandingContent } from './landing/useLandingContent';
import { useImageUpload } from './landing/useImageUpload';
import { HeroEditor } from './landing/HeroEditor';
import { HowItWorksEditor } from './landing/HowItWorksEditor';
import { ServicesEditor } from './landing/ServicesEditor';
import { TestimonialsEditor } from './landing/TestimonialsEditor';
import { TrustEditor } from './landing/TrustEditor';
import { WhyChooseUsEditor } from './landing/WhyChooseUsEditor';

type TabType = 'hero' | 'howItWorks' | 'services' | 'testimonials' | 'trust' | 'whyChooseUs';

export function LandingPageManager() {
  const {
    content,
    approvedReviews,
    loading,
    saving,
    handleSave,
    updateContent,
    fetchApprovedReviews
  } = useLandingContent();

  const { uploading, uploadProgress, handleImageUpload } = useImageUpload();
  const [activeTab, setActiveTab] = useState<TabType>('hero');

  const onImageUpload = (file: File, fieldPath: string) => {
    handleImageUpload(file, fieldPath, (url) => {
      updateContent(fieldPath, url);
    });
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
            { id: 'trust', name: 'Trust & Stats' },
            { id: 'whyChooseUs', name: 'Why Choose Us' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={'py-2 px-1 border-b-2 font-medium text-sm ' + (
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Forms */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'hero' && (
          <HeroEditor
            content={content}
            updateContent={updateContent}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onImageUpload={onImageUpload}
          />
        )}

        {activeTab === 'howItWorks' && (
          <HowItWorksEditor
            content={content}
            updateContent={updateContent}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onImageUpload={onImageUpload}
          />
        )}

        {activeTab === 'services' && (
          <ServicesEditor
            content={content}
            updateContent={updateContent}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onImageUpload={onImageUpload}
          />
        )}

        {activeTab === 'testimonials' && (
          <TestimonialsEditor
            content={content}
            approvedReviews={approvedReviews}
            updateContent={updateContent}
            onRefreshReviews={fetchApprovedReviews}
          />
        )}

        {activeTab === 'trust' && (
          <TrustEditor
            content={content}
            updateContent={updateContent}
          />
        )}

        {activeTab === 'whyChooseUs' && (
          <WhyChooseUsEditor
            content={content}
            updateContent={updateContent}
          />
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
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
