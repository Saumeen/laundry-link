import React from 'react';

interface SocialLoginButtonProps {
  provider: 'google' | 'facebook' | 'apple';
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onClick,
  children,
  className = '',
}) => {
  const getLogoSrc = () => {
    switch (provider) {
      case 'google':
        return '/images/auth/google-logo.svg';
      case 'facebook':
        return '/images/auth/facebook-logo.svg';
      case 'apple':
        return '/images/auth/apple-logo.svg';
      default:
        return '';
    }
  };

  const getProviderColors = () => {
    switch (provider) {
      case 'google':
        return 'hover:bg-red-50 hover:border-red-200 hover:text-red-700';
      case 'facebook':
        return 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700';
      case 'apple':
        return 'hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800';
      default:
        return 'hover:bg-gray-50 hover:border-gray-200 hover:text-gray-700';
    }
  };

  return (
    <button
      type='button'
      onClick={onClick}
      className={`w-full flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm bg-white/80 backdrop-blur-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] ${getProviderColors()} ${className}`}
    >
      <img
        src={getLogoSrc()}
        alt={provider.charAt(0).toUpperCase() + provider.slice(1)}
        className='w-5 h-5 mr-2'
        style={{ display: 'inline-block' }}
      />
      <span className='font-medium text-sm'>{children}</span>
    </button>
  );
};

export default SocialLoginButton;
