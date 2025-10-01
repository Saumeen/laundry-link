'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
}

// Curated list of Material Symbols icons for laundry and business services
const ICON_OPTIONS = [
  { name: 'local_laundry_service', label: 'Laundry Service' },
  { name: 'dry_cleaning', label: 'Dry Cleaning' },
  { name: 'iron', label: 'Ironing' },
  { name: 'wash', label: 'Washing' },
  { name: 'bolt', label: 'Fast Service' },
  { name: 'king_bed', label: 'Bedding' },
  { name: 'shirt', label: 'Shirt' },
  { name: 'checkroom', label: 'Wardrobe' },
  { name: 'home', label: 'Home Service' },
  { name: 'schedule', label: 'Schedule' },
  { name: 'delivery_truck', label: 'Delivery' },
  { name: 'star', label: 'Quality' },
  { name: 'security', label: 'Security' },
  { name: 'phone', label: 'Contact' },
  { name: 'location_on', label: 'Location' },
  { name: 'payment', label: 'Payment' },
  { name: 'check_circle', label: 'Success' },
  { name: 'speed', label: 'Fast' },
  { name: 'favorite', label: 'Care' },
  { name: 'emoji_events', label: 'Excellence' },
  { name: 'refresh', label: 'Refresh' },
  { name: 'calendar_today', label: 'Calendar' },
  { name: 'chat', label: 'Support' },
  { name: 'settings', label: 'Settings' },
  { name: 'lock', label: 'Security' },
  { name: 'auto_awesome', label: 'Premium' },
  { name: 'cleaning_services', label: 'Cleaning' },
  { name: 'local_shipping', label: 'Shipping' },
  { name: 'access_time', label: 'Time' },
  { name: 'support_agent', label: 'Support' }
];

export function IconPicker({ value, onChange, placeholder = "Select an icon" }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedIcon = ICON_OPTIONS.find(icon => icon.name === value);
  const filteredIcons = ICON_OPTIONS.filter(icon => 
    icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Store current scroll position to prevent scroll on open
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      updateDropdownPosition();
      
      // Focus the search input without scrolling
      requestAnimationFrame(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus({ preventScroll: true });
        }
        // Restore scroll position if it changed
        if (window.scrollY !== scrollY || window.scrollX !== scrollX) {
          window.scrollTo(scrollX, scrollY);
        }
      });
      
      const handleResize = () => updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative z-[9999]">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onMouseDown={(e) => {
          // Prevent default behavior that might cause scrolling
          e.preventDefault();
        }}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-2">
          {selectedIcon ? (
            <>
              <span className="material-symbols-outlined text-gray-700 text-lg">
                {selectedIcon.name}
              </span>
              <span className="text-sm text-gray-700">{selectedIcon.label}</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">{placeholder}</span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          <div
            ref={dropdownRef}
            className="fixed z-[10000] bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-hidden"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width
            }}
          >
            <div className="p-2 border-b border-gray-200 bg-white">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search icons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
            <div className="max-h-48 overflow-y-auto bg-white">
              {filteredIcons.length > 0 ? (
                filteredIcons.map((icon) => (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleIconSelect(icon.name);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none bg-white"
                  >
                    <span className="material-symbols-outlined text-gray-700 text-lg">
                      {icon.name}
                    </span>
                    <span className="text-gray-700">{icon.label}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 bg-white">No icons found</div>
              )}
            </div>
          </div>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
        </>,
        document.body
      )}
    </div>
  );
}
