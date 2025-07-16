import React from 'react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'orders', label: 'Orders', icon: '📦' },
  { id: 'addresses', label: 'Addresses', icon: '🏠' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'wallet', label: 'Wallet', icon: '💰' },
];

export default function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex justify-between px-2 py-1 shadow-lg md:hidden">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center flex-1 py-2 px-1 focus:outline-none ${activeTab === tab.id ? 'text-blue-600 font-bold' : 'text-gray-500'}`}
          style={{ minWidth: 0 }}
        >
          <span className="text-xl mb-0.5" aria-hidden>{tab.icon}</span>
          <span className="text-xs leading-tight" style={{ fontSize: '0.75rem' }}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
} 