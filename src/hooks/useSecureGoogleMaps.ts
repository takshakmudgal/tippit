import { useState, useCallback } from "react";

interface Place {
  place_id: string;
  description: string;
}

interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export function useSecureGoogleMaps() {
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.trim() === "") {
      setPlaces([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/google-maps?place=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch places");
      }

      const data = await response.json();

      if (data.predictions) {
        setPlaces(
          data.predictions.map(
            (prediction: { place_id: string; description: string }) => ({
              place_id: prediction.place_id,
              description: prediction.description,
            })
          )
        );
      } else {
        setPlaces([]);
      }
    } catch (err) {
      console.error("Error searching places:", err);
      setError(err instanceof Error ? err.message : "Failed to search places");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<PlaceDetails | null> => {
      if (!placeId) {
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/v1/google-maps", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ placeId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch place details");
        }

        const data = await response.json();

        if (data.result) {
          return {
            place_id: data.result.place_id,
            formatted_address: data.result.formatted_address,
            geometry: {
              location: {
                lat: data.result.geometry.location.lat,
                lng: data.result.geometry.location.lng,
              },
            },
          };
        }

        return null;
      } catch (err) {
        console.error("Error getting place details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to get place details"
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    places,
    error,
    searchPlaces,
    getPlaceDetails,
  };
}
