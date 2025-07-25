import { memo } from 'react';
import { StatsCard } from './StatsCard';
import type { DashboardStats as DashboardStatsType } from '@/shared/types';

interface DashboardStatsProps {
  stats: DashboardStatsType | null;
  isLoading?: boolean;
  onStatsCardClick?: (statType: keyof DashboardStatsType) => void;
}

// Icons for different stat types
const getStatIcon = (statType: keyof DashboardStatsType) => {
  switch (statType) {
    case 'totalOrders':
      return (
        <svg
          className='w-5 h-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
      );
    case 'totalCustomers':
      return (
        <svg
          className='w-5 h-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
          />
        </svg>
      );
    case 'totalRevenue':
      return (
        <svg
          className='w-5 h-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
          />
        </svg>
      );
    case 'activeStaff':
      return (
        <svg
          className='w-5 h-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
          />
        </svg>
      );
    case 'pendingOrders':
      return (
        <svg
          className='w-5 h-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      );
    case 'completedOrders':
      return (
        <svg
          className='w-5 h-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      );
    case 'activeDrivers':
      return (
        <svg
          className='w-5 h-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      );
    default:
      return (
        <svg
          className='w-5 h-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
          />
        </svg>
      );
  }
};

// Background colors for different stat types
const getStatBgColor = (statType: keyof DashboardStatsType) => {
  switch (statType) {
    case 'totalOrders':
      return 'bg-blue-500';
    case 'totalCustomers':
      return 'bg-green-500';
    case 'totalRevenue':
      return 'bg-yellow-500';
    case 'activeStaff':
      return 'bg-purple-500';
    case 'pendingOrders':
      return 'bg-orange-500';
    case 'completedOrders':
      return 'bg-green-600';
    case 'activeDrivers':
      return 'bg-indigo-500';
    default:
      return 'bg-gray-500';
  }
};

// Format stat values
const formatStatValue = (statType: keyof DashboardStatsType, value: number) => {
  switch (statType) {
    case 'totalRevenue':
      return `$${value.toLocaleString()}`;
    default:
      return value.toLocaleString();
  }
};

export const DashboardStats = memo<DashboardStatsProps>(
  ({ stats, isLoading = false, onStatsCardClick }) => {
    if (!stats) {
      return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {Array.from({ length: 7 }).map((_, index) => (
            <StatsCard
              key={index}
              title='Loading...'
              value='0'
              icon={<div className='w-5 h-5' />}
              bgColor='bg-gray-300'
              isLoading={true}
            />
          ))}
        </div>
      );
    }

    const statEntries = Object.entries(stats) as Array<
      [keyof DashboardStatsType, number]
    >;

    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {statEntries.map(([statType, value]) => (
          <StatsCard
            key={statType}
            title={statType
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())}
            value={formatStatValue(statType, value)}
            icon={getStatIcon(statType)}
            bgColor={getStatBgColor(statType)}
            isLoading={isLoading}
            onClick={
              onStatsCardClick ? () => onStatsCardClick(statType) : undefined
            }
          />
        ))}
      </div>
    );
  }
);

DashboardStats.displayName = 'DashboardStats';
