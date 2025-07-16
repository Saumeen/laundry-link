'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { LoadingProvider } from '../contexts/LoadingContext';
import { ToastProvider } from '../components/ui/Toast';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <LoadingProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </LoadingProvider>
    </SessionProvider>
  );
} 