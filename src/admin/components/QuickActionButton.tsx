import { memo } from 'react';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  title: string;
  onClick: () => void;
  bgColor: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const QuickActionButton = memo<QuickActionButtonProps>(
  ({
    title,
    onClick,
    bgColor,
    isLoading = false,
    disabled = false,
    className,
    icon,
  }) => (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={cn(
        bgColor,
        'text-white px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 flex items-center justify-center space-x-2',
        (isLoading || disabled) && 'opacity-75 cursor-not-allowed',
        className
      )}
    >
      {isLoading && (
        <svg
          className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          />
        </svg>
      )}
      {icon && !isLoading && <span>{icon}</span>}
      <span>{isLoading ? 'Loading...' : title}</span>
    </button>
  )
);

QuickActionButton.displayName = 'QuickActionButton';
