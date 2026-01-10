import { Heart, MapPin, Music, Settings, ChevronRight, LogOut, Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProfileAvatar from "./ProfileAvatar";
import TransportModeSettings from "./TransportModeSettings";
import WishListSection from "./WishListSection";
import ConnectedPeopleSection from "./ConnectedPeopleSection";
import { useState } from "react";

interface ProfileAuthScreenProps {
  onSignOut: () => void;
}

// Mock favorites data
const mockFavoritePlaces = [
  { id: "1", name: "Барабан", type: "Live Music Bar" },
  { id: "2", name: "Atlas", type: "Concert Hall" },
];

const mockFavoriteArtists = [
  { id: "1", name: "KOLA", genre: "Pop" },
  { id: "2", name: "DOROFEEVA", genre: "Pop/Dance" },
  { id: "3", name: "Artem Pivovarov", genre: "Pop" },
];

const ProfileAuthScreen = ({ onSignOut }: ProfileAuthScreenProps) => {
  const { user, profile } = useAuth();
  const [showTransportSettings, setShowTransportSettings] = useState(false);

  return (
    <div className="min-h-screen pb-24 px-5 pt-12 animate-fade-in">
      {/* Profile Header */}
      <div className="text-center">
        <div className="mx-auto">
          <ProfileAvatar size="xl" className="mx-auto border-4 border-primary" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-foreground">
          {profile?.full_name || user?.email?.split("@")[0] || "Artur"}
        </h2>
        <p className="text-muted-foreground">
          {profile?.is_synced ? "YouTube Music Connected" : "Not synced yet"}
        </p>
        
        {profile?.is_synced && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {profile.favorite_genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Wish List Section */}
      <WishListSection />

      {/* Connected People Section */}
      <ConnectedPeopleSection />

      {/* Favorite Places Section */}
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={20} className="text-primary" />
          <h3 className="text-lg font-bold text-foreground">Favorite Places</h3>
        </div>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {mockFavoritePlaces.length > 0 ? (
            mockFavoritePlaces.map((place) => (
              <div key={place.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-foreground">{place.name}</p>
                  <p className="text-sm text-muted-foreground">{place.type}</p>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No favorite places yet
            </div>
          )}
        </div>
      </section>

      {/* Favorite Artists Section */}
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={20} className="text-primary" />
          <h3 className="text-lg font-bold text-foreground">Favorite Artists</h3>
        </div>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {mockFavoriteArtists.length > 0 ? (
            mockFavoriteArtists.map((artist) => (
              <div key={artist.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-foreground">{artist.name}</p>
                  <p className="text-sm text-muted-foreground">{artist.genre}</p>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No favorite artists yet
            </div>
          )}
        </div>
      </section>

      {/* Settings Section */}
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Settings size={20} className="text-primary" />
          <h3 className="text-lg font-bold text-foreground">Settings</h3>
        </div>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Music size={18} className="text-muted-foreground" />
              <span className="font-medium text-foreground">Sync Preferences</span>
            </div>
            <ChevronRight size={20} className="text-muted-foreground" />
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-muted-foreground" />
              <span className="font-medium text-foreground">Location Settings</span>
            </div>
            <ChevronRight size={20} className="text-muted-foreground" />
          </button>
          <button 
            onClick={() => setShowTransportSettings(!showTransportSettings)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Car size={18} className="text-muted-foreground" />
              <span className="font-medium text-foreground">Transport Mode</span>
            </div>
            <ChevronRight size={20} className={`text-muted-foreground transition-transform ${showTransportSettings ? "rotate-90" : ""}`} />
          </button>
          {showTransportSettings && (
            <div className="p-4">
              <TransportModeSettings />
            </div>
          )}
        </div>
      </section>

      {/* Sign Out Button */}
      <button
        onClick={onSignOut}
        className="w-full mt-8 flex items-center justify-center gap-2 px-6 py-4 bg-destructive/10 text-destructive font-medium rounded-xl hover:bg-destructive/20 transition-colors"
      >
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  );
};

export default ProfileAuthScreen;
