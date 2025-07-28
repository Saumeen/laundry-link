'use client';

import { useState, useEffect } from 'react';
import { Configuration } from './ConfigurationManager';

interface ConfigurationFormProps {
  configuration: Configuration | null;
  onSubmit: (data: {
    key: string;
    value: string;
    category: string;
    description?: string;
  }) => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'time_slots', label: 'Time Slots' },
  { value: 'business_rules', label: 'Business Rules' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'general', label: 'General' },
];

export default function ConfigurationForm({
  configuration,
  onSubmit,
  onCancel,
}: ConfigurationFormProps) {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    category: 'general',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (configuration) {
      setFormData({
        key: configuration.key,
        value: configuration.value,
        category: configuration.category,
        description: configuration.description || '',
      });
    }
  }, [configuration]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.value.trim()) {
      newErrors.value = 'Value is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        key: formData.key.trim(),
        value: formData.value.trim(),
        category: formData.category,
        description: formData.description.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Edit Configuration
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Key Field - Read Only */}
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
                Configuration Key
              </label>
              <input
                type="text"
                id="key"
                value={formData.key}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                placeholder="Configuration key"
                disabled={true}
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                Configuration key cannot be changed (dependency)
              </p>
            </div>

            {/* Value Field */}
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Value *
              </label>
              <textarea
                id="value"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.value ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter the configuration value"
              />
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">{errors.value}</p>
              )}
            </div>

            {/* Category Field */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description of what this configuration does"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 