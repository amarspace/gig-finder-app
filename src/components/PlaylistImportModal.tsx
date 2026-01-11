import { useState } from 'react';
import { X, Music, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parsePlaylist, PlaylistAnalysis } from '@/lib/api/gigfinder';

interface PlaylistImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (analysis: PlaylistAnalysis) => void;
}

type ImportState = 'idle' | 'loading' | 'success' | 'error';

const PlaylistImportModal = ({ isOpen, onClose, onSuccess }: PlaylistImportModalProps) => {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<ImportState>('idle');
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<PlaylistAnalysis | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please paste a playlist URL');
      return;
    }

    setState('loading');
    setError('');

    const result = await parsePlaylist(url);

    if (result.success && result.analysis) {
      setAnalysis(result.analysis);
      setState('success');
      
      // Auto-close after showing success
      setTimeout(() => {
        onSuccess(result.analysis!);
        handleClose();
      }, 1500);
    } else {
      setState('error');
      setError(result.error || 'Failed to analyze playlist');
    }
  };

  const handleClose = () => {
    setUrl('');
    setState('idle');
    setError('');
    setAnalysis(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl border border-border p-6">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Import Playlist</h2>
            <p className="text-sm text-muted-foreground">Analyze your music taste</p>
          </div>
        </div>

        {/* Content based on state */}
        {state === 'loading' ? (
          <div className="py-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-foreground font-medium">Searching for matches...</p>
            <p className="text-sm text-muted-foreground mt-1">Analyzing your music taste</p>
          </div>
        ) : state === 'success' && analysis ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="text-foreground font-medium">Analysis Complete!</p>
            <div className="mt-4 space-y-2 text-left bg-muted/50 rounded-xl p-4">
              <p className="text-sm">
                <span className="text-muted-foreground">Artists found:</span>{' '}
                <span className="text-foreground font-medium">{analysis.artists.slice(0, 3).join(', ')}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Genres detected:</span>{' '}
                <span className="text-foreground font-medium">{analysis.genres.join(', ')}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Source:</span>{' '}
                <span className="text-foreground font-medium capitalize">{analysis.source.replace('_', ' ')}</span>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Paste your playlist URL
              </label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Supports Spotify, Apple Music, and YouTube Music
              </p>
            </div>

            {state === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg">
              Analyze My Taste
            </Button>

            {/* Quick examples */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setUrl('https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO')}
                  className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
                >
                  Ukrainian Hits
                </button>
                <button
                  type="button"
                  onClick={() => setUrl('https://music.apple.com/us/playlist/ukraine-hits')}
                  className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
                >
                  Apple Music
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PlaylistImportModal;
