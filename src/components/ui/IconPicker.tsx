'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Shirt, 
  Truck, 
  Clock, 
  Shield, 
  Star, 
  Users, 
  Phone, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  Zap, 
  Heart, 
  Award, 
  RefreshCw, 
  Home, 
  Calendar, 
  MessageCircle, 
  Settings, 
  Lock, 
  Sparkles 
} from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
}

// Curated list of business and laundry-related icons
const ICON_OPTIONS = [
  { name: 'shirt', component: Shirt, label: 'Shirt/Clothing' },
  { name: 'truck', component: Truck, label: 'Delivery' },
  { name: 'clock', component: Clock, label: 'Time/Schedule' },
  { name: 'shield', component: Shield, label: 'Security/Trust' },
  { name: 'star', component: Star, label: 'Quality/Rating' },
  { name: 'users', component: Users, label: 'Team/Service' },
  { name: 'phone', component: Phone, label: 'Contact/Support' },
  { name: 'map-pin', component: MapPin, label: 'Location' },
  { name: 'credit-card', component: CreditCard, label: 'Payment' },
  { name: 'check-circle', component: CheckCircle, label: 'Success/Complete' },
  { name: 'zap', component: Zap, label: 'Fast/Quick' },
  { name: 'heart', component: Heart, label: 'Care/Love' },
  { name: 'award', component: Award, label: 'Excellence' },
  { name: 'refresh-cw', component: RefreshCw, label: 'Refresh/Cycle' },
  { name: 'home', component: Home, label: 'Home Service' },
  { name: 'calendar', component: Calendar, label: 'Schedule' },
  { name: 'message-circle', component: MessageCircle, label: 'Communication' },
  { name: 'settings', component: Settings, label: 'Customization' },
  { name: 'lock', component: Lock, label: 'Security' },
  { name: 'sparkles', component: Sparkles, label: 'Premium/Quality' }
];

export function IconPicker({ value, onChange, placeholder = "Select an icon" }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative z-[9999]">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-2">
          {selectedIcon ? (
            <>
              <selectedIcon.component className="h-4 w-4 text-gray-700" />
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
                type="text"
                placeholder="Search icons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto bg-white">
              {filteredIcons.length > 0 ? (
                filteredIcons.map((icon) => (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => handleIconSelect(icon.name)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none bg-white"
                  >
                    <icon.component className="h-4 w-4 text-gray-700" />
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
            onClick={() => setIsOpen(false)}
          />
        </>,
        document.body
      )}
    </div>
  );
}
