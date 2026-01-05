import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import WelcomeScreen from "@/components/WelcomeScreen";
import ProfileGuestScreen from "@/components/ProfileGuestScreen";
import ProfileAuthScreen from "@/components/ProfileAuthScreen";
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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
        return <ProfileAuthScreen onSignOut={signOut} />;
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
