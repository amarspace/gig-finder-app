import { Music, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GigHeader from "./GigHeader";
import ActionCard from "./ActionCard";
import MoodGraphic from "./MoodGraphic";

interface WelcomeScreenProps {
  onNavigateToCamera: () => void;
  onSyncComplete: () => void;
}

const WelcomeScreen = ({ onNavigateToCamera }: WelcomeScreenProps) => {
  const navigate = useNavigate();

  const handleImportPlaylist = () => {
    // Navigate directly to public import page (no auth required)
    navigate("/import");
  };

  return (
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
  );
};

export default WelcomeScreen;
