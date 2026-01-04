import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import WelcomeScreen from "@/components/WelcomeScreen";
import ProfileGuestScreen from "@/components/ProfileGuestScreen";
import HomeAuthScreen from "@/components/HomeAuthScreen";
import CameraScreen from "@/components/CameraScreen";
import { useAuth } from "@/contexts/AuthContext";

type NavTab = "home" | "camera" | "profile";

const Index = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/auth");
  };

  const handleSyncComplete = () => {
    // Already on home tab, the HomeAuthScreen will show updated matches
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-start border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === "camera") {
      return (
        <CameraScreen 
          onNavigateToProfile={() => setActiveTab("profile")} 
        />
      );
    }

    if (activeTab === "profile") {
      if (user) {
        return (
          <div className="min-h-screen pb-24 px-5 pt-12 animate-fade-in">
            <div className="text-center">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80"
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-primary"
              />
              <h2 className="mt-4 text-2xl font-bold text-foreground">
                {profile?.full_name || user.email?.split("@")[0] || "User"}
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
              
              <button
                onClick={signOut}
                className="mt-8 px-6 py-3 bg-destructive/10 text-destructive font-medium rounded-xl hover:bg-destructive/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        );
      }
      return <ProfileGuestScreen onLogin={handleLogin} />;
    }

    // Home tab
    if (user && profile?.is_synced) {
      return <HomeAuthScreen />;
    }
    
    return (
      <WelcomeScreen 
        onNavigateToCamera={() => setActiveTab("camera")} 
        onSyncComplete={handleSyncComplete}
      />
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background relative">
      {renderContent()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
