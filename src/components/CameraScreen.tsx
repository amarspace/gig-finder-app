import { Image, User } from "lucide-react";
import GigHeader from "./GigHeader";

interface CameraScreenProps {
  onNavigateToProfile: () => void;
}

const CameraScreen = ({ onNavigateToProfile }: CameraScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm">
        <GigHeader />
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative bg-gradient-to-b from-amber-200/60 via-amber-100/40 to-amber-50/60">
        {/* Scan Frame */}
        <div className="absolute inset-8 border-4 border-primary rounded-3xl flex items-end justify-center pb-16">
          <p className="text-foreground/70 font-medium text-lg">Align poster here</p>
        </div>
        
        {/* Simulated camera background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-200/50 via-stone-200/40 to-amber-100/50" />
      </div>

      {/* Camera Controls */}
      <div className="bg-card py-6 px-8 flex items-center justify-between safe-area-bottom">
        <button className="p-3 text-muted-foreground hover:text-foreground transition-colors">
          <Image size={28} />
        </button>
        
        {/* Capture Button */}
        <button className="relative group">
          <div className="w-20 h-20 rounded-full bg-card border-4 border-muted flex items-center justify-center transition-transform active:scale-95">
            <div className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 transition-colors" />
          </div>
        </button>
        
        <button 
          onClick={onNavigateToProfile}
          className="p-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <User size={28} />
        </button>
      </div>
    </div>
  );
};

export default CameraScreen;
