import logger from '@/lib/logger';
// Google Maps Places API v1 service using the new REST endpoints
// https://places.googleapis.com/v1/places:autocompletePlaces
// https://places.googleapis.com/v1/places/{placeId}

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
  area: string;
  building: string;
  floor: string;
  apartment: string;
  latitude: number;
  longitude: number;
  formatted_address: string;
  locationType: 'hotel' | 'home' | 'flat' | 'office';
}

// New Google Places API v1 interfaces
interface AutocompletePlacesRequest {
  input: string;
  locationBias?: {
    circle?: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
    };
  };
  locationRestriction?: {
    circle?: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
    };
  };
  types?: string[];
  languageCode?: string;
  regionCode?: string;
  origin?: {
    latitude: number;
    longitude: number;
  };
  inputOffset?: number;
  includeQueryPredictions?: boolean;
  sessionToken?: string;
}

interface AutocompletePlacesResponse {
  suggestions: Array<{
    placePrediction: {
      placeId: string;
      text: {
        text: string;
        matches: Array<{
          text: string;
          offset: number;
          length: number;
        }>;
      };
      structuredFormat: {
        mainText: {
          text: string;
          matches: Array<{
            text: string;
            offset: number;
            length: number;
          }>;
        };
        secondaryText: {
          text: string;
          matches: Array<{
            text: string;
            offset: number;
            length: number;
          }>;
        };
      };
      types: string[];
      distanceMeters?: number;
      placeTypes: string[];
    };
  }>;
}

interface GetPlaceRequest {
  placeId: string;
  fields?: string[];
  languageCode?: string;
  regionCode?: string;
  sessionToken?: string;
}

interface GetPlaceResponse {
  place: {
    id: string;
    displayName: {
      text: string;
      languageCode: string;
    };
    formattedAddress: string;
    addressComponents: Array<{
      longText: string;
      shortText: string;
      types: string[];
      languageCode: string;
    }>;
    location: {
      latitude: number;
      longitude: number;
    };
    types: string[];
    primaryType: string;
    primaryTypeDisplayName: {
      text: string;
      languageCode: string;
    };
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    rating?: number;
    googleMapsUri?: string;
    websiteUri?: string;
    regularOpeningHours?: {
      openNow: boolean;
      periods: Array<{
        open: {
          day: number;
          time: string;
        };
        close: {
          day: number;
          time: string;
        };
      }>;
      weekdayDescriptions: string[];
    };
    utcOffsetMinutes?: number;
    adrFormat?: string;
    businessStatus?: string;
    priceLevel?: string;
    attributions?: string[];
    userRatingCount?: number;
    iconMaskBaseUri?: string;
    iconBackgroundColor?: string;
    takeout?: boolean;
    delivery?: boolean;
    dineIn?: boolean;
    reservable?: boolean;
    servesBreakfast?: boolean;
    servesLunch?: boolean;
    servesDinner?: boolean;
    servesBeer?: boolean;
    servesWine?: boolean;
    servesBrunch?: boolean;
    servesVegetarianFood?: boolean;
    outdoorSeating?: boolean;
    liveMusic?: boolean;
    menuForChildren?: boolean;
    servesCocktails?: boolean;
    servesDessert?: boolean;
    servesCoffee?: boolean;
    goodForChildren?: boolean;
    allowsDogs?: boolean;
    restroom?: boolean;
    goodForGroups?: boolean;
    goodForWatchingSports?: boolean;
    paymentOptions?: {
      acceptsCreditCards?: boolean;
      acceptsDebitCards?: boolean;
      acceptsCashOnly?: boolean;
      acceptsNFC?: boolean;
    };
    parkingOptions?: {
      freeParkingLot?: boolean;
      paidParkingLot?: boolean;
      streetParking?: boolean;
      freeStreetParking?: boolean;
      valetParking?: boolean;
    };
    subDestinations?: Array<{
      id: string;
      displayName: {
        text: string;
        languageCode: string;
      };
      location: {
        latitude: number;
        longitude: number;
      };
    }>;
    accessibilityOptions?: {
      wheelchairAccessibleEntrance?: boolean;
      wheelchairAccessibleParking?: boolean;
      wheelchairAccessibleRestroom?: boolean;
      wheelchairAccessibleSeating?: boolean;
    };
    fuelOptions?: {
      hasDiesel?: boolean;
      hasUnleaded?: boolean;
      hasMidGrade?: boolean;
      hasPremium?: boolean;
      hasElectric?: boolean;
    };
    evChargeOptions?: {
      connectorCount?: number;
      connectorAggregation?: Array<{
        type: string;
        count: number;
        availability: string;
        lastAvailabilityUpdateTime: string;
      }>;
    };
  };
}

