import React, { useState, useRef, useEffect, useCallback } from 'react';
import googleMapsV1Service, { GoogleMapsAddress } from '../lib/googleMapsV1';
import logger from '@/lib/logger';

interface GoogleMapsAutocompleteV1Props {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: GoogleMapsAddress) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  debounceMs?: number;
}

export default function GoogleMapsAutocompleteV1({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Start typing your address...',
  className = '',
  disabled = false,
  debounceMs = 300,
}: GoogleMapsAutocompleteV1Props) {
  const [suggestions, setSuggestions] = useState<GoogleMapsAddress[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle clicks outside suggestions dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      suggestionsRef.current &&
      !suggestionsRef.current.contains(event.target as Node)
    ) {
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Debounced search function
  const debouncedSearch = useCallback(async (inputValue: string) => {
    if (!inputValue || inputValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const results =
        await googleMapsV1Service.getAddressSuggestions(inputValue);

      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (err) {
      logger.error('Error fetching suggestions:', err);
      setError('Failed to load address suggestions');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      onChange(inputValue);
      setShowSuggestions(false);

      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout for debounced search
      debounceTimeoutRef.current = setTimeout(() => {
        debouncedSearch(inputValue);
      }, debounceMs);
    },
    [onChange, debouncedSearch, debounceMs]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: GoogleMapsAddress) => {
      onChange(suggestion.description);
      setShowSuggestions(false);
      setSuggestions([]);
      setError(null);

      if (onAddressSelect) {
        onAddressSelect(suggestion);
      }
    },
    [onChange, onAddressSelect]
  );

  const handleInputFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    },
    []
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className='relative'>
      <input
        ref={inputRef}
        type='text'
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
          error ? 'border-red-500' : ''
        } ${className}`}
        aria-describedby={error ? 'address-error' : undefined}
      />

      {/* Loading indicator */}
      {loading && (
        <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div id='address-error' className='mt-1 text-sm text-red-600'>
          {error}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className='absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1'
          role='listbox'
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className='p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors'
              onClick={() => handleSuggestionClick(suggestion)}
              role='option'
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }
              }}
            >
              <div className='font-medium text-gray-900'>
                {suggestion.structured_formatting.main_text}
              </div>
              <div className='text-sm text-gray-500'>
                {suggestion.structured_formatting.secondary_text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions &&
        suggestions.length === 0 &&
        !loading &&
        value.length >= 2 && (
          <div className='absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 p-3'>
            <div className='text-sm text-gray-500 text-center'>
              No addresses found. Try a different search term.
            </div>
          </div>
        )}
    </div>
  );
}
