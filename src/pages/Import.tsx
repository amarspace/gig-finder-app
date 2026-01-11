import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GigHeader from '@/components/GigHeader';
import { parsePlaylist, PlaylistAnalysis } from '@/lib/api/gigfinder';
import { usePlaylist } from '@/contexts/PlaylistContext';

type ImportState = 'idle' | 'loading' | 'analyzing' | 'success' | 'error';

const Import = () => {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<ImportState>('idle');
  const [error, setError] = useState('');
  const [analysis, setAnalysisResult] = useState<PlaylistAnalysis | null>(null);
  const { setAnalysis } = usePlaylist();
  const navigate = useNavigate();

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
      // Show "Analyzing your playlist style..." for 2 seconds
      setState('analyzing');
      setAnalysisResult(result.analysis);
      
      // Save to localStorage via context (works for guests and logged-in users)
      setAnalysis(result.analysis);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setState('success');
      
      // Navigate to results after brief success display
      setTimeout(() => {
        navigate('/results');
      }, 1000);
    } else {
      setState('error');
      setError(result.error || 'Failed to analyze playlist');
    }
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-24 animate-fade-in">
      <div className="pt-12">
        <GigHeader />
      </div>

      <div className="mt-12 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Import Your Playlist</h1>
          <p className="text-muted-foreground mt-2">
            We'll analyze your music taste and find matching events
          </p>
        </div>

        {/* Content based on state */}
        {state === 'loading' ? (
          <div className="py-12 text-center bg-card rounded-2xl border border-border">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-foreground font-medium">Fetching playlist...</p>
            <p className="text-sm text-muted-foreground mt-1">Reading your music library</p>
          </div>
        ) : state === 'analyzing' ? (
          <div className="py-12 text-center bg-card rounded-2xl border border-border">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <Sparkles className="w-16 h-16 text-primary animate-pulse" />
            </div>
            <p className="text-foreground font-bold text-lg">Analyzing your playlist style...</p>
            <p className="text-sm text-muted-foreground mt-2">Finding your perfect matches</p>
            
            {analysis && (
              <div className="mt-6 space-y-2 text-left bg-muted/50 rounded-xl p-4 mx-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Detected Taste Profile</p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Top Artists:</span>{' '}
                  <span className="text-foreground font-medium">{analysis.artists.slice(0, 3).join(', ')}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Genres:</span>{' '}
                  <span className="text-foreground font-medium">{analysis.genres.join(', ')}</span>
                </p>
              </div>
            )}
          </div>
        ) : state === 'success' ? (
          <div className="py-12 text-center bg-card rounded-2xl border border-border">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <p className="text-foreground font-bold text-lg">Style Profile Complete!</p>
            <p className="text-sm text-muted-foreground mt-2">Redirecting to your matches...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-2xl border border-border p-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Paste your playlist URL
              </label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="w-full h-12"
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

            <Button type="submit" className="w-full h-12 text-base" size="lg">
              <Sparkles className="w-5 h-5 mr-2" />
              Analyze My Taste
            </Button>

            {/* Quick examples */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-3 text-center">Or try an example:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setUrl('https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO')}
                  className="px-4 py-2 text-xs bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
                >
                  🇺🇦 Ukrainian Hits
                </button>
                <button
                  type="button"
                  onClick={() => setUrl('https://music.apple.com/us/playlist/ukraine-hits')}
                  className="px-4 py-2 text-xs bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
                >
                  🎵 Apple Music
                </button>
                <button
                  type="button"
                  onClick={() => setUrl('https://music.youtube.com/playlist?list=RDCLAK5uy_k')}
                  className="px-4 py-2 text-xs bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
                >
                  ▶️ YouTube Music
                </button>
              </div>
            </div>

            {/* No account needed notice */}
            <p className="text-xs text-center text-muted-foreground pt-4 border-t border-border">
              ✨ No account needed — your taste is saved locally
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Import;
