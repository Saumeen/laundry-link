'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import LoadingOverlay from '../components/ui/LoadingOverlay';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const showLoading = useCallback((message: string = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('Loading...');
  }, []);

  const value = {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />
    </LoadingContext.Provider>
  );
} 