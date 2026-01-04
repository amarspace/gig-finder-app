import { Loader2 } from "lucide-react";

interface SyncOverlayProps {
  isVisible: boolean;
}

const SyncOverlay = ({ isVisible }: SyncOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="text-center space-y-4">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-orange-start animate-spin mx-auto" />
        </div>
        <p className="text-lg font-medium text-foreground">
          Analyzing your YouTube Music library...
        </p>
        <p className="text-sm text-muted-foreground">
          Finding your favorite genres
        </p>
      </div>
    </div>
  );
};

export default SyncOverlay;
