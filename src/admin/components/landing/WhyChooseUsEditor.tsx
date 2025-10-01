import { IconPicker } from '@/components/ui/IconPicker';
import type { LandingPageContent } from './types';
import { SectionHeader } from './SectionHeader';

interface WhyChooseUsEditorProps {
  content: LandingPageContent;
  updateContent: (path: string, value: any) => void;
}

export function WhyChooseUsEditor({
  content,
  updateContent
}: WhyChooseUsEditorProps) {

  const addReason = () => {
    const newReason = {
      id: Date.now().toString(),
      title: '',
      description: '',
      icon: ''
    };
    updateContent('whyChooseUs.reasons', [...content.whyChooseUs.reasons, newReason]);
  };

  const removeReason = (index: number) => {
    updateContent('whyChooseUs.reasons', content.whyChooseUs.reasons.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💎</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Why Choose Us Section</h3>
            <p className="text-xs text-gray-500">Highlight your key benefits and competitive advantages</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
      
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-700 mb-1">Section Title</label>
        <input
          type="text"
          value={content.whyChooseUs.title}
          onChange={(e) => updateContent('whyChooseUs.title', e.target.value)}
          placeholder="e.g., Why Choose Us?"
          className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2"
        />
      </div>

      {/* Reasons Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            ⭐ Key Benefits
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded">
              {content.whyChooseUs.reasons.length}
            </span>
          </h4>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              addReason();
            }}
            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-indigo-700 transition-colors"
          >
            + Add Reason
          </button>
        </div>

        {content.whyChooseUs.reasons.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-5xl text-gray-400 mb-3">💡</div>
            <p className="text-gray-500 text-sm">No reasons yet. Add your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.whyChooseUs.reasons.map((reason, index) => (
              <div key={reason.id} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="bg-indigo-100 text-indigo-600 rounded px-2 py-0.5 font-bold text-xs">
                    #{index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeReason(index);
                    }}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors text-sm"
                    title="Remove reason"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Benefit Title
                      </label>
                      <input
                        type="text"
                        value={reason.title}
                        onChange={(e) => {
                          const newReasons = [...content.whyChooseUs.reasons];
                          newReasons[index].title = e.target.value;
                          updateContent('whyChooseUs.reasons', newReasons);
                        }}
                        placeholder="e.g., Free Collection & Delivery"
                        className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs px-2 py-1.5"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Icon
                      </label>
                      <IconPicker
                        value={reason.icon}
                        onChange={(iconName) => {
                          const newReasons = [...content.whyChooseUs.reasons];
                          newReasons[index].icon = iconName;
                          updateContent('whyChooseUs.reasons', newReasons);
                        }}
                        placeholder="Select icon"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={reason.description}
                      onChange={(e) => {
                        const newReasons = [...content.whyChooseUs.reasons];
                        newReasons[index].description = e.target.value;
                        updateContent('whyChooseUs.reasons', newReasons);
                      }}
                      placeholder="Brief explanation of this benefit"
                      rows={2}
                      className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs px-2 py-1.5 resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

