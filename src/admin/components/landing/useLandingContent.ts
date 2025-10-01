import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import type { LandingPageContent, ApprovedReview } from './types';

export function useLandingContent() {
  const { showToast } = useToast();
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [approvedReviews, setApprovedReviews] = useState<ApprovedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
    fetchApprovedReviews();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/landing');
      if (response.ok) {
        const data = await response.json() as { content: LandingPageContent };
        
        // Ensure all sections are properly initialized with defaults if missing
        const content = {
          ...data.content,
          testimonials: {
            title: data.content.testimonials?.title || "What Our Customers Say",
            displayMode: data.content.testimonials?.displayMode || "auto",
            selectedReviewIds: data.content.testimonials?.selectedReviewIds || []
          },
          trust: data.content.trust || {
            title: "Trusted by Our Community in Bahrain",
            subtitle: "See what our customers say and the trust we've built as the leading laundry service in Bahrain",
            stats: [
              { id: "1", icon: "groups", number: "5,000+", label: "Trusted Customers" },
              { id: "2", icon: "local_shipping", number: "30,000+", label: "Pickups Completed" },
              { id: "3", icon: "verified", number: "Efada", label: "Certified Partner" }
            ],
            indicators: [
              { id: "1", icon: "security", label: "Secure & Reliable", color: "green-600" },
              { id: "2", icon: "schedule", label: "24/7 Service", color: "blue-600" },
              { id: "3", icon: "eco", label: "Eco-Friendly", color: "purple-600" }
            ]
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

  const updateContent = (path: string, value: any) => {
    setContent(prev => {
      if (!prev) return prev;
      const newContent = JSON.parse(JSON.stringify(prev));
      
      const pathParts = path.split('.');
      let current: any = newContent;
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;
      
      return newContent;
    });
  };

  return {
    content,
    setContent,
    approvedReviews,
    loading,
    saving,
    handleSave,
    updateContent,
    fetchApprovedReviews
  };
}


