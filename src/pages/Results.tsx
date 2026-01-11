import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Sparkles, Music } from 'lucide-react';
import GigHeader from '@/components/GigHeader';
import GigCard from '@/components/GigCard';
import WishlistButton from '@/components/WishlistButton';
import { supabase } from '@/integrations/supabase/client';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { calculateMatchPercent } from '@/lib/api/gigfinder';

interface Gig {
  id: string;
  artist_name: string;
  venue_name: string;
  event_date: string;
  genre: string;
  image_url: string | null;
}

interface MatchedGig extends Gig {
  percent: number;
  state: 'matched' | 'unmatched' | 'unknown';
  isNewForYou: boolean;
}

const Results = () => {
  const [gigs, setGigs] = useState<MatchedGig[]>([]);
  const [loading, setLoading] = useState(true);
  const { analysis, hasImported } = usePlaylist();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAndMatchGigs = async () => {
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .order('event_date', { ascending: true });

      if (!error && data) {
        // Calculate match for each gig
        const matchedGigs: MatchedGig[] = data.map((gig) => {
          const { percent, state } = calculateMatchPercent(
            gig.genre,
            gig.artist_name,
            analysis
          );

          // Determine if it's "New for You" (no overlap)
          const isNewForYou = !analysis || (percent < 50 && state === 'unmatched');

          return {
            ...gig,
            percent,
            state,
            isNewForYou: isNewForYou && percent < 40,
          };
        });

        // Sort by match percentage (highest first)
        matchedGigs.sort((a, b) => {
          // Put "New for You" at the bottom
          if (a.isNewForYou && !b.isNewForYou) return 1;
          if (!a.isNewForYou && b.isNewForYou) return -1;
          return b.percent - a.percent;
        });

        setGigs(matchedGigs);
      }
      setLoading(false);
    };

    fetchAndMatchGigs();
  }, [analysis]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const handleGigClick = (gigId: string) => {
    navigate(`/gig/${gigId}`);
  };

  const topMatches = gigs.filter(g => g.percent >= 85);
  const goodMatches = gigs.filter(g => g.percent >= 60 && g.percent < 85);
  const newForYou = gigs.filter(g => g.isNewForYou || g.percent < 60);

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      <div className="px-5 pt-8">
        <GigHeader />
      </div>

      {/* Back Button */}
      <div className="px-5 mt-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back to Home</span>
        </button>
      </div>

      {/* Taste Profile Summary */}
      {hasImported && analysis && (
        <div className="mx-5 mt-4 p-4 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Your Style Profile</p>
              <p className="text-xs text-muted-foreground">Based on your imported playlist</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No playlist imported notice */}
      {!hasImported && (
        <div className="mx-5 mt-4 p-4 bg-muted/50 rounded-2xl border border-border text-center">
          <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Import a playlist to get personalized matches
          </p>
          <button
            onClick={() => navigate('/import')}
            className="mt-3 text-primary text-sm font-medium hover:underline"
          >
            Import Playlist →
          </button>
        </div>
      )}

      {loading ? (
        <div className="px-5 mt-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* High Matches (85-99%) */}
          {topMatches.length > 0 && (
            <section className="mt-8">
              <div className="px-5 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Top Style Matches</h2>
                <span className="ml-auto text-xs text-muted-foreground">85%+</span>
              </div>
              <div className="space-y-3 px-5">
                {topMatches.map((gig) => (
                  <div
                    key={gig.id}
                    onClick={() => handleGigClick(gig.id)}
                    className="cursor-pointer relative"
                  >
                    <GigCard
                      artist={gig.artist_name}
                      venue={gig.venue_name}
                      date={formatDate(gig.event_date)}
                      imageUrl={gig.image_url || ''}
                      matchPercent={gig.percent}
                      matchState={gig.state}
                      size="large"
                    />
                    <div className="absolute top-4 left-4">
                      <WishlistButton gigId={gig.id} size="md" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Good Matches (60-84%) */}
          {goodMatches.length > 0 && (
            <section className="mt-8">
              <div className="px-5 mb-3">
                <h2 className="text-lg font-bold text-foreground">Good Matches</h2>
                <span className="text-xs text-muted-foreground">Similar to your taste</span>
              </div>
              <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
                {goodMatches.map((gig) => (
                  <div
                    key={gig.id}
                    onClick={() => handleGigClick(gig.id)}
                    className="cursor-pointer relative"
                  >
                    <GigCard
                      artist={gig.artist_name}
                      venue={gig.venue_name}
                      date={formatDate(gig.event_date)}
                      imageUrl={gig.image_url || ''}
                      matchPercent={gig.percent}
                      matchState={gig.state}
                    />
                    <div className="absolute top-2 left-2">
                      <WishlistButton gigId={gig.id} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* New for You */}
          {newForYou.length > 0 && (
            <section className="mt-8">
              <div className="px-5 mb-3">
                <h2 className="text-lg font-bold text-foreground">New for You</h2>
                <span className="text-xs text-muted-foreground">Discover something different</span>
              </div>
              <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
                {newForYou.map((gig) => (
                  <div
                    key={gig.id}
                    onClick={() => handleGigClick(gig.id)}
                    className="cursor-pointer relative"
                  >
                    <GigCard
                      artist={gig.artist_name}
                      venue={gig.venue_name}
                      date={formatDate(gig.event_date)}
                      imageUrl={gig.image_url || ''}
                      matchPercent={0}
                      matchState="unknown"
                      showNewLabel
                    />
                    <div className="absolute top-2 left-2">
                      <WishlistButton gigId={gig.id} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Results;
