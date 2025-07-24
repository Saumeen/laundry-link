'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

const countries = [
  { code: 'BH', name: 'Bahrain', dialCode: '+973' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'AE', name: 'UAE', dialCode: '+971' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965' },
  { code: 'OM', name: 'Oman', dialCode: '+968' },
  { code: 'QA', name: 'Qatar', dialCode: '+974' },
  { code: 'JO', name: 'Jordan', dialCode: '+962' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961' },
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
];

export default function PhoneInput({
  value,
  onChange,
  placeholder = 'Enter phone number',
  className = '',
  error,
  disabled = false,
  required = false,
  label,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find(c => c.code === 'BH') || countries[0]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Filter countries based on search query
  const filteredCountries = useMemo(
    () =>
      countries.filter(
        country =>
          country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.dialCode.includes(searchQuery)
      ),
    [searchQuery]
  );

  const handleCountryChange = useCallback(
    (country: (typeof countries)[0]) => {
      setSelectedCountry(country);
      // Update the phone number with new country code
      const phoneNumber = value.replace(/^\+\d+/, '');
      onChange(`${country.dialCode}${phoneNumber}`);
      setIsOpen(false);
      setSearchQuery('');
    },
    [value, onChange]
  );

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      // Remove any non-digit characters except +
      const cleaned = input.replace(/[^\d+]/g, '');

      // If it starts with a country code, use it as is
      if (cleaned.startsWith('+')) {
        onChange(cleaned);
      } else {
        // Otherwise, prepend the selected country code
        onChange(`${selectedCountry.dialCode}${cleaned}`);
      }
    },
    [selectedCountry.dialCode, onChange]
  );

  const getDisplayValue = useCallback(() => {
    if (!value) return '';
    // If the value already has a country code, return it as is
    if (value.startsWith('+')) {
      return value;
    }
    // Otherwise, prepend the selected country code
    return `${selectedCountry.dialCode}${value}`;
  }, [value, selectedCountry.dialCode]);

  const handleDropdownToggle = useCallback(() => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          {label} {required && <span className='text-red-500'>*</span>}
        </label>
      )}

      <div className='relative' ref={dropdownRef}>
        {/* Country Selector */}
        <div className='absolute left-3 top-1/2 transform -translate-y-1/2 z-10'>
          <button
            type='button'
            onClick={handleDropdownToggle}
            disabled={disabled}
            className='flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50 font-medium'
          >
            <span className='font-medium'>{selectedCountry.code}</span>
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>

          {/* Country Dropdown */}
          {isOpen && (
            <div className='absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg z-20'>
              {/* Search Input */}
              <div className='sticky top-0 bg-white border-b border-gray-200 p-2'>
                <input
                  ref={searchInputRef}
                  type='text'
                  placeholder='Search countries...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                />
              </div>

              {/* Country List */}
              <div className='max-h-48 overflow-y-auto'>
                {filteredCountries.length > 0 ? (
                  filteredCountries.map(country => (
                    <button
                      key={country.code}
                      type='button'
                      onClick={() => handleCountryChange(country)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between ${
                        selectedCountry.code === country.code
                          ? 'bg-blue-50 text-blue-700'
                          : ''
                      }`}
                    >
                      <span className='text-sm'>{country.name}</span>
                      <span className='text-xs text-gray-500'>
                        {country.dialCode}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className='px-3 py-2 text-sm text-gray-500 text-center'>
                    No countries found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Input */}
        <input
          type='tel'
          value={getDisplayValue()}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-16 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/50'}
            text-sm
          `}
        />
      </div>

      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
    </div>
  );
}
