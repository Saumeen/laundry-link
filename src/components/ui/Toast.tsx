'use client';

import toast, { Toaster } from 'react-hot-toast';

// Custom hook to maintain compatibility with existing code
export function useToast() {
  return {
    showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration = 5000) => {
      const options = {
        duration: duration,
        style: {
          background: getToastColor(type),
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        icon: getToastIcon(type),
      };

      switch (type) {
        case 'success':
          return toast.success(message, options);
        case 'error':
          return toast.error(message, options);
        case 'warning':
          return toast(message, { ...options, icon: getToastIcon(type) });
        case 'info':
          return toast(message, { ...options, icon: getToastIcon(type) });
        default:
          return toast(message, options);
      }
    },
    removeToast: (toastId: string) => {
      toast.dismiss(toastId);
    },
    toasts: [], // Not used with react-hot-toast but kept for compatibility
  };
}

// Toast provider component that renders the Toaster
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={12}
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            duration: 5000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
          loading: {
            style: {
              background: '#6366f1',
              color: '#fff',
            },
          },
        }}
      />
    </>
  );
}

// Helper functions for styling
function getToastColor(type: string): string {
  switch (type) {
    case 'success':
      return '#10b981';
    case 'error':
      return '#ef4444';
    case 'warning':
      return '#f59e0b';
    case 'info':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
}

function getToastIcon(type: string): string {
  switch (type) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    default:
      return '';
  }
}
