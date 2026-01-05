interface EventCardProps {
  title: string;
  location: string;
  date: string;
  imageUrl: string;
  category: "festival" | "culture";
  onClick?: () => void;
}

const EventCard = ({ title, location, date, imageUrl, category, onClick }: EventCardProps) => {
  const getCategoryBadge = () => {
    if (category === "festival") {
      return (
        <span className="px-2 py-1 bg-accent/20 text-accent text-[10px] font-bold rounded">
          FESTIVAL
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-secondary text-secondary-foreground text-[10px] font-bold rounded">
        CULTURE
      </span>
    );
  };

  return (
    <div 
      className="flex-shrink-0 w-56 cursor-pointer animate-scale-in"
      onClick={onClick}
    >
      <div className="relative rounded-xl overflow-hidden bg-card shadow-md">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-36 object-cover"
        />
        
        <div className="absolute top-2 left-2">
          {getCategoryBadge()}
        </div>
      </div>
      
      <div className="mt-2">
        <h4 className="font-semibold text-sm text-foreground line-clamp-1">{title}</h4>
        <p className="text-xs text-muted-foreground truncate">{location}</p>
        <p className="text-xs text-primary font-medium mt-0.5">{date}</p>
      </div>
    </div>
  );
};

export default EventCard;
