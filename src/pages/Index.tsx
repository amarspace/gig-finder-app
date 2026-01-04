import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import WelcomeScreen from "@/components/WelcomeScreen";
import ProfileGuestScreen from "@/components/ProfileGuestScreen";
import HomeAuthScreen from "@/components/HomeAuthScreen";
import CameraScreen from "@/components/CameraScreen";

type NavTab = "home" | "camera" | "profile";

const Index = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setActiveTab("home");
  };

  const renderContent = () => {
    if (activeTab === "camera") {
      return (
        <CameraScreen 
          onNavigateToProfile={() => setActiveTab("profile")} 
        />
      );
    }

    if (activeTab === "profile") {
      if (isAuthenticated) {
        return (
          <div className="min-h-screen pb-24 px-5 pt-12 animate-fade-in">
            <div className="text-center">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80"
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-primary"
              />
              <h2 className="mt-4 text-2xl font-bold text-foreground">Alex Reed</h2>
              <p className="text-muted-foreground">YouTube Music Connected</p>
              
              <button
                onClick={() => setIsAuthenticated(false)}
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
    if (isAuthenticated) {
      return <HomeAuthScreen />;
    }
    
    return <WelcomeScreen onNavigateToCamera={() => setActiveTab("camera")} />;
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background relative">
      {renderContent()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
