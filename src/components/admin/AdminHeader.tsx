"use client";

import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backUrl?: string;
  showBackButton?: boolean;
  rightContent?: React.ReactNode;
}

export default function AdminHeader({
  title,
  subtitle,
  onBack,
  backUrl,
  showBackButton = true,
  rightContent
}: AdminHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
              >
                <svg 
                  className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {rightContent && (
            <div className="flex items-center space-x-3">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 