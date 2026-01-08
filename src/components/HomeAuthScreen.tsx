import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import GigHeader from "./GigHeader";
import GigCard from "./GigCard";
import VenueCard from "./VenueCard";
import EventCard from "./EventCard";
import ProfileAvatar from "./ProfileAvatar";
import TravelTimeDisplay from "./TravelTimeDisplay";
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

// City filter type
type CityFilter = "Kyiv" | "Lviv" | "Berlin";

interface VenueData {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  matchPercent: number;
}

// Mock data for venues by city
const venuesByCity: Record<CityFilter, VenueData[]> = {
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

const cityFilters: CityFilter[] = ["Kyiv", "Lviv", "Berlin"];

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

const HomeAuthScreen = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<CityFilter>("Kyiv");
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
          <div onClick={() => handleGigClick(featuredGig.id)} className="cursor-pointer">
            <GigCard
              artist={featuredGig.artist_name}
              venue={featuredGig.venue_name}
              date={formatDate(featuredGig.event_date)}
              imageUrl={featuredGig.image_url || ""}
              matchPercent={featuredGig.percent}
              matchState={featuredGig.state}
              size="large"
            />
          </div>
        ) : null}
      </section>

      {/* Upcoming Gigs Section */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground mb-3 px-5">Upcoming Gigs</h2>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-36 h-44 bg-muted rounded-xl animate-pulse flex-shrink-0" />
            ))
          ) : (
            otherGigs.map((gig) => (
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
            ))
          )}
        </div>
      </section>

      {/* Local Vibe Section */}
      <section className="mt-8">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-lg font-bold text-foreground">Local Vibe</h2>
          <a href="https://instagram.com/gigfindermusic" target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium">
            @gigfindermusic
          </a>
        </div>
        
        {/* City Filters */}
        <div className="flex gap-2 px-5 mb-3 overflow-x-auto scrollbar-hide">
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
        
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
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
      </section>

      {/* Festivals Section */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground mb-3 px-5">Festivals</h2>
        <div className="flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-hide">
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
      </section>

      {/* City Culture Section */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground mb-3 px-5">City Culture</h2>
        <div className="flex gap-4 overflow-x-auto px-5 pb-2 scrollbar-hide">
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
      </section>
    </div>
  );
};

export default HomeAuthScreen;
