import { useState } from "react";
import { Music, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GigHeader from "./GigHeader";
import ActionCard from "./ActionCard";
import SyncOverlay from "./SyncOverlay";
import MoodGraphic from "./MoodGraphic";
import { useAuth } from "@/contexts/AuthContext";

interface WelcomeScreenProps {
  onNavigateToCamera: () => void;
  onSyncComplete: () => void;
}

const WelcomeScreen = ({ onNavigateToCamera, onSyncComplete }: WelcomeScreenProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const { user, syncYouTubeMusic } = useAuth();
  const navigate = useNavigate();

  const handleImportPlaylist = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsSyncing(true);
    
    // Simulate 3-second loading
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // Update user's favorite genres
    await syncYouTubeMusic();
    
    setIsSyncing(false);
    onSyncComplete();
  };

  return (
    <>
      <SyncOverlay isVisible={isSyncing} />
      
      <div className="min-h-screen pb-24 px-5 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="pt-12">
          <GigHeader />
        </div>

        {/* Central Mood Graphic */}
        <div className="flex-1 flex items-center justify-center">
          <MoodGraphic />
        </div>

        {/* Action Buttons - Bottom Third */}
        <div className="space-y-4 mt-auto pb-4">
          <ActionCard
            icon={Music}
            title="Import Playlist"
            description="Paste a link to analyze music"
            variant="purple"
            onClick={handleImportPlaylist}
          />
          
          <ActionCard
            icon={Camera}
            title="Photo Scan"
            description="Scan any poster or screenshot"
            variant="orange"
            onClick={onNavigateToCamera}
          />
        </div>
      </div>
    </>
  );
};

export default WelcomeScreen;
