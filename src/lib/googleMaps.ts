// Google Maps API service using @react-google-maps/api library

export interface GoogleMapsAddress {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GeocodingResult {
  address: string;
  city: string;
  area?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  latitude?: number;
  longitude?: number;
  formatted_address: string;
  locationType?: string;
}

class GoogleMapsService {
  private apiKey: string;
  private autocompleteService: any = null;
  private geocoder: any = null;
  private isInitialized = false;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  }

  // Initialize Google Maps services
  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (typeof window === 'undefined') {
      throw new Error('Google Maps can only be used in browser environment');
    }

    // Check if Google Maps is already loaded
    if (window.google?.maps?.places?.AutocompleteService) {
      this.autocompleteService = new window.google.maps.places.AutocompleteService();
      this.geocoder = new window.google.maps.Geocoder();
      this.isInitialized = true;
      return;
    }

    // If not loaded, we need to load it manually (fallback for non-React components)
    await this.loadGoogleMapsScript();
  }

  // Load Google Maps script (fallback method)
  private async loadGoogleMapsScript(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for existing script to load
      return new Promise((resolve) => {
        const checkGoogleMaps = () => {
          if (window.google?.maps?.places?.AutocompleteService) {
            this.autocompleteService = new window.google.maps.places.AutocompleteService();
            this.geocoder = new window.google.maps.Geocoder();
            this.isInitialized = true;
            resolve();
          } else {
            setTimeout(checkGoogleMaps, 100);
          }
        };
        checkGoogleMaps();
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.autocompleteService = new window.google.maps.places.AutocompleteService();
        this.geocoder = new window.google.maps.Geocoder();
        this.isInitialized = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'));
      };
      
      document.head.appendChild(script);
    });
  }

  // Get address suggestions for autocomplete
  async getAddressSuggestions(input: string): Promise<GoogleMapsAddress[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      if (!this.autocompleteService) {
        reject(new Error('Autocomplete service not available'));
        return;
      }

      const request = {
        input,
        componentRestrictions: { country: 'BH' }, // Restrict to Bahrain
        types: ['geocode'] // Use geocode for addresses
      };
      
      console.log('Google Maps API request:', request);
      
      this.autocompleteService.getPlacePredictions(
        request,
        (predictions: any, status: any) => {
          console.log('Google Maps API response status:', status);
          if (status === 'OK' && predictions) {
            console.log('Google Maps API predictions count:', predictions.length);
            const formattedPredictions: GoogleMapsAddress[] = predictions.map((prediction: any) => ({
              place_id: prediction.place_id,
              description: prediction.description,
              structured_formatting: {
                main_text: prediction.structured_formatting.main_text,
                secondary_text: prediction.structured_formatting.secondary_text
              }
            }));
            resolve(formattedPredictions);
          } else {
            console.warn('Google Maps API error status:', status);
            resolve([]);
          }
        }
      );
    });
  }

  // Geocode a place ID to get detailed address information
  async geocodePlaceId(placeId: string): Promise<GeocodingResult | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not available'));
        return;
      }

      this.geocoder.geocode(
        { placeId },
        (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            const result = results[0];
            const addressComponents = result.address_components;
            
            // Extract address components
            const streetNumber = this.getAddressComponent(addressComponents, 'street_number');
            const route = this.getAddressComponent(addressComponents, 'route');
            const sublocality = this.getAddressComponent(addressComponents, 'sublocality');
            const locality = this.getAddressComponent(addressComponents, 'locality');
            const administrativeArea = this.getAddressComponent(addressComponents, 'administrative_area_level_1');
            const establishment = this.getAddressComponent(addressComponents, 'establishment');
            
            // Determine location type based on address components and place types
            let locationType = 'flat';
            
            // Check for establishment types (hotels, businesses, etc.)
            if (this.hasAddressComponent(addressComponents, 'establishment') || 
                result.types?.includes('lodging') || 
                result.types?.includes('establishment')) {
              locationType = 'hotel';
            } else if (this.hasAddressComponent(addressComponents, 'premise') || 
                       result.types?.includes('premise')) {
              locationType = 'office';
            } else if (this.hasAddressComponent(addressComponents, 'street_number') || 
                       result.types?.includes('street_address')) {
              locationType = 'home';
            }

            const geocodingResult: GeocodingResult = {
              address: `${streetNumber || ''} ${route || ''}`.trim(),
              city: locality || administrativeArea || 'Bahrain',
              area: route || sublocality || '',
              building: streetNumber || establishment || '',
              floor: '',
              apartment: '',
              latitude: result.geometry.location.lat(),
              longitude: result.geometry.location.lng(),
              formatted_address: result.formatted_address,
              locationType: locationType
            };

            resolve(geocodingResult);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  // Helper method to get address component by type
  private getAddressComponent(components: any[], type: string): string {
    const component = components.find((comp: any) => comp.types.includes(type));
    return component ? component.long_name : '';
  }

  // Helper method to check if address component exists
  private hasAddressComponent(components: any[], type: string): boolean {
    return components.some((comp: any) => comp.types.includes(type));
  }

  // Helper method to remove duplicate predictions based on place_id
  private removeDuplicatePredictions(predictions: GoogleMapsAddress[]): GoogleMapsAddress[] {
    const seen = new Set<string>();
    return predictions.filter(prediction => {
      if (seen.has(prediction.place_id)) {
        return false;
      }
      seen.add(prediction.place_id);
      return true;
    });
  }

  // Reverse geocoding from coordinates
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not available'));
        return;
      }

      this.geocoder.geocode(
        { location: { lat, lng } },
        (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            const result = results[0];
            const addressComponents = result.address_components;
            
            const streetNumber = this.getAddressComponent(addressComponents, 'street_number');
            const route = this.getAddressComponent(addressComponents, 'route');
            const sublocality = this.getAddressComponent(addressComponents, 'sublocality');
            const locality = this.getAddressComponent(addressComponents, 'locality');
            const administrativeArea = this.getAddressComponent(addressComponents, 'administrative_area_level_1');
            const establishment = this.getAddressComponent(addressComponents, 'establishment');

            // Determine location type based on address components and place types
            let locationType = 'flat';
            
            // Check for establishment types (hotels, businesses, etc.)
            if (this.hasAddressComponent(addressComponents, 'establishment') || 
                result.types?.includes('lodging') || 
                result.types?.includes('establishment')) {
              locationType = 'hotel';
            } else if (this.hasAddressComponent(addressComponents, 'premise') || 
                       result.types?.includes('premise')) {
              locationType = 'office';
            } else if (this.hasAddressComponent(addressComponents, 'street_number') || 
                       result.types?.includes('street_address')) {
              locationType = 'home';
            }

            const geocodingResult: GeocodingResult = {
              address: `${streetNumber || ''} ${route || ''}`.trim(),
              city: locality || administrativeArea || 'Bahrain',
              area: route || sublocality || '',
              building: streetNumber || establishment || '',
              floor: '',
              apartment: '',
              latitude: lat,
              longitude: lng,
              formatted_address: result.formatted_address,
              locationType: locationType
            };

            resolve(geocodingResult);
          } else {
            resolve(null);
          }
        }
      );
    });
  }
}

// Create singleton instance
const googleMapsService = new GoogleMapsService();

export default googleMapsService; 