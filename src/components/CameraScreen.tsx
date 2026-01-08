import { useEffect, useState } from "react";
import { Image, User, Check, X, RefreshCw } from "lucide-react";
import GigHeader from "./GigHeader";
import { useCamera } from "@/hooks/useCamera";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { toast } from "@/hooks/use-toast";

interface CameraScreenProps {
  onNavigateToProfile: () => void;
}

const CameraScreen = ({ onNavigateToProfile }: CameraScreenProps) => {
  const { videoRef, canvasRef, isStreaming, capturedImage, error, startCamera, stopCamera, capturePhoto, clearCapture } = useCamera();
  const { setProfilePhoto } = useUserSettings();
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      setShowConfirmation(true);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      setProfilePhoto(capturedImage);
      toast({
        title: "Profile photo updated",
        description: "Your new profile photo has been saved.",
      });
      setShowConfirmation(false);
      clearCapture();
    }
  };

  const handleRetake = () => {
    setShowConfirmation(false);
    clearCapture();
  };

  const handleFileInput = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target?.result as string;
          setProfilePhoto(imageData);
          toast({
            title: "Profile photo updated",
            description: "Your new profile photo has been saved from gallery.",
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm">
        <GigHeader />
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative bg-gradient-to-b from-amber-200/60 via-amber-100/40 to-amber-50/60 overflow-hidden">
        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Confirmation overlay */}
        {showConfirmation && capturedImage ? (
          <div className="absolute inset-0 z-20 flex flex-col">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-white text-center mb-4 font-medium">Use this as your profile photo?</p>
              <div className="flex justify-center gap-6">
                <button
                  onClick={handleRetake}
                  className="p-4 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <X size={28} />
                </button>
                <button
                  onClick={handleConfirm}
                  className="p-4 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Check size={28} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Video stream */}
            {isStreaming && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-6 max-w-xs">
                  <p className="text-foreground font-medium mb-2">Camera unavailable</p>
                  <p className="text-muted-foreground text-sm mb-4">{error}</p>
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <RefreshCw size={16} />
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {!isStreaming && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Scan Frame */}
            {isStreaming && (
              <div className="absolute inset-8 border-4 border-primary/60 rounded-3xl flex items-end justify-center pb-16 pointer-events-none">
                <p className="text-white/80 font-medium text-lg drop-shadow-lg">Take a profile photo</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Camera Controls */}
      <div className="bg-card py-6 px-8 flex items-center justify-between safe-area-bottom">
        <button 
          onClick={handleFileInput}
          className="p-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Image size={28} />
        </button>
        
        {/* Capture Button */}
        <button 
          onClick={handleCapture}
          disabled={!isStreaming || showConfirmation}
          className="relative group disabled:opacity-50"
        >
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
