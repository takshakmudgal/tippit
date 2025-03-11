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

const toast = new ToastNotification("create-submission");
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function CreateSubmission() {
  const { publicKey, connected } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loading: scriptLoading } = useGoogleMapsScript(GOOGLE_MAPS_API_KEY);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (place && place.geometry && place.geometry.location) {
      setFormData((prev) => ({
        ...prev,
        location: {
          placeId: place.place_id || "",
          formattedAddress: place.formatted_address || "",
          lat: place.geometry!.location.lat() || 0,
          lng: place.geometry!.location.lng() || 0,
        },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey) {
      toast.error("Please connect your wallet to submit a project");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.link.trim()) {
      toast.error("Link is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          title: formData.title,
          link: formData.link,
          description: formData.description,
          geolocation: formData.location,
          tipJarLimit: formData.tipJarLimit,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Submission created successfully!");
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
      } else {
        const errorMessage = data.error || "Failed to create submission";
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create submission. Please try again.";

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLocationInput = () => {
    if (scriptLoading) {
      return (
        <div className="w-full p-2 rounded-md bg-[#232424] border border-[#7272724f] text-gray-500 flex items-center justify-center">
          <Spinner size="sm" className="mr-2" /> Loading map service...
        </div>
      );
    }

    return (
      <Autocomplete
        onPlaceSelected={handlePlaceSelected}
        placeholder="Search for a location..."
        className="w-full p-2 rounded-md bg-[#232424] border border-[#7272724f] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]"
        options={{
          types: ["(cities)"],
          fields: [
            "address_components",
            "formatted_address",
            "geometry",
            "place_id",
          ],
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full p-2 rounded-md bg-[#232424] border border-[#7272724f] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]"
              maxLength={100}
            />
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
              className="w-full p-2 rounded-md bg-[#232424] border border-[#7272724f] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="location"
              className="text-sm text-gray-200 flex items-center gap-1"
            >
              <MapPin size={14} />
              Location
            </label>
            <div className="relative">
              {renderLocationInput()}
              {formData.location.formattedAddress && (
                <div className="mt-2 text-sm text-[#3ecf8e] truncate">
                  Selected: {formData.location.formattedAddress}
                </div>
              )}
            </div>
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
              className="w-full p-2 rounded-md bg-[#232424] border border-[#7272724f] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e] min-h-[80px]"
              maxLength={300}
            />
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
              className="w-full p-2 rounded-md bg-[#232424] border border-[#7272724f] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
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
