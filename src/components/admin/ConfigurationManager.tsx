'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import ConfigurationList from './ConfigurationList';
import ConfigurationForm from './ConfigurationForm';
import ConfigurationCategories from './ConfigurationCategories';
import WalletConfiguration from './WalletConfiguration';
import logger from '@/lib/logger';

export interface Configuration {
  id: number;
  key: string;
  value: string;
  description?: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  configs?: Configuration[];
  error?: string;
}

export default function ConfigurationManager() {
  const { showToast } = useToast();
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'wallet'>('general');

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/configurations');
      if (response.ok) {
        const data = (await response.json()) as ApiResponse;
        setConfigurations(data.configs || []);
      } else {
        showToast('Failed to fetch configurations', 'error');
      }
    } catch (error) {
      logger.error('Error fetching configurations:', error);
      showToast('Failed to fetch configurations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const handleEditConfig = (config: Configuration) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleFormSubmit = async (configData: {
    key: string;
    value: string;
    category: string;
    description?: string;
  }) => {
    try {
      if (!editingConfig) {
        showToast('No configuration selected for editing', 'error');
        return;
      }

      const response = await fetch(`/api/admin/configurations/${editingConfig.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      if (response.ok) {
        showToast('Configuration updated successfully', 'success');
        setShowForm(false);
        setEditingConfig(null);
        fetchConfigurations();
      } else {
        const errorData = (await response.json()) as ApiResponse;
        showToast(errorData.error || 'Failed to update configuration', 'error');
      }
    } catch (error) {
      logger.error('Error updating configuration:', error);
      showToast('Failed to update configuration', 'error');
    }
  };

  const handleToggleActive = async (configId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/configurations/${configId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        showToast(
          isActive 
            ? 'Configuration deactivated successfully' 
            : 'Configuration activated successfully',
          'success'
        );
        fetchConfigurations();
      } else {
        const errorData = (await response.json()) as ApiResponse;
        showToast(errorData.error || 'Failed to update configuration', 'error');
      }
    } catch (error) {
      logger.error('Error updating configuration:', error);
      showToast('Failed to update configuration', 'error');
    }
  };

  const filteredConfigurations = selectedCategory === 'all' 
    ? configurations 
    : configurations.filter(config => config.category === selectedCategory);

  const categories = Array.from(
    new Set(configurations.map(config => config.category))
  ).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Application Configurations
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage system-wide configuration settings
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            General Configurations
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'wallet'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Wallet Configuration
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <>
          {/* Category Filter */}
          <ConfigurationCategories
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {/* Configuration Form Modal */}
          {showForm && (
            <ConfigurationForm
              configuration={editingConfig}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingConfig(null);
              }}
            />
          )}

          {/* Configuration List */}
          <ConfigurationList
            configurations={filteredConfigurations}
            loading={loading}
            onEdit={handleEditConfig}
            onToggleActive={handleToggleActive}
          />
        </>
      )}

      {activeTab === 'wallet' && (
        <WalletConfiguration />
      )}
    </div>
  );
} 