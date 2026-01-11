import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import GigHeader from "./GigHeader";
import GigCard from "./GigCard";
import ProfileAvatar from "./ProfileAvatar";
import SectionHeader from "./SectionHeader";
import WishlistButton from "./WishlistButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Gig {
  id: string;
  artist_name: string;
  venue_name: string;
  event_date: string;
  genre: string;
  image_url: string | null;
  match_percentage: number | null;
}

const HomeAuthScreen = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGigs = async () => {
      const { data, error } = await supabase
        .from("gigs")
        .select("*")
        .order("event_date", { ascending: true });

      if (!error && data) {
        setGigs(data);
      }
      setLoading(false);
    };

    fetchGigs();
  }, []);

  const calculateMatch = (gigGenre: string): { percent: number; state: "matched" | "unmatched" | "unknown" } => {
    if (!user || !profile?.is_synced) {
      return { percent: 0, state: "unknown" };
    }

    const userGenres = profile.favorite_genres || [];
    const isMatch = userGenres.some((userGenre) => 
      gigGenre.toLowerCase().includes(userGenre.toLowerCase()) ||
      userGenre.toLowerCase().includes(gigGenre.toLowerCase())
    );

    if (isMatch) {
      const percent = Math.floor(Math.random() * 15) + 85;
      return { percent, state: "matched" };
    } else {
      const percent = Math.floor(Math.random() * 31) + 10;
      return { percent, state: "unmatched" };
    }
  };

  const gigsWithMatch = gigs.map((gig) => ({
    ...gig,
    ...calculateMatch(gig.genre),
  })).sort((a, b) => b.percent - a.percent);

  const featuredGig = gigsWithMatch[0];
  const otherGigs = gigsWithMatch.slice(1);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const handleGigClick = (gigId: string) => {
    navigate(`/gig/${gigId}`);
  };

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="px-5 pt-8">
        <GigHeader />
      </div>

      {/* User Profile Bar */}
      <div className="mx-5 mt-4 p-3 bg-card rounded-2xl flex items-center gap-3 shadow-sm">
        <ProfileAvatar size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {profile?.full_name || user?.email?.split("@")[0] || "User"}
            </span>
            {profile?.is_synced && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                  <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
                </svg>
                YouTube Music Synced
              </div>
            )}
          </div>
        </div>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Top Match Section */}
      <section className="mt-6 px-5">
        <h2 className="text-lg font-bold text-foreground mb-3">Top Match for You</h2>
        {loading ? (
          <div className="h-48 bg-muted rounded-2xl animate-pulse" />
        ) : featuredGig ? (
          <div onClick={() => handleGigClick(featuredGig.id)} className="cursor-pointer relative">
            <GigCard
              artist={featuredGig.artist_name}
              venue={featuredGig.venue_name}
              date={formatDate(featuredGig.event_date)}
              imageUrl={featuredGig.image_url || ""}
              matchPercent={featuredGig.percent}
              matchState={featuredGig.state}
              size="large"
            />
            <div className="absolute top-4 left-4">
              <WishlistButton gigId={featuredGig.id} size="md" />
            </div>
          </div>
        ) : null}
      </section>

      {/* Upcoming Gigs Section */}
      <section className="mt-8">
        <SectionHeader title="Upcoming Gigs" sectionKey="gigs" />
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-36 h-44 bg-muted rounded-xl animate-pulse flex-shrink-0" />
            ))
          ) : (
            otherGigs.map((gig) => (
              <div key={gig.id} onClick={() => handleGigClick(gig.id)} className="cursor-pointer relative">
                <GigCard
                  artist={gig.artist_name}
                  venue={gig.venue_name}
                  date={formatDate(gig.event_date)}
                  imageUrl={gig.image_url || ""}
                  matchPercent={gig.percent}
                  matchState={gig.state}
                />
                <div className="absolute top-2 left-2">
                  <WishlistButton gigId={gig.id} size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Local Vibe, Festivals, and City Culture sections removed - no mock data */}
    </div>
  );
};

export default HomeAuthScreen;
