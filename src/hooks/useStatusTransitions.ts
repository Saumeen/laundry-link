import { useState, useCallback, useEffect } from 'react';
import logger from '@/lib/logger';

interface StatusTransition {
  value: string;
  label: string;
  description: string;
  color: string;
  icon: string;
}

interface UseStatusTransitionsReturn {
  allowedTransitions: StatusTransition[];
  loadingTransitions: boolean;
  error: string | null;
  fetchTransitions: (currentStatus: string) => Promise<void>;
}

export function useStatusTransitions(): UseStatusTransitionsReturn {
  const [allowedTransitions, setAllowedTransitions] = useState<
    StatusTransition[]
  >([]);
  const [loadingTransitions, setLoadingTransitions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransitions = useCallback(async (currentStatus: string) => {
    setLoadingTransitions(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/order-status-transitions?currentStatus=${currentStatus}`
      );

      if (response.ok) {
        const data = (await response.json()) as {
          allowedTransitions: StatusTransition[];
        };
        setAllowedTransitions(data.allowedTransitions);
      } else {
        const errorData = (await response.json()) as { error?: string };
        setError(errorData.error || 'Failed to fetch status transitions');
        setAllowedTransitions([]);
      }
    } catch (error) {
      logger.error('Error fetching status transitions:', error);
      setError('Failed to fetch status transitions');
      setAllowedTransitions([]);
    } finally {
      setLoadingTransitions(false);
    }
  }, []);

  return {
    allowedTransitions,
    loadingTransitions,
    error,
    fetchTransitions,
  };
}
