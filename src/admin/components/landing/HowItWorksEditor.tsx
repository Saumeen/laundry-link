import { IconPicker } from '@/components/ui/IconPicker';
import type { LandingPageContent } from './types';
import { SectionHeader } from './SectionHeader';
import { useState } from 'react';

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
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);

  const addStep = () => {
    const newStep = {
      id: Date.now().toString(),
      title: '',
      description: '',
      icon: ''
    };
    const updatedSteps = [...content.howItWorks.steps, newStep];
    updateContent('howItWorks.steps', updatedSteps);
    setEditingStep(newStep.id);
  };

  const removeStep = (index: number) => {
    const updatedSteps = content.howItWorks.steps.filter((_, i) => i !== index);
    updateContent('howItWorks.steps', updatedSteps);
    if (editingStep === content.howItWorks.steps[index].id) {
      setEditingStep(null);
    }
  };

  const duplicateStep = (index: number) => {
    const stepToDuplicate = content.howItWorks.steps[index];
    const newStep = {
      ...stepToDuplicate,
      id: Date.now().toString(),
      title: `${stepToDuplicate.title} (Copy)`
    };
    const updatedSteps = [
      ...content.howItWorks.steps.slice(0, index + 1),
      newStep,
      ...content.howItWorks.steps.slice(index + 1)
    ];
    updateContent('howItWorks.steps', updatedSteps);
    setEditingStep(newStep.id);
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    const updatedSteps = [...content.howItWorks.steps];
    const [movedStep] = updatedSteps.splice(fromIndex, 1);
    updatedSteps.splice(toIndex, 0, movedStep);
    updateContent('howItWorks.steps', updatedSteps);
  };

  const updateStep = (index: number, field: string, value: string) => {
    const updatedSteps = [...content.howItWorks.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    updateContent('howItWorks.steps', updatedSteps);
  };

  const toggleStepEdit = (stepId: string) => {
    setEditingStep(editingStep === stepId ? null : stepId);
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
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            📋 Process Steps
            <span className="bg-cyan-100 text-cyan-700 text-xs font-medium px-2 py-0.5 rounded-full">
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
              className="flex items-center gap-1 bg-cyan-600 text-gray-900 px-3 py-1.5 rounded text-xs font-medium hover:bg-cyan-700 transition-colors shadow-sm border border-cyan-600"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Step
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {content.howItWorks.steps.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-5xl text-gray-400 mb-3">📝</div>
              <p className="text-gray-500 text-sm mb-4">No steps yet. Add your first one!</p>
              <button
                type="button"
                onClick={addStep}
                className="bg-cyan-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-cyan-700 transition-colors"
              >
                Create First Step
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {content.howItWorks.steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`group bg-gradient-to-br from-white to-gray-50 border-2 rounded-lg transition-all duration-200 ${
                    editingStep === step.id 
                      ? 'border-cyan-400 shadow-lg ring-2 ring-cyan-100' 
                      : 'border-gray-200 hover:border-cyan-300 hover:shadow-md'
                  }`}
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveStep(index, index - 1)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(index, index + 1)}
                          disabled={index === content.howItWorks.steps.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <div className="bg-cyan-100 text-cyan-700 rounded-full px-3 py-1 font-bold text-xs">
                        Step #{index + 1}
                      </div>
                      {step.title && (
                        <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                          {step.title}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateStep(index)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Duplicate step"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStepEdit(step.id)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title={editingStep === step.id ? "Close editor" : "Edit step"}
                      >
                        {editingStep === step.id ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove step"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Live Preview */}
                  {(step.title || step.description || step.icon) && (
                    <div className="p-4 bg-white">
                      <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Preview</div>
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 relative overflow-hidden">
                        <div className="flex items-start gap-4 relative z-10">
                          {/* Icon Container */}
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100 text-2xl font-bold text-cyan-700" aria-hidden="true">
                            {step.icon ? (
                              <span className="material-symbols-outlined text-2xl">
                                {step.icon}
                              </span>
                            ) : (
                              index + 1
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="relative flex-1">
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
                            {!step.title && !step.description && (
                              <p className="text-sm text-gray-400 italic">No content yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Form */}
                  {editingStep === step.id && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                      <div className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wide">Edit Step Content</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Step Title *
                          </label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            placeholder="e.g., Book Your Pickup"
                            className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm px-3 py-2"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Icon
                          </label>
                          <IconPicker
                            value={step.icon}
                            onChange={(iconName) => updateStep(index, 'icon', iconName)}
                            placeholder="Select icon"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          value={step.description}
                          onChange={(e) => updateStep(index, 'description', e.target.value)}
                          placeholder="Brief description of this step..."
                          rows={3}
                          className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm px-3 py-2 resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingStep(null)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingStep(null)}
                          className="px-3 py-1.5 bg-cyan-600 text-gray-900 text-xs font-medium rounded hover:bg-cyan-700 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
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

