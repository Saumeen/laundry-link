import type { LandingPageContent } from './types';
import { SectionHeader } from './SectionHeader';

interface HeroEditorProps {
  content: LandingPageContent;
  updateContent: (path: string, value: any) => void;
  uploading: boolean;
  uploadProgress: { [key: string]: number };
  onImageUpload: (file: File, fieldPath: string) => void;
}

export function HeroEditor({
  content,
  updateContent,
  uploading,
  uploadProgress,
  onImageUpload
}: HeroEditorProps) {

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hero Section</h3>
            <p className="text-xs text-gray-500">Main landing page banner with title, subtitle, and CTA button</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const modal = document.getElementById('hero-background-modal');
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
        {/* Content Fields */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          ✏️ Content
        </h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Hero Title</label>
            <input
              type="text"
              value={content.hero.title}
              onChange={(e) => updateContent('hero.title', e.target.value)}
              placeholder="e.g., Laundry & dry cleaning with 24h delivery"
              className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Hero Subtitle</label>
            <textarea
              value={content.hero.subtitle}
              onChange={(e) => updateContent('hero.subtitle', e.target.value)}
              placeholder="e.g., Free pickup and delivery service"
              rows={2}
              className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm px-3 py-2 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">CTA Button Text</label>
            <input
              type="text"
              value={content.hero.ctaText}
              onChange={(e) => updateContent('hero.ctaText', e.target.value)}
              placeholder="e.g., Get Started"
              className="block w-full border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            📸 Images
          </h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const modal = document.getElementById('hero-background-modal');
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
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Background Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImageUpload(file, 'hero.backgroundImage');
                }
              }}
              disabled={uploading}
              className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50"
            />
            {uploadProgress['hero.backgroundImage'] !== undefined && (
              <div className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress['hero.backgroundImage']}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Uploading... {uploadProgress['hero.backgroundImage']}%
                </p>
              </div>
            )}
            {content.hero.backgroundImage && (
              <div className="mt-2">
                <img
                  src={content.hero.backgroundImage}
                  alt="Background preview"
                  className="h-24 w-full rounded-lg object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Side Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImageUpload(file, 'hero.sideImage');
                }
              }}
              disabled={uploading}
              className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50"
            />
            {uploadProgress['hero.sideImage'] !== undefined && (
              <div className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress['hero.sideImage']}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Uploading... {uploadProgress['hero.sideImage']}%
                </p>
              </div>
            )}
            {content.hero.sideImage && (
              <div className="mt-2">
                <img
                  src={content.hero.sideImage}
                  alt="Side preview"
                  className="h-24 w-full rounded-lg object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Hero Image Modal */}
      <div id="hero-background-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📸 Hero Image Guidelines</h3>
              <button
                type="button"
                onClick={() => {
                  const modal = document.getElementById('hero-background-modal');
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
                    <span>Background Image:</span>
                    <span className="font-medium">1920x1080 pixels</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Side Image:</span>
                    <span className="font-medium">600x800 pixels</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Size:</span>
                    <span className="font-medium">Under 5MB</span>
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
                  <li>• Use high-quality, professional images</li>
                  <li>• Ensure good contrast with text</li>
                  <li>• Choose images that represent your brand</li>
                  <li>• Test readability on different devices</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const modal = document.getElementById('hero-background-modal');
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

