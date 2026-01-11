import { createContext, useContext, useState, ReactNode } from 'react';
import { PlaylistAnalysis } from '@/lib/api/gigfinder';

interface PlaylistContextType {
  analysis: PlaylistAnalysis | null;
  setAnalysis: (analysis: PlaylistAnalysis | null) => void;
  hasImported: boolean;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysisState] = useState<PlaylistAnalysis | null>(() => {
    // Try to restore from localStorage
    const stored = localStorage.getItem('gigfinder_playlist_analysis');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  const setAnalysis = (newAnalysis: PlaylistAnalysis | null) => {
    setAnalysisState(newAnalysis);
    if (newAnalysis) {
      localStorage.setItem('gigfinder_playlist_analysis', JSON.stringify(newAnalysis));
    } else {
      localStorage.removeItem('gigfinder_playlist_analysis');
    }
  };

  return (
    <PlaylistContext.Provider value={{ analysis, setAnalysis, hasImported: !!analysis }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}
