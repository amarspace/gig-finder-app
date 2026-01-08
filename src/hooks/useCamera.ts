import { useState, useRef, useCallback } from "react";

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isStreaming: boolean;
  capturedImage: string | null;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => string | null;
  clearCapture: () => void;
}

export const useCamera = (): UseCameraResult => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Request camera permission and start stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      streamRef.current = stream;
      setIsStreaming(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Camera access denied";
      setError(message);
      setIsStreaming(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return null;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageDataUrl);
    
    return imageDataUrl;
  }, [isStreaming]);

  const clearCapture = useCallback(() => {
    setCapturedImage(null);
  }, []);

  return {
    videoRef,
    canvasRef,
    isStreaming,
    capturedImage,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    clearCapture,
  };
};
