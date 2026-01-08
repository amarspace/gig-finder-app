import { useMemo } from "react";
import { useUserSettings, TransportMode } from "@/contexts/UserSettingsContext";

interface TravelTimeResult {
  minutes: number;
  mode: TransportMode;
  icon: "walking" | "car" | "train";
}

// Mock venue locations for demo purposes
const VENUE_LOCATIONS: Record<string, { lat: number; lng: number; city: string }> = {
  "Барабан": { lat: 50.4501, lng: 30.5234, city: "Kyiv" },
  "Atlas": { lat: 50.4547, lng: 30.5238, city: "Kyiv" },
  "Caribbean Club": { lat: 50.4418, lng: 30.5186, city: "Kyiv" },
  "Docker's ABC": { lat: 50.4501, lng: 30.5234, city: "Kyiv" },
  "Lviv Opera House": { lat: 49.8442, lng: 24.0260, city: "Lviv" },
  "Berlin Arena": { lat: 52.5200, lng: 13.4050, city: "Berlin" },
};

// Calculate mock travel time based on distance and mode
const calculateMockTravelTime = (
  userLat: number,
  userLng: number,
  venueLat: number,
  venueLng: number,
  mode: TransportMode
): TravelTimeResult | null => {
  // Haversine formula for distance
  const R = 6371; // Earth's radius in km
  const dLat = ((venueLat - userLat) * Math.PI) / 180;
  const dLng = ((venueLng - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((venueLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // Speed in km/h for each mode
  const speeds: Record<TransportMode, number> = {
    walking: 5,
    driving: 40,
    transit: 25,
    auto: 30, // Average
  };

  // Determine actual mode for "auto"
  let actualMode: TransportMode = mode;
  if (mode === "auto") {
    if (distanceKm < 1) {
      actualMode = "walking";
    } else if (distanceKm < 5) {
      actualMode = "transit";
    } else {
      actualMode = "driving";
    }
  }

  const speed = speeds[actualMode];
  const travelTimeMinutes = Math.round((distanceKm / speed) * 60);

  // Map mode to icon
  const iconMap: Record<TransportMode, "walking" | "car" | "train"> = {
    walking: "walking",
    driving: "car",
    transit: "train",
    auto: actualMode === "walking" ? "walking" : actualMode === "driving" ? "car" : "train",
  };

  return {
    minutes: Math.max(1, travelTimeMinutes), // Minimum 1 minute
    mode: actualMode,
    icon: iconMap[actualMode],
  };
};

export const useTravelTime = (venueName: string): TravelTimeResult | null => {
  const { userLocation, transportMode, locationPermission } = useUserSettings();

  return useMemo(() => {
    // No location permission or location
    if (locationPermission !== "granted" || !userLocation) {
      return null;
    }

    // Get venue info
    const venueInfo = VENUE_LOCATIONS[venueName];
    if (!venueInfo) {
      return null;
    }

    // Check if venue is in user's current city
    if (venueInfo.city !== userLocation.city) {
      return null;
    }

    return calculateMockTravelTime(
      userLocation.latitude,
      userLocation.longitude,
      venueInfo.lat,
      venueInfo.lng,
      transportMode
    );
  }, [venueName, userLocation, transportMode, locationPermission]);
};
