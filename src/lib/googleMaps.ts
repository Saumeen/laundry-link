// Google Maps API service for address autocomplete and geocoding

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
}

class GoogleMapsService {
  private apiKey: string;
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private geocoder: google.maps.Geocoder | null = null;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    
    if (typeof window !== 'undefined' && window.google) {
      this.autocompleteService = new google.maps.places.AutocompleteService();
      this.geocoder = new google.maps.Geocoder();
    }
  }

  // Load Google Maps script
  async loadGoogleMapsScript(): Promise<void> {
    if (typeof window === 'undefined' || window.google?.maps) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.autocompleteService = new google.maps.places.AutocompleteService();
        this.geocoder = new google.maps.Geocoder();
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
    if (!this.autocompleteService) {
      await this.loadGoogleMapsScript();
    }

    return new Promise((resolve, reject) => {
      if (!this.autocompleteService) {
        reject(new Error('Autocomplete service not available'));
        return;
      }

      this.autocompleteService.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'BH' }, // Restrict to Bahrain
          types: ['address', 'establishment']
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions as GoogleMapsAddress[]);
          } else {
            resolve([]);
          }
        }
      );
    });
  }

  // Geocode a place ID to get detailed address information
  async geocodePlaceId(placeId: string): Promise<GeocodingResult | null> {
    if (!this.geocoder) {
      await this.loadGoogleMapsScript();
    }

    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not available'));
        return;
      }

      this.geocoder.geocode(
        { placeId },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const result = results[0];
            const addressComponents = result.address_components;
            
            // Extract address components
            const streetNumber = this.getAddressComponent(addressComponents, 'street_number');
            const route = this.getAddressComponent(addressComponents, 'route');
            const sublocality = this.getAddressComponent(addressComponents, 'sublocality');
            const locality = this.getAddressComponent(addressComponents, 'locality');
            const administrativeArea = this.getAddressComponent(addressComponents, 'administrative_area_level_1');
            const country = this.getAddressComponent(addressComponents, 'country');
            
            // Determine location type based on address components
            let locationType = 'flat';
            if (this.hasAddressComponent(addressComponents, 'establishment')) {
              locationType = 'hotel';
            } else if (this.hasAddressComponent(addressComponents, 'premise')) {
              locationType = 'office';
            } else if (this.hasAddressComponent(addressComponents, 'street_number')) {
              locationType = 'home';
            }

            const geocodingResult: GeocodingResult = {
              address: `${streetNumber || ''} ${route || ''}`.trim(),
              city: locality || administrativeArea || 'Bahrain',
              area: route || sublocality || '',
              building: streetNumber || '',
              floor: '',
              apartment: '',
              latitude: result.geometry.location.lat(),
              longitude: result.geometry.location.lng(),
              formatted_address: result.formatted_address
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
  private getAddressComponent(components: google.maps.GeocoderAddressComponent[], type: string): string {
    const component = components.find(comp => comp.types.includes(type));
    return component ? component.long_name : '';
  }

  // Helper method to check if address component exists
  private hasAddressComponent(components: google.maps.GeocoderAddressComponent[], type: string): boolean {
    return components.some(comp => comp.types.includes(type));
  }

  // Reverse geocoding from coordinates
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    if (!this.geocoder) {
      await this.loadGoogleMapsScript();
    }

    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not available'));
        return;
      }

      this.geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const result = results[0];
            const addressComponents = result.address_components;
            
            const streetNumber = this.getAddressComponent(addressComponents, 'street_number');
            const route = this.getAddressComponent(addressComponents, 'route');
            const sublocality = this.getAddressComponent(addressComponents, 'sublocality');
            const locality = this.getAddressComponent(addressComponents, 'locality');
            const administrativeArea = this.getAddressComponent(addressComponents, 'administrative_area_level_1');

            const geocodingResult: GeocodingResult = {
              address: `${streetNumber || ''} ${route || ''}`.trim(),
              city: locality || administrativeArea || 'Bahrain',
              area: route || sublocality || '',
              building: streetNumber || '',
              floor: '',
              apartment: '',
              latitude: lat,
              longitude: lng,
              formatted_address: result.formatted_address
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