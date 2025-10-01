import { IconPicker } from '@/components/ui/IconPicker';
import type { LandingPageContent } from './types';
import { SectionHeader } from './SectionHeader';

interface HowItWorksEditorProps {
  content: LandingPageContent;
  updateContent: (path: string, value: any) => void;
  uploading: boolean;
  uploadProgress: { [key: string]: number };
  onImageUpload: (file: File, fieldPath: string) => void;
}

export function HowItWorksEditor({
  content,
  updateContent,
  uploading,
  uploadProgress,
  onImageUpload
}: HowItWorksEditorProps) {

  const addStep = () => {
    const newStep = {
      id: Date.now().toString(),
      title: '',
      description: '',
      icon: ''
    };
    updateContent('howItWorks.steps', [...content.howItWorks.steps, newStep]);
  };

  const removeStep = (index: number) => {
    updateContent('howItWorks.steps', content.howItWorks.steps.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">How It Works Section</h3>
            <p className="text-xs text-gray-500">Step-by-step process explanation with visual elements</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const modal = document.getElementById('how-it-works-image-modal');
              if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
              }
            }}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
          >
            📸 Image Tips
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Section Title</label>
          <input
            type="text"
            value={content.howItWorks.title}
            onChange={(e) => updateContent('howItWorks.title', e.target.value)}
            placeholder="e.g., How It Works"
            className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Section Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImageUpload(file, 'howItWorks.image');
              }
            }}
            disabled={uploading}
            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 disabled:opacity-50"
          />
          {uploadProgress['howItWorks.image'] !== undefined && (
            <div className="mt-1">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-cyan-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress['howItWorks.image']}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Uploading... {uploadProgress['howItWorks.image']}%
              </p>
            </div>
          )}
          {content.howItWorks.image && (
            <div className="mt-2">
              <div className="relative h-32 w-full overflow-hidden rounded-xl">
                <img
                  src={content.howItWorks.image}
                  alt="Section preview"
                  className="h-full w-full object-cover transition-all duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Preview: How It Works section image</p>
            </div>
          )}
        </div>
      </div>

      {/* Steps Section */}
      <div className="border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            📋 Process Steps
            <span className="bg-cyan-100 text-cyan-700 text-xs font-medium px-2 py-0.5 rounded">
              {content.howItWorks.steps.length}
            </span>
          </h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const modal = document.getElementById('how-it-works-image-modal');
                if (modal) {
                  modal.classList.remove('hidden');
                  modal.classList.add('flex');
                }
              }}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
            >
              📸 Image Tips
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                addStep();
              }}
              className="flex items-center gap-1 bg-cyan-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-cyan-700 transition-colors"
            >
              + Add Step
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {content.howItWorks.steps.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-5xl text-gray-400 mb-3">📝</div>
            <p className="text-gray-500 text-sm">No steps yet. Add your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {content.howItWorks.steps.map((step, index) => (
              <div key={step.id} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg p-3 hover:border-cyan-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="bg-cyan-100 text-cyan-600 rounded px-2 py-0.5 font-bold text-xs">
                    Step #{index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeStep(index);
                    }}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors text-sm"
                    title="Remove step"
                  >
                    🗑️
                  </button>
                </div>
                
                {/* Live Preview */}
                {(step.title || step.description || step.icon) && (
                  <div className="mb-3 p-4 rounded-xl bg-white shadow-lg border border-gray-200 relative overflow-hidden">
                    <div className="flex items-start gap-4 relative z-10">
                      {/* Icon Container - matching actual HowItWorks component */}
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--secondary-color)] text-2xl font-bold text-[var(--primary-color)]" aria-hidden="true">
                        {step.icon ? (
                          <span className="material-symbols-outlined text-2xl">
                            {step.icon}
                          </span>
                        ) : (
                          index + 1
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="relative">
                        {step.title && (
                          <h3 className="text-lg font-bold text-gray-800">
                            {step.title}
                          </h3>
                        )}
                        {step.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Step Title
                      </label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => {
                          const newSteps = [...content.howItWorks.steps];
                          newSteps[index].title = e.target.value;
                          updateContent('howItWorks.steps', newSteps);
                        }}
                        placeholder="e.g., Book Your Pickup"
                        className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-xs px-2 py-1.5"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Icon
                      </label>
                      <IconPicker
                        value={step.icon}
                        onChange={(iconName) => {
                          const newSteps = [...content.howItWorks.steps];
                          newSteps[index].icon = iconName;
                          updateContent('howItWorks.steps', newSteps);
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
                      value={step.description}
                      onChange={(e) => {
                        const newSteps = [...content.howItWorks.steps];
                        newSteps[index].description = e.target.value;
                        updateContent('howItWorks.steps', newSteps);
                      }}
                      placeholder="Brief description of this step"
                      rows={2}
                      className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-xs px-2 py-1.5 resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* How It Works Image Modal */}
      <div id="how-it-works-image-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📸 Process Image Guidelines</h3>
              <button
                type="button"
                onClick={() => {
                  const modal = document.getElementById('how-it-works-image-modal');
                  if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Image Requirements</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Image Size:</span>
                    <span className="font-medium">800x600 pixels</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Size:</span>
                    <span className="font-medium">Under 2MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Format:</span>
                    <span className="font-medium">JPG or PNG</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Best Practices</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Show your actual process or workflow</li>
                  <li>• Use high-quality, clear images</li>
                  <li>• Include people or equipment in action</li>
                  <li>• Ensure good lighting and composition</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const modal = document.getElementById('how-it-works-image-modal');
                  if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

