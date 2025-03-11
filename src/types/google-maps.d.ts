declare namespace google {
  namespace maps {
    namespace places {
      interface PlaceResult {
        place_id?: string;
        formatted_address?: string;
        geometry?: {
          location: {
            lat: () => number;
            lng: () => number;
          };
        };
        address_components?: Array<{
          long_name: string;
          short_name: string;
          types: string[];
        }>;
      }
    }
  }
}
