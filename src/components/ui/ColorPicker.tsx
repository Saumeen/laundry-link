'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

// Popular Tailwind colors with their hex values
const PRESET_COLORS = [
  { name: 'Blue', value: 'blue-600', hex: '#2563eb' },
  { name: 'Green', value: 'green-600', hex: '#16a34a' },
  { name: 'Red', value: 'red-600', hex: '#dc2626' },
  { name: 'Orange', value: 'orange-600', hex: '#ea580c' },
  { name: 'Purple', value: 'purple-600', hex: '#9333ea' },
  { name: 'Pink', value: 'pink-600', hex: '#db2777' },
  { name: 'Indigo', value: 'indigo-600', hex: '#4f46e5' },
  { name: 'Teal', value: 'teal-600', hex: '#0d9488' },
  { name: 'Yellow', value: 'yellow-600', hex: '#ca8a04' },
  { name: 'Cyan', value: 'cyan-600', hex: '#0891b2' },
  { name: 'Emerald', value: 'emerald-600', hex: '#059669' },
  { name: 'Gray', value: 'gray-600', hex: '#4b5563' },
  { name: 'Rose', value: 'rose-600', hex: '#e11d48' },
  { name: 'Amber', value: 'amber-600', hex: '#d97706' },
  { name: 'Lime', value: 'lime-600', hex: '#65a30d' },
  { name: 'Sky', value: 'sky-600', hex: '#0284c7' },
];

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerColor, setPickerColor] = useState('#2563eb');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the current color's hex value
  const getCurrentHex = () => {
    const preset = PRESET_COLORS.find(c => c.value === value);
    if (preset) return preset.hex;
    
    // Check if value is already a hex code
    if (value.startsWith('#')) return value;
    
    // Default color
    return '#2563eb';
  };

  // Update picker color when value changes
  useEffect(() => {
    setPickerColor(getCurrentHex());
  }, [value]);

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 280) // Minimum width for the picker
      });
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handlePickerColorChange = (hex: string) => {
    setPickerColor(hex);
    onChange(hex);
  };

  useEffect(() => {
    if (isOpen) {
      // Store current scroll position to prevent scroll on open
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      updateDropdownPosition();
      
      // Restore scroll position if it changed
      requestAnimationFrame(() => {
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
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onMouseDown={(e) => {
          // Prevent default behavior that might cause scrolling
          e.preventDefault();
        }}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-6 h-6 rounded border border-gray-300 shadow-sm"
            style={{ backgroundColor: getCurrentHex() }}
          />
          <span className="text-sm text-gray-700">
            {PRESET_COLORS.find(c => c.value === value)?.name || 'Custom Color'}
          </span>
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
            className="fixed z-[10000] bg-white border border-gray-300 rounded-lg shadow-2xl"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width
            }}
          >
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Pick a Color</h4>
              
              {/* Visual Color Picker */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="color"
                    value={pickerColor}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePickerColorChange(e.target.value);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-24 h-24 cursor-pointer rounded-lg border-2 border-gray-300 hover:border-blue-400 transition-colors overflow-hidden shadow-sm"
                    style={{ 
                      appearance: 'none', 
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      padding: '0',
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Color Code
                  </label>
                  <input
                    type="text"
                    value={pickerColor}
                    onChange={(e) => {
                      const hex = e.target.value;
                      setPickerColor(hex);
                      if (/^#[0-9A-F]{6}$/i.test(hex)) {
                        onChange(hex);
                      }
                    }}
                    placeholder="#000000"
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Click the color box to pick any color
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Backdrop */}
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


