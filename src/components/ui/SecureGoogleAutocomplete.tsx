import React, { useState, useEffect, useRef } from "react";
import { useSecureGoogleMaps } from "@/hooks/useSecureGoogleMaps";
import { Spinner } from "@heroui/react";
import { MapPin } from "lucide-react";

interface PlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface SecureGoogleAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function SecureGoogleAutocomplete({
  onPlaceSelected,
  placeholder = "Search for a place...",
  className = "",
  error = false,
}: SecureGoogleAutocompleteProps) {
  const {
    loading,
    places,
    error: apiError,
    searchPlaces,
    getPlaceDetails,
  } = useSecureGoogleMaps();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim().length > 2) {
      searchPlaces(value);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handlePlaceSelect = async (placeId: string) => {
    const placeDetails = await getPlaceDetails(placeId);

    if (placeDetails) {
      onPlaceSelected({
        place_id: placeDetails.place_id,
        formatted_address: placeDetails.formatted_address,
        geometry: {
          location: {
            lat: placeDetails.geometry.location.lat,
            lng: placeDetails.geometry.location.lng,
          },
        },
      });

      setSearchTerm(placeDetails.formatted_address);
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full p-2 pl-8 rounded-md bg-[#232424] border ${
            error ? "border-red-500" : "border-[#7272724f]"
          } text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e] ${className}`}
        />
        <MapPin
          className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500"
          size={16}
        />
        {loading && (
          <Spinner
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          />
        )}
      </div>

      {showSuggestions && places.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#232424] border border-[#7272724f] rounded-md shadow-lg max-h-60 overflow-auto">
          {places.map((place) => (
            <div
              key={place.place_id}
              className="p-2 hover:bg-[#3a3b3b] cursor-pointer text-white"
              onClick={() => handlePlaceSelect(place.place_id)}
            >
              {place.description}
            </div>
          ))}
        </div>
      )}

      {apiError && <div className="text-red-500 text-sm mt-1">{apiError}</div>}
    </div>
  );
}
