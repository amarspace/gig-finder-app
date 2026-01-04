interface GigCardProps {
  artist: string;
  venue: string;
  date: string;
  imageUrl: string;
  matchPercent?: number | null;
  matchState?: "matched" | "unmatched" | "unknown";
  size?: "large" | "small";
}

const GigCard = ({ 
  artist, 
  venue, 
  date, 
  imageUrl, 
  matchPercent, 
  matchState = "matched",
  size = "small" 
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
          
          <button className="mt-3 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
            </svg>
            YouTube
          </button>
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
          {matchState === "unknown" ? (
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
