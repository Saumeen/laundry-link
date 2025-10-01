import { IconPicker } from '@/components/ui/IconPicker';
import type { LandingPageContent } from './types';
import { SectionHeader } from './SectionHeader';

interface ServicesEditorProps {
  content: LandingPageContent;
  updateContent: (path: string, value: any) => void;
  uploading: boolean;
  uploadProgress: { [key: string]: number };
  onImageUpload: (file: File, fieldPath: string) => void;
}

export function ServicesEditor({
  content,
  updateContent,
  uploading,
  uploadProgress,
  onImageUpload
}: ServicesEditorProps) {

  const addService = () => {
    const newService = {
      id: Date.now().toString(),
      name: '',
      description: '',
      image: '',
      icon: 'local_laundry_service',
      learnMore: {
        enabled: true,
        text: 'Learn More',
        link: '/services' // Fixed route to services navigation
      }
    };
    updateContent('services.items', [...content.services.items, newService]);
  };

  const removeService = (index: number) => {
    updateContent('services.items', content.services.items.filter((_, i) => i !== index));
  };

  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-indigo-500',
    'from-yellow-500 to-orange-500',
    'from-green-500 to-emerald-500',
  ];

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧺</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Services Section</h3>
            <p className="text-xs text-gray-500">Display your service offerings with descriptions and images</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const modal = document.getElementById('image-optimization-modal');
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
          <div className="mb-6">
        <label className="block text-xs font-medium text-gray-700 mb-1">Section Title</label>
        <input
          type="text"
          value={content.services.title}
          onChange={(e) => updateContent('services.title', e.target.value)}
          placeholder="e.g., Professional Laundry & Dry Cleaning Services"
          className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-700 mb-1">Section Description</label>
        <textarea
          value={content.services.description || ''}
          onChange={(e) => updateContent('services.description', e.target.value)}
          placeholder="e.g., From everyday laundry to special care items, we offer a comprehensive range of professional services to meet all your laundry needs in Bahrain."
          rows={3}
          className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 resize-none"
        />
      </div>

      {/* Services Section */}
      <div className="border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            🧺 Service Items
            <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded">
              {content.services.items.length}
            </span>
          </h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const modal = document.getElementById('image-optimization-modal');
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
                addService();
              }}
              className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-purple-700 transition-colors"
            >
              + Add Service
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {content.services.items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-5xl text-gray-400 mb-3">🧺</div>
            <p className="text-gray-500 text-sm">No services yet. Add your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.services.items.map((service, index) => {
              const gradient = gradients[index % gradients.length];
              
              return (
                <div key={service.id} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="bg-purple-100 text-purple-600 rounded px-2 py-0.5 font-bold text-xs">
                      #{index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        removeService(index);
                      }}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors text-sm"
                      title="Remove service"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  {/* Live Preview */}
                  {(service.icon || service.name || service.description || service.image) && (
                    <div className="mb-3 p-4 rounded-2xl bg-white shadow-lg border border-gray-200 relative overflow-hidden">
                      {/* Icon Badge Preview - positioned like actual Services component */}
                      {service.icon && (
                        <div className={`absolute -top-2 -right-2 z-10 w-12 h-12 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br ${gradient}`}>
                          <span className="material-symbols-outlined text-white text-lg font-bold">
                            {service.icon}
                          </span>
                        </div>
                      )}
                      
                      {/* Image Preview - matching actual Services component sizing */}
                      {service.image && (
                        <div className="relative h-48 w-full overflow-hidden rounded-xl mb-3">
                          <img
                            src={service.image}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Content Preview - matching actual Services component styling */}
                      <div className="relative z-10">
                        {service.name && (
                          <h3 className="text-lg font-bold text-gray-800 mb-2">
                            {service.name}
                          </h3>
                        )}
                        {service.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        {(service.learnMore?.enabled !== false) && (
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <span
                              style={{
                                background: "linear-gradient(90deg, var(--primary-color) 0%, #ff6b6b 50%, var(--primary-color) 100%)",
                                backgroundSize: "200% auto",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text"
                              }}
                            >
                              {service.learnMore?.text || 'Learn More'}
                            </span>
                            <span 
                              className="material-symbols-outlined text-sm"
                              style={{
                                color: 'var(--primary-color)'
                              }}
                              aria-hidden="true"
                            >
                              arrow_forward
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Service Name
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => {
                            const newItems = [...content.services.items];
                            newItems[index].name = e.target.value;
                            updateContent('services.items', newItems);
                          }}
                          placeholder="e.g., Wash & Iron"
                          className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs px-2 py-1.5"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Icon
                        </label>
                        <IconPicker
                          value={service.icon || 'local_laundry_service'}
                          onChange={(icon) => {
                            const newItems = [...content.services.items];
                            newItems[index].icon = icon;
                            updateContent('services.items', newItems);
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
                        value={service.description}
                        onChange={(e) => {
                          const newItems = [...content.services.items];
                          newItems[index].description = e.target.value;
                          updateContent('services.items', newItems);
                        }}
                        placeholder="Brief description of the service"
                        rows={2}
                        className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs px-2 py-1.5 resize-none"
                      />
                    </div>
                    
                    <div className="border-t border-gray-200 pt-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        📷 Service Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onImageUpload(file, `services.items.${index}.image`);
                          }
                        }}
                        disabled={uploading}
                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
                      />
                      {uploadProgress[`services.items.${index}.image`] !== undefined && (
                        <div className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[`services.items.${index}.image`]}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Uploading... {uploadProgress[`services.items.${index}.image`]}%
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-gray-700">
                          🔗 Learn More Button
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={service.learnMore?.enabled ?? true}
                            onChange={(e) => {
                              const newItems = [...content.services.items];
                              newItems[index].learnMore = {
                                enabled: e.target.checked,
                                text: newItems[index].learnMore?.text || 'Learn More',
                                link: '/services' // Fixed route to services navigation
                              };
                              updateContent('services.items', newItems);
                            }}
                            className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="text-xs text-gray-600">Enable</span>
                        </label>
                      </div>
                      <div className={`space-y-2 ${!(service.learnMore?.enabled ?? true) ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Button Text</label>
                          <input
                            type="text"
                            value={service.learnMore?.text || 'Learn More'}
                            onChange={(e) => {
                              const newItems = [...content.services.items];
                              newItems[index].learnMore = {
                                enabled: newItems[index].learnMore?.enabled ?? true,
                                text: e.target.value,
                                link: '/services' // Fixed route to services navigation
                              };
                              updateContent('services.items', newItems);
                            }}
                            placeholder="e.g., Learn More"
                            disabled={!(service.learnMore?.enabled ?? true)}
                            className="block w-full border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs px-2 py-1.5 disabled:bg-gray-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Will redirect to Services page</p>
                        </div>
                      </div>
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

      {/* Image Optimization Modal */}
      <div id="image-optimization-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📸 Image Guidelines</h3>
              <button
                type="button"
                onClick={() => {
                  const modal = document.getElementById('image-optimization-modal');
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
                    <span className="font-medium">400x300 pixels</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Size:</span>
                    <span className="font-medium">Under 1.5MB</span>
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
                  <li>• Use high-quality, clear images</li>
                  <li>• Show your service in action</li>
                  <li>• Ensure good lighting and composition</li>
                  <li>• Keep images professional and clean</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const modal = document.getElementById('image-optimization-modal');
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
  );
}

