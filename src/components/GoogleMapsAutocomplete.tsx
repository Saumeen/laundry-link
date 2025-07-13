import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLoadScript } from '@react-google-maps/api';

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const libraries: ("places")[] = ["places"];

export default function GoogleMapsAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing your address...",
  className = "",
  disabled = false
}: GoogleMapsAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Handle clicks outside suggestions dropdown
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setShowSuggestions(false);

    if (!isLoaded || inputValue.length < 3) {
      setSuggestions([]);
      return;
    }

    // Check if Google Maps API is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps API not loaded properly');
      return;
    }

    try {
      setLoading(true);
      
      const request = {
        input: inputValue,
        componentRestrictions: { country: 'BH' },
        types: ['geocode']
      };

      console.log('Making autocomplete request:', request);

      // Use the traditional AutocompleteService with proper error handling
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      
      autocompleteService.getPlacePredictions(
        request,
        (predictions: any, status: any) => {
          setLoading(false);
          console.log('Autocomplete response:', { status, predictionsCount: predictions?.length });
          
          if (status === 'OK' && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
            // Log the status for debugging
            if (status !== 'ZERO_RESULTS') {
              console.warn('AutocompleteService status:', status);
            }
          }
        }
      );
    } catch (error) {
      setLoading(false);
      console.error('Error with AutocompleteService:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isLoaded, onChange]);

  const handleSuggestionClick = useCallback((suggestion: any) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (onAddressSelect) {
      onAddressSelect(suggestion);
    }
  }, [onChange, onAddressSelect]);

  if (loadError) {
    return (
      <div className="text-red-500 text-sm">
        Error loading Google Maps. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="font-medium text-gray-900">
                {suggestion.structured_formatting.main_text}
              </div>
              <div className="text-sm text-gray-500">
                {suggestion.structured_formatting.secondary_text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 