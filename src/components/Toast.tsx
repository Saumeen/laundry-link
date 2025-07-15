import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  let bg = 'bg-gray-800', text = 'text-white';
  if (type === 'success') bg = 'bg-green-600';
  if (type === 'error') bg = 'bg-red-600';

  return (
    <div className={`fixed bottom-28 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg ${bg} ${text} flex items-center min-w-[200px] max-w-[90vw] transition-all`}>
      <span className="flex-1 text-center text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-3 text-lg font-bold focus:outline-none" aria-label="Close">×</button>
    </div>
  );
} 