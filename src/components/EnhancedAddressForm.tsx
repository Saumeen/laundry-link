import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import googleMapsService, { GeocodingResult } from '../lib/googleMaps';
import PhoneInput from './PhoneInput';

// Define proper types for form data
export interface FormData {
  googleAddress: string;
  city: string;
  area: string;
  building: string;
  locationType: 'hotel' | 'home' | 'flat' | 'office';
  hotelName: string;
  roomNumber: string;
  house: string;
  road: string;
  block: string;
  flatNumber: string;
  officeNumber: string;
  collectionMethod: string;
  homeCollectionMethod: string;
  contactNumber: string;
}

interface EnhancedAddressFormProps {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  errors: { [key: string]: string };
  setErrors: (errors: { [key: string]: string } | ((prev: { [key: string]: string }) => { [key: string]: string })) => void;
  selectedAddress: GeocodingResult | null;
  setSelectedAddress: (address: GeocodingResult | null) => void;
  addressLoading: boolean;
  setAddressLoading: (loading: boolean) => void;
  onAddressSelect: (suggestion: any) => void;
}

const libraries: ("places")[] = ["places"];

// Default center for Bahrain
const defaultCenter = {
  lat: 26.0667,
  lng: 50.5577
};

export default function EnhancedAddressForm({
  formData,
  setFormData,
  errors,
  setErrors,
  selectedAddress,
  setSelectedAddress,
  addressLoading,
  setAddressLoading,
  onAddressSelect
}: EnhancedAddressFormProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.LatLng | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isGpsLocation, setIsGpsLocation] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Handle clicks outside search suggestions
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
      setShowSearchSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Handle map click to set marker
  const handleMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    setMarker(event.latLng);
    setMapLoading(true);

    try {
      // Reverse geocode the clicked location
      const geocodingResult = await googleMapsService.reverseGeocode(lat, lng);
      
      if (geocodingResult) {
        setSelectedAddress(geocodingResult);
        setIsGpsLocation(false); // Clear GPS location flag
        setFormData((prev: FormData) => ({
          ...prev,
          googleAddress: geocodingResult.formatted_address,
          city: geocodingResult.city || '',
          area: geocodingResult.area || '',
          building: geocodingResult.building || '',
          // Auto-set location type based on detected type
          locationType: (geocodingResult.locationType as 'hotel' | 'home' | 'flat' | 'office') || 'flat',
          // Clear other location-specific fields
          hotelName: '',
          roomNumber: '',
          house: '',
          road: '',
          block: '',
          flatNumber: '',
          officeNumber: '',
        }));
        
        // Clear the googleAddress error
        setErrors((prev: { [key: string]: string }) => {
          const newErrors = { ...prev };
          delete newErrors.googleAddress;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setMapLoading(false);
    }
  }, [setSelectedAddress, setFormData, setErrors]);

  // Get current device location using GPS
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setGpsLoading(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Create a LatLng object for the marker
      const latLng = new google.maps.LatLng(latitude, longitude);
      setMarker(latLng);

      // Reverse geocode the current location
      const geocodingResult = await googleMapsService.reverseGeocode(latitude, longitude);
      
      if (geocodingResult) {
        setSelectedAddress(geocodingResult);
        setIsGpsLocation(true); // Mark as GPS location
        setFormData((prev: FormData) => ({
          ...prev,
          googleAddress: geocodingResult.formatted_address,
          city: geocodingResult.city || '',
          area: geocodingResult.area || '',
          building: geocodingResult.building || '',
          // Auto-set location type based on detected type
          locationType: (geocodingResult.locationType as 'hotel' | 'home' | 'flat' | 'office') || 'flat',
          // Clear other location-specific fields
          hotelName: '',
          roomNumber: '',
          house: '',
          road: '',
          block: '',
          flatNumber: '',
          officeNumber: '',
        }));
        
        // Pan map to the current location
        if (map) {
          map.panTo(latLng);
          map.setZoom(16);
        }
        
        // Clear the googleAddress error
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.googleAddress;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location access denied. Please allow location access in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable. Please try again.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out. Please try again.');
            break;
          default:
            alert('An error occurred while getting your location. Please try again.');
        }
      } else {
        alert('An error occurred while getting your location. Please try again.');
      }
    } finally {
      setGpsLoading(false);
    }
  }, [setSelectedAddress, setFormData, setErrors, map]);

  // Handle search input change
  const handleSearchChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearchQuery(inputValue);
    setShowSearchSuggestions(false);

    if (!isLoaded || inputValue.length < 3) {
      setSearchSuggestions([]);
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps API not loaded properly');
      // Show a user-friendly error message
      setErrors((prev: { [key: string]: string }) => ({
        ...prev,
        googleAddress: 'Google Maps is not available. Please refresh the page and try again.'
      }));
      return;
    }

    try {
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      
      // Use geocode type for address search (most compatible)
      const request = {
        input: inputValue,
        componentRestrictions: { country: 'BH' },
        types: ['geocode'] // This includes all address types
      };

      console.log('Searching for:', inputValue);

      autocompleteService.getPlacePredictions(
        request,
        (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
          console.log('Search status:', status, 'Predictions:', predictions?.length || 0);
          
          if (status === 'OK' && predictions && predictions.length > 0) {
            console.log('Found predictions:', predictions);
            setSearchSuggestions(predictions);
            setShowSearchSuggestions(true);
            // Clear any previous errors
            setErrors((prev: { [key: string]: string }) => {
              const newErrors = { ...prev };
              delete newErrors.googleAddress;
              return newErrors;
            });
          } else {
            console.log('No predictions found or error:', status);
            setSearchSuggestions([]);
            setShowSearchSuggestions(false);
            
            // Show user-friendly error messages for different status codes
            if (status === 'ZERO_RESULTS') {
              setErrors((prev: { [key: string]: string }) => ({
                ...prev,
                googleAddress: 'No results found. Try a different search term.'
              }));
            } else if (status === 'REQUEST_DENIED') {
              setErrors((prev: { [key: string]: string }) => ({
                ...prev,
                googleAddress: 'Search is temporarily unavailable. Please try again later.'
              }));
            }
          }
        }
      );
    } catch (error) {
      console.error('Error with search autocomplete:', error);
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      setErrors((prev: { [key: string]: string }) => ({
        ...prev,
        googleAddress: 'Search error occurred. Please try again.'
      }));
    }
  }, [isLoaded, setErrors]);

  // Handle search suggestion click
  const handleSearchSuggestionClick = useCallback(async (suggestion: google.maps.places.AutocompletePrediction) => {
    setSearchQuery(suggestion.description);
    setShowSearchSuggestions(false);
    setSearchSuggestions([]);
    
    try {
      setAddressLoading(true);
      const geocodingResult = await googleMapsService.geocodePlaceId(suggestion.place_id);
      
      if (geocodingResult) {
        setSelectedAddress(geocodingResult);
        setIsGpsLocation(false); // Clear GPS location flag
        setFormData((prev: FormData) => ({
          ...prev,
          googleAddress: suggestion.description,
          city: geocodingResult.city || '',
          area: geocodingResult.area || '',
          building: geocodingResult.building || '',
          // Auto-set location type based on detected type
          locationType: (geocodingResult.locationType as 'hotel' | 'home' | 'flat' | 'office') || 'flat',
          // Clear other location-specific fields
          hotelName: '',
          roomNumber: '',
          house: '',
          road: '',
          block: '',
          flatNumber: '',
          officeNumber: '',
        }));
        
        // Set marker on map
        if (geocodingResult.latitude && geocodingResult.longitude) {
          const latLng = new google.maps.LatLng(geocodingResult.latitude, geocodingResult.longitude);
          setMarker(latLng);
          
          // Pan map to the selected location
          if (map) {
            map.panTo(latLng);
            map.setZoom(16);
          }
        }
        
        // Clear the googleAddress error
        setErrors((prev: { [key: string]: string }) => {
          const newErrors = { ...prev };
          delete newErrors.googleAddress;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    } finally {
      setAddressLoading(false);
    }
  }, [setSelectedAddress, setFormData, setErrors, map, setAddressLoading]);

  // Handle input change for other form fields
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({ ...prev, [name]: value }));
    
    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev: { [key: string]: string }) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors, setFormData, setErrors]);

  // Render location-specific form
  const renderLocationForm = () => {
    switch (formData.locationType) {
      case 'hotel':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hotel Name (Optional)
                </label>
                <input
                  type="text"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleInputChange}
                  placeholder="Hotel name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.hotelName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.hotelName && (
                  <p className="mt-1 text-sm text-red-600">{errors.hotelName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number (Optional)
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  placeholder="Room number"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.roomNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.roomNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.roomNumber}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Method *
              </label>
              <select
                name="collectionMethod"
                value={formData.collectionMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="reception">From Reception</option>
                <option value="concierge">From Concierge</option>
                <option value="direct">Directly from Room</option>
              </select>
            </div>
          </div>
        );

      case 'home':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  House (Optional)
                </label>
                <input
                  type="text"
                  name="house"
                  value={formData.house}
                  onChange={handleInputChange}
                  placeholder="House number/name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.house ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.house && (
                  <p className="mt-1 text-sm text-red-600">{errors.house}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Road *
                </label>
                <input
                  type="text"
                  name="road"
                  value={formData.road}
                  onChange={handleInputChange}
                  placeholder="Road name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.road ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.road && (
                  <p className="mt-1 text-sm text-red-600">{errors.road}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Block
              </label>
              <input
                type="text"
                name="block"
                value={formData.block}
                onChange={handleInputChange}
                placeholder="Block number (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Method *
              </label>
              <select
                name="homeCollectionMethod"
                value={formData.homeCollectionMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="directly">Collect directly from me</option>
                <option value="outside">I'll leave it outside</option>
              </select>
            </div>
          </div>
        );

      case 'flat':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block
                </label>
                <input
                  type="text"
                  name="block"
                  value={formData.block}
                  onChange={handleInputChange}
                  placeholder="Block number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Building *
                </label>
                <input
                  type="text"
                  name="building"
                  value={formData.building}
                  onChange={handleInputChange}
                  placeholder="Building number or name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.building ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.building && (
                  <p className="mt-1 text-sm text-red-600">{errors.building}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Road *
                </label>
                <input
                  type="text"
                  name="road"
                  value={formData.road}
                  onChange={handleInputChange}
                  placeholder="Road name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.road ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.road && (
                  <p className="mt-1 text-sm text-red-600">{errors.road}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flat Number
                </label>
                <input
                  type="text"
                  name="flatNumber"
                  value={formData.flatNumber}
                  onChange={handleInputChange}
                  placeholder="Flat number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 'office':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block
                </label>
                <input
                  type="text"
                  name="block"
                  value={formData.block}
                  onChange={handleInputChange}
                  placeholder="Block number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Building *
                </label>
                <input
                  type="text"
                  name="building"
                  value={formData.building}
                  onChange={handleInputChange}
                  placeholder="Building number or name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.building ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.building && (
                  <p className="mt-1 text-sm text-red-600">{errors.building}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Road *
                </label>
                <input
                  type="text"
                  name="road"
                  value={formData.road}
                  onChange={handleInputChange}
                  placeholder="Road name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.road ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.road && (
                  <p className="mt-1 text-sm text-red-600">{errors.road}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Office Number
                </label>
                <input
                  type="text"
                  name="officeNumber"
                  value={formData.officeNumber}
                  onChange={handleInputChange}
                  placeholder="Office number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loadError) {
    return (
      <div className="text-red-500 text-sm">
        Error loading Google Maps. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Location</h3>
              <p className="text-sm text-gray-600">
                Click on the map, search for an address, or use your current location
              </p>
            </div>
            <button
              onClick={getCurrentLocation}
              disabled={gpsLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
              title="Use my current location"
            >
              {gpsLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Getting location...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>My Location</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="relative">
          <GoogleMap
            mapContainerClassName="w-full h-64"
            center={selectedAddress ? { lat: selectedAddress.latitude!, lng: selectedAddress.longitude! } : defaultCenter}
            zoom={selectedAddress ? 16 : 10}
            onClick={handleMapClick}
            onLoad={setMap}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {marker && <Marker position={marker} />}
          </GoogleMap>
          
          {mapLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading address...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Address
        </label>
        
        <div className="relative">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchSuggestions(searchSuggestions.length > 0)}
              placeholder="Search for hotels, addresses, or places in Bahrain..."
              className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.googleAddress ? 'border-red-500' : ''
              }`}
            />
            
            {/* Search Icon */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Loading indicator */}
            {addressLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1"
            >
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion.place_id || index}
                  className="p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  onClick={() => handleSearchSuggestionClick(suggestion)}
                >
                  <div className="font-medium text-gray-900 text-sm">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {suggestion.structured_formatting?.secondary_text || ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {errors.googleAddress && (
          <p className="mt-1 text-sm text-red-600">{errors.googleAddress}</p>
        )}
        
        {/* Help text */}
        {!errors.googleAddress && searchQuery.length > 0 && searchQuery.length < 3 && (
          <p className="mt-1 text-sm text-gray-500">Type at least 3 characters to search</p>
        )}
        
        {/* Debug information - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            <div>Search Query: "{searchQuery}"</div>
            <div>Suggestions: {searchSuggestions.length}</div>
            <div>Show Suggestions: {showSearchSuggestions ? 'Yes' : 'No'}</div>
            <div>Google Maps Loaded: {isLoaded ? 'Yes' : 'No'}</div>
            <div>API Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Set' : 'Missing'}</div>
          </div>
        )}
      </div>

      {/* Selected Address Display */}
      {selectedAddress && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {isGpsLocation ? (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-medium text-green-800">Selected Address</h4>
                {isGpsLocation && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    GPS Location
                  </span>
                )}
              </div>
              <p className="text-sm text-green-700 mt-1">{selectedAddress.formatted_address}</p>
              {selectedAddress.latitude && selectedAddress.longitude && (
                <p className="text-xs text-green-600 mt-1">
                  Coordinates: {selectedAddress.latitude.toFixed(6)}, {selectedAddress.longitude.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Location Type Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Location Type *
          </label>
          {selectedAddress && selectedAddress.locationType && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Auto-detected: {selectedAddress.locationType}
            </span>
          )}
        </div>
        <select
          name="locationType"
          value={formData.locationType}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hotel">Hotel</option>
          <option value="home">Home</option>
          <option value="flat">Flat/Apartment</option>
          <option value="office">Office</option>
        </select>
        {selectedAddress && selectedAddress.locationType && (
          <p className="mt-1 text-xs text-gray-500">
            Location type automatically detected from the selected address. You can change it if needed.
          </p>
        )}
      </div>

      {/* Location-specific form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
        {renderLocationForm()}
      </div>

      {/* Contact Number */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <PhoneInput
          value={formData.contactNumber}
          onChange={(value) => setFormData((prev: FormData) => ({ ...prev, contactNumber: value }))}
          placeholder="Enter your contact number"
          label="Contact Number"
          required
          error={errors.contactNumber}
        />
      </div>
    </div>
  );
} 