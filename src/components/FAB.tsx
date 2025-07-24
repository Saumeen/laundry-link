import React from 'react';

interface FABProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
}

export default function FAB({ onClick, icon, label }: FABProps) {
  return (
    <button
      onClick={onClick}
      className='fixed z-50 bottom-16 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center w-16 h-16 md:hidden focus:outline-none'
      style={{ minWidth: 64, minHeight: 64 }}
      aria-label={label || 'Add'}
    >
      <span className='text-3xl' aria-hidden>
        {icon}
      </span>
    </button>
  );
}
