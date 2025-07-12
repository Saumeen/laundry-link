import React from 'react';

interface SocialLoginButtonProps {
  provider: 'google' | 'facebook' | 'apple';
  onClick: () => void;
  children: React.ReactNode;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ provider, onClick, children }) => {
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

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
    >
      <img 
        src={getLogoSrc()} 
        alt={provider.charAt(0).toUpperCase() + provider.slice(1)} 
        className="w-5 h-5 mr-2" 
        style={{ display: 'inline-block' }}
      />
      {children}
    </button>
  );
};

export default SocialLoginButton; 