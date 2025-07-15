'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { LoadingProvider } from '../contexts/LoadingContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <LoadingProvider>
        {children}
      </LoadingProvider>
    </SessionProvider>
  );
} 