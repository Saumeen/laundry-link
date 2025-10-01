import React from 'react';
import { IconPicker } from '@/components/ui/IconPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Users, Truck, ShieldCheck, Lock, Clock, Leaf } from 'lucide-react';
import type { LandingPageContent } from './types';
import { SectionHeader } from './SectionHeader';

interface TrustEditorProps {
  content: LandingPageContent;
  updateContent: (path: string, value: unknown) => void;
}

export function TrustEditor({
  content,
  updateContent
}: TrustEditorProps) {

  // Icon mapping function
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string; style?: React.CSSProperties }> } = {
      'groups': Users,
      'local_shipping': Truck,
      'verified': ShieldCheck,
      'security': Lock,
      'schedule': Clock,
      'eco': Leaf,
    };
    return iconMap[iconName] || null;
  };

  const addStat = () => {
    const newStat = {
      id: Date.now().toString(),
      icon: '',
      number: '',
      label: ''
    };
    updateContent('trust.stats', [...content.trust.stats, newStat]);
  };

  const removeStat = (index: number) => {
    updateContent('trust.stats', content.trust.stats.filter((_, i) => i !== index));
  };

  const addIndicator = () => {
    const newIndicator = {
      id: Date.now().toString(),
      icon: '',
      label: '',
      color: 'blue-600'
    };
    updateContent('trust.indicators', [...content.trust.indicators, newIndicator]);
  };

  const removeIndicator = (index: number) => {
    updateContent('trust.indicators', content.trust.indicators.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Trust & Statistics Section</h3>
            <p className="text-xs text-gray-500">Build credibility with statistics and trust indicators</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Section Title</label>
          <textarea
            value={content.trust.title}
            onChange={(e) => updateContent('trust.title', e.target.value)}
            placeholder="e.g., Trusted by Our Community"
            rows={2}
            className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Section Subtitle</label>
          <textarea
            value={content.trust.subtitle}
            onChange={(e) => updateContent('trust.subtitle', e.target.value)}
            placeholder="Brief description"
            rows={2}
            className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 resize-none"
          />
        </div>
      </div>

      {/* Statistics Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            📊 Statistics
            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
              {content.trust.stats.length}
            </span>
          </h4>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              addStat();
            }}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            + Add
          </button>
        </div>

        {content.trust.stats.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-5xl text-gray-400 mb-3">📈</div>
            <p className="text-gray-500 text-sm">No statistics yet. Add your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {content.trust.stats.map((stat, index) => (
              <div key={stat.id} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="bg-blue-100 text-blue-600 rounded px-2 py-0.5 font-bold text-xs">
                    #{index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeStat(index);
                    }}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors text-sm"
                    title="Remove statistic"
                  >
                    🗑️
                  </button>
                </div>
                
                {/* Live Preview */}
                {(stat.icon || stat.number || stat.label) && (
                  <div className="mb-2 p-4 rounded-xl bg-white/40 shadow-lg shadow-blue-200/30 backdrop-blur-md">
                    <div className="flex items-center gap-4 relative">
                      {/* Icon Container - matching actual Trust component */}
                      {stat.icon && (
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary-color)] to-blue-600 text-white shadow-lg shadow-blue-500/30" aria-hidden="true">
                          {(() => {
                            const IconComponent = getIconComponent(stat.icon);
                            return IconComponent ? (
                              <IconComponent className="w-6 h-6" style={{ color: '#ffffff', strokeWidth: 2 }} />
                            ) : (
                              <span className="material-symbols-outlined text-2xl font-bold">
                                {stat.icon}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                      
                      {/* Content - matching actual Trust component styling */}
                      <div className="flex-1 text-left">
                        {stat.number && (
                          <p className="text-2xl font-black text-[var(--dark-blue)]">
                            {stat.number}
                          </p>
                        )}
                        {stat.label && (
                          <p className="text-sm font-semibold text-[var(--medium-blue)]">
                            {stat.label}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Icon
                    </label>
                    <IconPicker
                      value={stat.icon}
                      onChange={(iconName) => {
                        const newStats = [...content.trust.stats];
                        newStats[index].icon = iconName;
                        updateContent('trust.stats', newStats);
                      }}
                      placeholder="Select an icon"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Number / Value
                    </label>
                    <input
                      type="text"
                      value={stat.number}
                      onChange={(e) => {
                        const newStats = [...content.trust.stats];
                        newStats[index].number = e.target.value;
                        updateContent('trust.stats', newStats);
                      }}
                      placeholder="e.g., 5,000+"
                      className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs px-2 py-1.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const newStats = [...content.trust.stats];
                        newStats[index].label = e.target.value;
                        updateContent('trust.stats', newStats);
                      }}
                      placeholder="e.g., Customers"
                      className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs px-2 py-1.5"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trust Indicators Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            ✅ Trust Indicators
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded">
              {content.trust.indicators.length}
            </span>
          </h4>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              addIndicator();
            }}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition-colors"
          >
            + Add
          </button>
        </div>

        {content.trust.indicators.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-5xl text-gray-400 mb-3">🛡️</div>
            <p className="text-gray-500 text-sm">No trust indicators yet. Add your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {content.trust.indicators.map((indicator, index) => {
              return (
                <div key={indicator.id} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg p-3 hover:border-green-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="bg-green-100 text-green-600 rounded px-2 py-0.5 font-bold text-xs">
                      #{index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeIndicator(index);
                      }}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors text-sm"
                      title="Remove indicator"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  {/* Live Preview */}
                  {(indicator.icon || indicator.label) && (
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-md" style={{ background: 'rgba(255, 255, 255, 0.3)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                      {indicator.icon && (() => {
                        const IconComponent = getIconComponent(indicator.icon);
                        const iconColor = indicator.color.startsWith('#') ? indicator.color : 
                                         indicator.color === 'green-600' ? '#16a34a' :
                                         indicator.color === 'blue-600' ? '#2563eb' :
                                         indicator.color === 'purple-600' ? '#9333ea' : '#2563eb';
                        return IconComponent ? (
                          <IconComponent 
                            className="w-4 h-4"
                            style={{ color: iconColor, strokeWidth: 2.5 }}
                          />
                        ) : (
                          <span className="material-symbols-outlined text-sm" style={{ color: iconColor }}>
                            {indicator.icon}
                          </span>
                        );
                      })()}
                      {indicator.label && (
                        <span className="text-xs font-medium" style={{ color: '#190dad' }}>{indicator.label}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Icon
                      </label>
                      <IconPicker
                        value={indicator.icon}
                        onChange={(iconName) => {
                          const newIndicators = [...content.trust.indicators];
                          newIndicators[index].icon = iconName;
                          updateContent('trust.indicators', newIndicators);
                        }}
                        placeholder="Select an icon"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Label
                      </label>
                      <input
                        type="text"
                        value={indicator.label}
                        onChange={(e) => {
                          const newIndicators = [...content.trust.indicators];
                          newIndicators[index].label = e.target.value;
                          updateContent('trust.indicators', newIndicators);
                        }}
                        placeholder="e.g., Secure & Reliable"
                        className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs px-2 py-1.5"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Icon Color
                      </label>
                      <ColorPicker
                        value={indicator.color}
                        onChange={(colorValue) => {
                          const newIndicators = [...content.trust.indicators];
                          newIndicators[index].color = colorValue;
                          updateContent('trust.indicators', newIndicators);
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      </div>
    </div>
  );
}
