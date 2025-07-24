import { memo } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

export const StatsCard = memo<StatsCardProps>(
  ({ title, value, icon, bgColor, isLoading = false, className, onClick }) => (
    <div
      className={cn(
        'bg-white overflow-hidden shadow rounded-lg transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-lg hover:scale-105',
        className
      )}
      onClick={onClick}
    >
      <div className='p-5'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <div
              className={cn(
                'w-8 h-8 rounded-md flex items-center justify-center',
                bgColor
              )}
            >
              {icon}
            </div>
          </div>
          <div className='ml-5 w-0 flex-1'>
            <dl>
              <dt className='text-sm font-medium text-gray-500 truncate'>
                {title}
              </dt>
              <dd className='text-lg font-medium text-gray-900'>
                {isLoading ? (
                  <div className='animate-pulse bg-gray-200 h-6 w-16 rounded' />
                ) : (
                  value
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
);

StatsCard.displayName = 'StatsCard';
