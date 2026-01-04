import { MoreHorizontal } from "lucide-react";
import GigHeader from "./GigHeader";
import GigCard from "./GigCard";

const mockGigs = {
  featured: {
    artist: "DOROFIEVA",
    venue: "Live in Kyiv",
    date: "Dec 15, 2024",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
    matchPercent: 98,
  },
  playlist: [
    { artist: "FECF DOPFEVA", date: "2 pan 21, UA SVV", imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&q=80", matchPercent: 86 },
    { artist: "ARTEM DIVABARO", date: "2epam 98", imageUrl: "https://images.unsplash.com/photo-1547355253-ff0740f6e8c1?w=300&q=80", matchPercent: 96 },
    { artist: "ARTEM FIVABARO", date: "15 peh 24, UA POP", imageUrl: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=300&q=80", matchPercent: 86 },
  ],
  upcoming: [
    { artist: "ARTEM PIBABARO", date: "18 pan 22, UA POP", imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80", matchPercent: 99 },
    { artist: "KOLA", date: "9 pan 22, UA POP", imageUrl: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=300&q=80", matchPercent: 97 },
    { artist: "KOLA", date: "16pain 22, UA ROD", imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&q=80", matchPercent: 99 },
  ],
};

const HomeAuthScreen = () => {
  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="px-5 pt-8">
        <GigHeader />
      </div>

      {/* User Profile Bar */}
      <div className="mx-5 mt-4 p-3 bg-card rounded-2xl flex items-center gap-3 shadow-sm">
        <img
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
          alt="User avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Alex Reed</span>
            <div className="flex items-center gap-1 text-xs text-red-600">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
              </svg>
              YouTube Music Synced
            </div>
          </div>
        </div>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Top Match Section */}
      <section className="mt-6 px-5">
        <h2 className="text-lg font-bold text-foreground mb-3">Top Match for You</h2>
        <GigCard
          {...mockGigs.featured}
          size="large"
        />
      </section>

      {/* Based on Playlist Section */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground mb-3 px-5">Based on your Playlist: UA POP</h2>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {mockGigs.playlist.map((gig, index) => (
            <GigCard
              key={index}
              artist={gig.artist}
              venue=""
              date={gig.date}
              imageUrl={gig.imageUrl}
              matchPercent={gig.matchPercent}
            />
          ))}
        </div>
      </section>

      {/* Upcoming Gigs Section */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-foreground mb-3 px-5">Upcoming Gigs</h2>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {mockGigs.upcoming.map((gig, index) => (
            <GigCard
              key={index}
              artist={gig.artist}
              venue=""
              date={gig.date}
              imageUrl={gig.imageUrl}
              matchPercent={gig.matchPercent}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomeAuthScreen;
