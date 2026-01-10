import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import GigCard from "@/components/GigCard";
import VenueCard from "@/components/VenueCard";
import EventCard from "@/components/EventCard";

type CityFilter = "Kyiv" | "Lviv" | "Berlin";

// Mock data (shared with HomeAuthScreen)
const venuesByCity: Record<CityFilter, Array<{ id: string; name: string; type: string; imageUrl: string; matchPercent: number }>> = {
  Kyiv: [
    { id: "1", name: "Барабан", type: "Live Music Bar", imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80", matchPercent: 92 },
    { id: "2", name: "Atlas", type: "Concert Hall", imageUrl: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&q=80", matchPercent: 88 },
    { id: "3", name: "Caribbean Club", type: "Jazz Bar", imageUrl: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=400&q=80", matchPercent: 75 },
    { id: "4", name: "Docker's ABC", type: "Pub & Grill", imageUrl: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&q=80", matchPercent: 68 },
  ],
  Lviv: [
    { id: "5", name: "Lviv Opera House", type: "Opera & Ballet", imageUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&q=80", matchPercent: 95 },
    { id: "6", name: "!FESTrepublic", type: "Concert Venue", imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&q=80", matchPercent: 89 },
    { id: "7", name: "Picasso Club", type: "Live Music Club", imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80", matchPercent: 82 },
    { id: "8", name: "Pravda Beer Theatre", type: "Brewery & Stage", imageUrl: "https://images.unsplash.com/photo-1574447714530-e9aa4c6b9c3e?w=400&q=80", matchPercent: 78 },
  ],
  Berlin: [
    { id: "9", name: "Berlin Arena", type: "Arena", imageUrl: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400&q=80", matchPercent: 91 },
    { id: "10", name: "Berghain", type: "Techno Club", imageUrl: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=400&q=80", matchPercent: 96 },
    { id: "11", name: "SO36", type: "Punk & Alternative", imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80", matchPercent: 85 },
    { id: "12", name: "Lido Berlin", type: "Live Music Venue", imageUrl: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400&q=80", matchPercent: 79 },
  ],
};

const mockFestivals = [
  { id: "1", title: "Atlas Weekend 2026", location: "VDNH, Kyiv", date: "Jul 3-6, 2026", imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80" },
  { id: "2", title: "Koktebel Jazz Festival", location: "Zatoka, Odesa", date: "Aug 20-23, 2026", imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80" },
  { id: "3", title: "Leopolis Jazz Fest", location: "Lviv Center", date: "Jun 25-28, 2026", imageUrl: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80" },
];

const mockCulture = [
  { id: "1", title: "Modern Art Exhibition", location: "PinchukArtCentre", date: "Jan 15 - Mar 30", imageUrl: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=600&q=80" },
  { id: "2", title: "Theatre: Romeo & Juliet", location: "Franko Theatre", date: "Feb 14, 2026", imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&q=80" },
  { id: "3", title: "Vintage Market", location: "Podil District", date: "Every Sunday", imageUrl: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80" },
];

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<CityFilter>(
    (searchParams.get("city") as CityFilter) || "Kyiv"
  );

  const cityFilters: CityFilter[] = ["Kyiv", "Lviv", "Berlin"];

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
          <>
            {/* City Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {cityFilters.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCity === city
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {city} Local Vibes
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {venuesByCity[selectedCity].map((venue) => (
                <VenueCard
                  key={venue.id}
                  name={venue.name}
                  type={venue.type}
                  imageUrl={venue.imageUrl}
                  matchPercent={venue.matchPercent}
                  selectedCity={selectedCity}
                />
              ))}
            </div>
          </>
        );

      case "gigs":
        const gigsWithMatch = gigs.map((gig) => ({
          ...gig,
          ...calculateMatch(gig.genre),
        }));

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
          <div className="grid grid-cols-1 gap-4">
            {mockFestivals.map((festival) => (
              <EventCard
                key={festival.id}
                title={festival.title}
                location={festival.location}
                date={festival.date}
                imageUrl={festival.imageUrl}
                category="festival"
              />
            ))}
          </div>
        );

      case "culture":
        return (
          <div className="grid grid-cols-1 gap-4">
            {mockCulture.map((item) => (
              <EventCard
                key={item.id}
                title={item.title}
                location={item.location}
                date={item.date}
                imageUrl={item.imageUrl}
                category="culture"
              />
            ))}
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
