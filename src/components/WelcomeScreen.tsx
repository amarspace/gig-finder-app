import { Music, Camera } from "lucide-react";
import GigHeader from "./GigHeader";
import ActionCard from "./ActionCard";

interface WelcomeScreenProps {
  onNavigateToCamera: () => void;
}

const WelcomeScreen = ({ onNavigateToCamera }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen pb-24 px-5 animate-fade-in">
      <div className="pt-12">
        <GigHeader />
      </div>

      <div className="mt-12 space-y-4">
        <ActionCard
          icon={Music}
          title="Import Playlist"
          description="Paste a link to analyze music"
          variant="purple"
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