class GoogleMapsV1Service {
  private apiKey: string;
  private baseUrl = 'https://places.googleapis.com/v1';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  }

  // Get address suggestions for autocomplete using the new API
  async getAddressSuggestions(input: string): Promise<GoogleMapsAddress[]> {
    if (!input || input.length < 2) {
      return [];
    }

    try {
      const request: AutocompletePlacesRequest = {
        input,
        locationBias: {
          circle: {
            center: {
              latitude: 26.0667, // Bahrain center
              longitude: 50.5577,
            },
            radius: 50000, // 50km radius
          },
        },
        types: ['geocode'],
        languageCode: 'en',
        regionCode: 'BH',
      };

      const response = await fetch(
        `${this.baseUrl}/places:autocompletePlaces?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask':
              'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types',
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        logger.error('Places API error:',
          response.status,
          response.statusText
        );
        return [];
      }

      const data: AutocompletePlacesResponse = await response.json();

      return data.suggestions.map(suggestion => ({
        place_id: suggestion.placePrediction.placeId,
        description: suggestion.placePrediction.text.text,
        structured_formatting: {
          main_text: suggestion.placePrediction.structuredFormat.mainText.text,
          secondary_text:
            suggestion.placePrediction.structuredFormat.secondaryText.text,
        },
      }));
    } catch (error) {
      logger.error('Error fetching address suggestions:', error);
      return [];
    }
  }

  // Get detailed place information using the new API
  async geocodePlaceId(placeId: string): Promise<GeocodingResult | null> {
    if (!placeId) {
      return null;
    }

    try {
      const request: GetPlaceRequest = {
        placeId,
        fields: [
          'id',
          'displayName',
          'formattedAddress',
          'addressComponents',
          'location',
          'types',
          'primaryType',
        ],
        languageCode: 'en',
      };

      const response = await fetch(
        `${this.baseUrl}/places/${placeId}?key=${this.apiKey}&fields=${request.fields?.join(',')}`,
        {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        logger.error('Place details API error:',
          response.status,
          response.statusText
        );
        return null;
      }

      const data: GetPlaceResponse = await response.json();
      const place = data.place;

      // Extract address components
      const addressComponents = place.addressComponents || [];

      const streetNumber = this.getAddressComponent(
        addressComponents,
        'street_number'
      );
      const route = this.getAddressComponent(addressComponents, 'route');
      const sublocality = this.getAddressComponent(
        addressComponents,
        'sublocality'
      );
      const locality = this.getAddressComponent(addressComponents, 'locality');
      const administrativeArea = this.getAddressComponent(
        addressComponents,
        'administrative_area_level_1'
      );
      const establishment = this.getAddressComponent(
        addressComponents,
        'establishment'
      );

      // Determine location type based on place types
      let locationType: 'hotel' | 'home' | 'flat' | 'office' = 'flat';
      if (
        place.types?.includes('lodging') ||
        place.types?.includes('establishment')
      ) {
        locationType = 'hotel';
      } else if (place.types?.includes('premise')) {
        locationType = 'office';
      } else if (place.types?.includes('street_address')) {
        locationType = 'home';
      }

      return {
        address: `${streetNumber || ''} ${route || ''}`.trim(),
        city: locality || administrativeArea || 'Bahrain',
        area: route || sublocality || '',
        building: streetNumber || establishment || '',
        floor: '',
        apartment: '',
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        formatted_address: place.formattedAddress,
        locationType,
      };
    } catch (error) {
      logger.error('Error geocoding place ID:', error);
      return null;
    }
  }

  // Reverse geocoding from coordinates using the new API
  async reverseGeocode(
    lat: number,
    lng: number
  ): Promise<GeocodingResult | null> {
    try {
      // For reverse geocoding, we'll use the traditional Geocoding API
      // as the new Places API v1 doesn't have a direct reverse geocoding endpoint
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}&language=en&region=BH`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null;
      }

      const result = data.results[0];
      const addressComponents = result.address_components;

      const streetNumber = this.getAddressComponent(
        addressComponents,
        'street_number'
      );
      const route = this.getAddressComponent(addressComponents, 'route');
      const sublocality = this.getAddressComponent(
        addressComponents,
        'sublocality'
      );
      const locality = this.getAddressComponent(addressComponents, 'locality');
      const administrativeArea = this.getAddressComponent(
        addressComponents,
        'administrative_area_level_1'
      );
      const establishment = this.getAddressComponent(
        addressComponents,
        'establishment'
      );

      // Determine location type based on place types
      let locationType: 'hotel' | 'home' | 'flat' | 'office' = 'flat';
      if (
        result.types?.includes('lodging') ||
        result.types?.includes('establishment')
      ) {
        locationType = 'hotel';
      } else if (result.types?.includes('premise')) {
        locationType = 'office';
      } else if (result.types?.includes('street_address')) {
        locationType = 'home';
      }

      return {
        address: `${streetNumber || ''} ${route || ''}`.trim(),
        city: locality || administrativeArea || 'Bahrain',
        area: route || sublocality || '',
        building: streetNumber || establishment || '',
        floor: '',
        apartment: '',
        latitude: lat,
        longitude: lng,
        formatted_address: result.formatted_address,
        locationType,
      };
    } catch (error) {
      logger.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // Helper method to extract address components
  private getAddressComponent(components: any[], type: string): string {
    const component = components.find(comp => comp.types?.includes(type));
    return component ? component.longText || component.shortText : '';
  }
}

// Export singleton instance
const googleMapsV1Service = new GoogleMapsV1Service();
export default googleMapsV1Service;
