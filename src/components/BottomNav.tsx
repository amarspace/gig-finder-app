import { Music, Camera, User } from "lucide-react";

type NavTab = "home" | "camera" | "profile";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around py-3">
        <button
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${
            activeTab === "home" ? "nav-icon-active" : "nav-icon"
          }`}
        >
          <Music size={24} strokeWidth={activeTab === "home" ? 2.5 : 1.5} />
        </button>

        <button
          onClick={() => onTabChange("camera")}
          className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${
            activeTab === "camera" ? "nav-icon-active" : "nav-icon"
          }`}
        >
          <Camera size={24} strokeWidth={activeTab === "camera" ? 2.5 : 1.5} />
        </button>

        <button
          onClick={() => onTabChange("profile")}
          className={`flex flex-col items-center gap-1 p-2 transition-all duration-200 ${
            activeTab === "profile" ? "nav-icon-active" : "nav-icon"
          }`}
        >
          <User size={24} strokeWidth={activeTab === "profile" ? 2.5 : 1.5} />
        </button>
      </div>
      
      {/* Home indicator bar */}
      <div className="flex justify-center pb-2">
        <div className="w-32 h-1 bg-foreground/20 rounded-full" />
      </div>
    </nav>
  );
};

export default BottomNav;
