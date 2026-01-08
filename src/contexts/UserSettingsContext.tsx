import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import defaultProfileImage from "@/assets/default-profile.png";

export type TransportMode = "walking" | "driving" | "transit" | "auto";

interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
}

interface UserSettingsContextType {
  profilePhoto: string;
  setProfilePhoto: (photo: string) => void;
  transportMode: TransportMode;
  setTransportMode: (mode: TransportMode) => void;
  userLocation: UserLocation | null;
  setUserLocation: (location: UserLocation | null) => void;
  locationPermission: "granted" | "denied" | "prompt";
  requestLocationPermission: () => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE_PHOTO: "gigfinder_profile_photo",
  TRANSPORT_MODE: "gigfinder_transport_mode",
};

export const UserSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [profilePhoto, setProfilePhotoState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE_PHOTO);
    return saved || defaultProfileImage;
  });

  const [transportMode, setTransportModeState] = useState<TransportMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSPORT_MODE);
    return (saved as TransportMode) || "auto";
  });

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");

  // Persist profile photo
  const setProfilePhoto = (photo: string) => {
    setProfilePhotoState(photo);
    localStorage.setItem(STORAGE_KEYS.PROFILE_PHOTO, photo);
  };

  // Persist transport mode
  const setTransportMode = (mode: TransportMode) => {
    setTransportModeState(mode);
    localStorage.setItem(STORAGE_KEYS.TRANSPORT_MODE, mode);
  };

  // Request location permission
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationPermission("denied");
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        city: "Kyiv", // Default city, would be determined by reverse geocoding in production
      });
      setLocationPermission("granted");
    } catch (error) {
      setLocationPermission("denied");
    }
  };

  // Check location permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          requestLocationPermission();
        } else {
          setLocationPermission(result.state as "denied" | "prompt");
        }
      });
    }
  }, []);

  return (
    <UserSettingsContext.Provider
      value={{
        profilePhoto,
        setProfilePhoto,
        transportMode,
        setTransportMode,
        userLocation,
        setUserLocation,
        locationPermission,
        requestLocationPermission,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error("useUserSettings must be used within a UserSettingsProvider");
  }
  return context;
};
