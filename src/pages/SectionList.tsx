import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import GigCard from "@/components/GigCard";

interface Gig {
  id: string;
  artist_name: string;
  venue_name: string;
  event_date: string;
  genre: string;
  image_url: string | null;
  match_percentage: number | null;
}

const sectionTitles: Record<string, string> = {
  "local-vibe": "Local Vibe",
  gigs: "Upcoming Gigs",
  festivals: "Festivals",
  culture: "City Culture",
};

const SectionList = () => {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGigs = async () => {
      if (section === "gigs") {
        const { data, error } = await supabase
          .from("gigs")
          .select("*")
          .order("event_date", { ascending: true });

        if (!error && data) {
          setGigs(data);
        }
      }
      setLoading(false);
    };

    fetchGigs();
  }, [section]);

  const calculateMatch = (gigGenre: string): { percent: number; state: "matched" | "unmatched" | "unknown" } => {
    if (!user || !profile?.is_synced) {
      return { percent: 0, state: "unknown" };
    }

    const userGenres = profile.favorite_genres || [];
    const isMatch = userGenres.some(
      (userGenre) =>
        gigGenre.toLowerCase().includes(userGenre.toLowerCase()) ||
        userGenre.toLowerCase().includes(gigGenre.toLowerCase())
    );

    if (isMatch) {
      const percent = Math.floor(Math.random() * 15) + 85;
      return { percent, state: "matched" };
    }
    return { percent: Math.floor(Math.random() * 31) + 10, state: "unmatched" };
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const handleGigClick = (gigId: string) => {
    navigate(`/gig/${gigId}`);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }

    switch (section) {
      case "local-vibe":
        return (
          <div className="flex flex-col items-center justify-center py-16 px-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground mb-2">No Local Vibes Yet</p>
              <p className="text-sm text-muted-foreground">
                Local venue data will appear here when available.
              </p>
            </div>
          </div>
        );

      case "gigs":
        const gigsWithMatch = gigs.map((gig) => ({
          ...gig,
          ...calculateMatch(gig.genre),
        }));

        if (gigsWithMatch.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 px-5">
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground mb-2">No Gigs Found</p>
                <p className="text-sm text-muted-foreground">
                  Check back later for upcoming events.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-2 gap-4">
            {gigsWithMatch.map((gig) => (
              <div key={gig.id} onClick={() => handleGigClick(gig.id)} className="cursor-pointer">
                <GigCard
                  artist={gig.artist_name}
                  venue={gig.venue_name}
                  date={formatDate(gig.event_date)}
                  imageUrl={gig.image_url || ""}
                  matchPercent={gig.percent}
                  matchState={gig.state}
                />
              </div>
            ))}
          </div>
        );

      case "festivals":
        return (
          <div className="flex flex-col items-center justify-center py-16 px-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground mb-2">No Festivals Yet</p>
              <p className="text-sm text-muted-foreground">
                Festival data will appear here when available.
              </p>
            </div>
          </div>
        );

      case "culture":
        return (
          <div className="flex flex-col items-center justify-center py-16 px-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground mb-2">No Cultural Events Yet</p>
              <p className="text-sm text-muted-foreground">
                Cultural event data will appear here when available.
              </p>
            </div>
          </div>
        );

      default:
        return <p className="text-muted-foreground">Section not found</p>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 px-5 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">
            {sectionTitles[section || ""] || "Events"}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-4">{renderContent()}</div>
    </div>
  );
};

export default SectionList;
