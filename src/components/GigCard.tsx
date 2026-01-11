interface GigCardProps {
  artist: string;
  venue: string;
  date: string;
  imageUrl: string;
  matchPercent?: number | null;
  matchState?: "matched" | "unmatched" | "unknown";
  size?: "large" | "small";
  showNewLabel?: boolean;
}

const GigCard = ({ 
  artist, 
  venue, 
  date, 
  imageUrl, 
  matchPercent, 
  matchState = "matched",
  size = "small",
  showNewLabel = false
}: GigCardProps) => {
  const getBadgeStyles = () => {
    if (matchState === "unknown") {
      return "bg-muted text-muted-foreground";
    }
    if (matchState === "unmatched") {
      return "bg-muted text-muted-foreground";
    }
    return "match-badge"; // Orange gradient for matched
  };

  const renderBadge = () => {
    if (showNewLabel) {
      return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold py-1 px-2 rounded-lg">
          NEW
          <br />
          <span className="text-[10px] font-medium">For You</span>
        </div>
      );
    }

    if (matchState === "unknown") {
      return (
        <div className={`${getBadgeStyles()} text-xs font-bold py-1 px-2 rounded-lg`}>
          ??%
          <br />
          <span className="text-[10px] font-medium">Match</span>
        </div>
      );
    }

    return (
      <div className={`${getBadgeStyles()} ${matchState === "unmatched" ? "text-xs font-bold py-1 px-2 rounded-lg" : ""}`}>
        {matchPercent}%
        <br />
        <span className="text-[10px] font-medium">Match</span>
      </div>
    );
  };

  if (size === "large") {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-card shadow-lg animate-scale-in">
        <img
          src={imageUrl}
          alt={artist}
          className="w-full h-56 object-cover"
        />
        
        <div className="absolute top-4 right-4">
          {renderBadge()}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
          <h3 className="text-2xl font-bold text-white">{artist}</h3>
          <p className="text-white/90">{venue}</p>
          
          <div className="mt-3 flex gap-2">
            <button className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition-opacity">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </button>
            <button className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
              </svg>
              YouTube
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-32 animate-scale-in">
      <div className="relative rounded-xl overflow-hidden bg-card shadow-md">
        <img
          src={imageUrl}
          alt={artist}
          className="w-full h-28 object-cover"
        />
        
        <div className="absolute top-2 right-2">
          {showNewLabel ? (
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] py-0.5 px-1.5 rounded font-bold">
              NEW
              <span className="block text-[8px]">For You</span>
            </div>
          ) : matchState === "unknown" ? (
            <div className="bg-muted text-muted-foreground text-[10px] py-0.5 px-1.5 rounded font-bold">
              ??%
              <span className="block text-[8px]">Match</span>
            </div>
          ) : matchState === "unmatched" ? (
            <div className="bg-muted text-muted-foreground text-[10px] py-0.5 px-1.5 rounded font-bold">
              {matchPercent}%
              <span className="block text-[8px]">Match</span>
            </div>
          ) : (
            <div className="match-badge text-[10px] py-0.5 px-1.5">
              {matchPercent}%
              <span className="block text-[8px]">Match</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-2">
        <h4 className="font-semibold text-sm text-foreground truncate">{artist}</h4>
        <p className="text-xs text-muted-foreground truncate">{date}</p>
      </div>
    </div>
  );
};

export default GigCard;
