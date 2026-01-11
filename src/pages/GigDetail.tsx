import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Instagram, Youtube, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import WishlistButton from "@/components/WishlistButton";

interface Gig {
  id: string;
  artist_name: string;
  venue_name: string;
  event_date: string;
  genre: string;
  image_url: string | null;
  match_percentage: number | null;
}

// Mock top tracks data
const mockTopTracks = [
  { id: 1, title: "Popular Song #1", duration: "3:24" },
  { id: 2, title: "Hit Single", duration: "4:01" },
  { id: 3, title: "Fan Favorite", duration: "3:45" },
];

const GigDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGig = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("gigs")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setGig(data);
      }
      setLoading(false);
    };

    fetchGig();
  }, [id]);

  const calculateMatch = (): { percent: number; state: "matched" | "unmatched" | "unknown" } => {
    if (!user || !profile?.is_synced || !gig) {
      return { percent: 0, state: "unknown" };
    }

    const userGenres = profile.favorite_genres || [];
    const isMatch = userGenres.some((userGenre) => 
      gig.genre.toLowerCase().includes(userGenre.toLowerCase()) ||
      userGenre.toLowerCase().includes(gig.genre.toLowerCase())
    );

    if (isMatch) {
      return { percent: Math.floor(Math.random() * 15) + 85, state: "matched" };
    }
    return { percent: Math.floor(Math.random() * 31) + 10, state: "unmatched" };
  };

  const matchData = calculateMatch();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <p className="text-muted-foreground">Event not found</p>
        <Button variant="ghost" onClick={() => navigate("/")} className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Hero Image */}
      <div className="relative h-72">
        <img
          src={gig.image_url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80"}
          alt={gig.artist_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 p-2 rounded-full bg-background/80 backdrop-blur-sm"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>

        {/* Match Badge */}
        <div className="absolute top-12 right-4">
          {matchData.state === "unknown" ? (
            <div className="bg-muted text-muted-foreground text-sm font-bold py-2 px-3 rounded-lg">
              ??%
              <span className="block text-xs font-medium">Match</span>
            </div>
          ) : matchData.state === "matched" ? (
            <div className="match-badge text-sm py-2 px-3">
              {matchData.percent}%
              <span className="block text-xs font-medium">Match</span>
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground text-sm font-bold py-2 px-3 rounded-lg">
              {matchData.percent}%
              <span className="block text-xs font-medium">Match</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 -mt-8 relative z-10">
        {/* Title & Favorite */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{gig.artist_name}</h1>
            <p className="text-muted-foreground mt-1">{gig.venue_name}</p>
            <p className="text-sm text-primary font-medium mt-1">
              {format(new Date(gig.event_date), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <WishlistButton gigId={gig.id} size="lg" />
        </div>

        {/* Genre Tag */}
        <div className="mt-4">
          <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
            {gig.genre}
          </span>
        </div>

        {/* Top Hits Section */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-3">Popular Songs</h2>
          <div className="space-y-3">
            {mockTopTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border"
              >
                <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Play size={18} className="text-primary ml-0.5" />
                </button>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{track.title}</p>
                  <p className="text-sm text-muted-foreground">{track.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Description */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-3">About</h2>
          <p className="text-muted-foreground leading-relaxed">
            Don't miss {gig.artist_name} performing live at {gig.venue_name}! 
            This {gig.genre} artist is known for their electrifying performances 
            and unique sound that blends traditional elements with modern beats. 
            Get ready for an unforgettable night of music and energy.
          </p>
        </section>

        {/* Social Links - Instagram & YouTube Only */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-3">Follow</h2>
          <div className="flex gap-3">
            <a
              href={`https://www.instagram.com/explore/tags/${gig.artist_name.replace(/\s+/g, '').toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              <Instagram size={20} />
              <span className="text-sm font-medium">Instagram</span>
            </a>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(gig.artist_name)}+official+music`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              <Youtube size={20} />
              <span className="text-sm font-medium">YouTube</span>
            </a>
          </div>
        </section>

        {/* Buy Tickets Button */}
        <Button
          className="w-full mt-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-2xl"
          onClick={() => window.open(`https://kontramarka.ua/uk/search?query=${encodeURIComponent(gig.artist_name)}`, '_blank')}
        >
          Get Tickets
        </Button>
      </div>
    </div>
  );
};

export default GigDetail;
