'use client';

import { useStatusTransitions } from '@/hooks/useStatusTransitions';
import { useEffect } from 'react';

interface StatusTransitionSelectProps {
  currentStatus: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  showLoadingState?: boolean;
}

export default function StatusTransitionSelect({
  currentStatus,
  value,
  onChange,
  disabled = false,
  className = '',
  showLoadingState = true,
}: StatusTransitionSelectProps) {
  const { allowedTransitions, loadingTransitions, fetchTransitions } =
    useStatusTransitions();

  // Fetch transitions when current status changes
  useEffect(() => {
    if (currentStatus) {
      fetchTransitions(currentStatus);
    }
  }, [currentStatus, fetchTransitions]);

  return (
    <div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        disabled={disabled || loadingTransitions}
      >
        <option value={currentStatus}>
          {currentStatus.replace(/_/g, ' ')}
        </option>
        {allowedTransitions.map(transition => (
          <option key={transition.value} value={transition.value}>
            {transition.label}
          </option>
        ))}
      </select>
      {showLoadingState && loadingTransitions && (
        <p className='text-xs text-gray-500 mt-1'>
          Loading valid transitions...
        </p>
      )}
      {showLoadingState &&
        !loadingTransitions &&
        allowedTransitions.length === 0 && (
          <p className='text-xs text-gray-500 mt-1'>
            No valid transitions available
          </p>
        )}
    </div>
  );
}
