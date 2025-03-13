"use client";

import { useState } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToastNotification } from "@/components/common/ToastNotificationDisplay";
import { Spinner } from "@heroui/react";
import { PlusCircle, MapPin } from "lucide-react";
import Autocomplete from "react-google-autocomplete";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import { createSubmissionSchema } from "@/schemas/submission";
import {
  validateForm,
  formatApiValidationErrors,
} from "@/utils/form-validation";

const toast = new ToastNotification("create-submission");
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function CreateSubmission() {
  const { publicKey, connected } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loading: scriptLoading, loaded: scriptLoaded } =
    useGoogleMapsScript(GOOGLE_MAPS_API_KEY);
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    description: "",
    tipJarLimit: 100,
    location: {
      placeId: "",
      formattedAddress: "",
      lat: 0,
      lng: 0,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const clearLocationErrors = () => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors["location"];
      delete newErrors["location.placeId"];
      delete newErrors["location.formattedAddress"];
      delete newErrors["geolocation"];
      delete newErrors["geolocation.placeId"];
      delete newErrors["geolocation.formattedAddress"];
      delete newErrors["geolocation.lat"];
      delete newErrors["geolocation.lng"];
      return newErrors;
    });
  };

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (
      !place ||
      !place.place_id ||
      !place.formatted_address ||
      !place.geometry ||
      !place.geometry.location
    ) {
      toast.error(
        "Invalid location data. Please try selecting a different location."
      );
      return;
    }

    const location = {
      placeId: place.place_id,
      formattedAddress: place.formatted_address,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    setFormData((prev) => ({
      ...prev,
      location,
    }));

    clearLocationErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.location.placeId || !formData.location.formattedAddress) {
      setErrors({
        "geolocation.placeId": "Place ID is required",
        "geolocation.formattedAddress": "Address is required",
      });
      toast.error("Please select a location");
      return;
    }

    const locationData = {
      placeId: formData.location.placeId,
      formattedAddress: formData.location.formattedAddress,
      lat: formData.location.lat,
      lng: formData.location.lng,
    };

    const submissionData = {
      wallet: publicKey.toString(),
      title: formData.title,
      link: formData.link,
      description: formData.description,
      geolocation: locationData,
      tipJarLimit: parseInt(formData.tipJarLimit.toString(), 10),
    };

    const validation = validateForm(createSubmissionSchema, submissionData);
    if (!validation.success) {
      console.error("Form validation failed:", validation.errors);
      setErrors(validation.errors || {});
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error && typeof data.error === "object") {
          console.error("API validation errors:", data.error);
          const apiErrors = formatApiValidationErrors(data);
          setErrors(apiErrors);
          toast.error("Please fix the errors in the form");
        } else {
          console.error(
            "API error:",
            data.error || "Failed to create submission"
          );
          toast.error(data.error || "Failed to create submission");
        }
        setIsSubmitting(false);
        return;
      }

      toast.success(
        "Your submission has been sent for review and will appear once approved! This typically takes 24-48 hours."
      );
      setFormData({
        title: "",
        link: "",
        description: "",
        tipJarLimit: 100,
        location: {
          placeId: "",
          formattedAddress: "",
          lat: 0,
          lng: 0,
        },
      });
      setErrors({});
    } catch (error) {
      console.error("Submission creation error:", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLocationInput = () => {
    if (scriptLoading) {
      return (
        <div
          className={`w-full p-2 rounded-md bg-[#232424] border ${
            errors["geolocation.placeId"] || errors["geolocation"]
              ? "border-red-500"
              : "border-[#7272724f]"
          } text-gray-500 flex items-center justify-center`}
        >
          <Spinner size="sm" className="mr-2" /> Loading map service...
        </div>
      );
    }

    if (!scriptLoaded) {
      return (
        <div
          className={`w-full p-2 rounded-md bg-[#232424] border ${
            errors["geolocation.placeId"] || errors["geolocation"]
              ? "border-red-500"
              : "border-[#7272724f]"
          } text-gray-500 flex items-center justify-center`}
        >
          Failed to load map service. Please refresh the page.
        </div>
      );
    }

    return (
      <Autocomplete
        onPlaceSelected={handlePlaceSelected}
        placeholder="Search for a location (required)..."
        className={`w-full p-2 rounded-md bg-[#232424] border ${
          errors["geolocation.placeId"] ||
          errors["geolocation"] ||
          errors["location.placeId"]
            ? "border-red-500"
            : "border-[#7272724f]"
        } text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]`}
        options={{
          types: ["establishment", "geocode"],
          fields: ["place_id", "formatted_address", "geometry"],
          componentRestrictions: { country: [] },
          strictBounds: false,
        }}
        apiKey={GOOGLE_MAPS_API_KEY}
      />
    );
  };

  return (
    <Card className="w-full bg-[#181919] border-[#7272724f] shadow-lg hover:shadow-[#3ecf8e20] transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-[#3ecf8e] flex items-center gap-2">
          <PlusCircle size={18} />
          Create Submission
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id="submission-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm text-gray-200">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="What's your project about?"
              className={`w-full p-2 rounded-md bg-[#232424] border ${
                errors.title ? "border-red-500" : "border-gray-300"
              } text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]`}
              maxLength={100}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="link" className="text-sm text-gray-200">
              Link
            </label>
            <input
              type="url"
              id="link"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="URL to your project"
              className={`w-full p-2 rounded-md bg-[#232424] border ${
                errors.link ? "border-red-500" : "border-gray-300"
              } text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]`}
            />
            {errors.link && (
              <p className="text-xs text-red-500">{errors.link}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="location"
              className="text-sm text-gray-200 flex items-center gap-1"
            >
              <MapPin size={14} />
              Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {renderLocationInput()}
              {formData.location.formattedAddress && (
                <div className="mt-2 text-sm text-[#3ecf8e] truncate">
                  Selected: {formData.location.formattedAddress}
                </div>
              )}
              {!formData.location.formattedAddress && (
                <div className="mt-2 text-xs text-gray-400">
                  Please search and select a location from the dropdown
                </div>
              )}
            </div>
            {errors["location.placeId"] && (
              <p className="text-xs text-red-500">
                {errors["location.placeId"]}
              </p>
            )}
            {errors["geolocation.placeId"] && (
              <p className="text-xs text-red-500">
                {errors["geolocation.placeId"]}
              </p>
            )}
            {errors["geolocation"] && (
              <p className="text-xs text-red-500">{errors["geolocation"]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm text-gray-200">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your project..."
              className={`w-full p-2 rounded-md bg-[#232424] border ${
                errors.description ? "border-red-500" : "border-gray-300"
              } text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e] min-h-[80px]`}
              maxLength={300}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="tipJarLimit" className="text-sm text-gray-200">
              Tip Jar Limit (SOL)
            </label>
            <input
              type="number"
              id="tipJarLimit"
              name="tipJarLimit"
              value={formData.tipJarLimit}
              onChange={handleInputChange}
              min={1}
              max={10000}
              className={`w-full p-2 rounded-md bg-[#232424] border ${
                errors.tipJarLimit ? "border-red-500" : "border-gray-300"
              } text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]`}
            />
            {errors.tipJarLimit && (
              <p className="text-xs text-red-500">{errors.tipJarLimit}</p>
            )}
          </div>

          {errors._form && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-500">{errors._form}</p>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="submission-form"
          disabled={isSubmitting || !connected}
          className="w-full bg-[#3ecf8e] hover:bg-[#35b57c] text-black font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" /> Submitting...
            </span>
          ) : (
            "Submit Project"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
