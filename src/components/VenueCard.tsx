import { PersonStanding, Car, Train } from "lucide-react";
import { useTravelTime } from "@/hooks/useTravelTime";
import { useUserSettings } from "@/contexts/UserSettingsContext";

interface VenueCardProps {
  name: string;
  type: string;
  imageUrl: string;
  matchPercent?: number;
  onClick?: () => void;
  selectedCity?: string;
}

const VenueCard = ({ name, type, imageUrl, matchPercent, onClick, selectedCity }: VenueCardProps) => {
  const { userLocation } = useUserSettings();
  const travelTime = useTravelTime(name);

  // Only show travel time if selected city matches user's current city
  const isUserCity = selectedCity && userLocation?.city === selectedCity;
  const showTravelTime = isUserCity && travelTime;

  const TravelIcon = travelTime ? {
    walking: PersonStanding,
    car: Car,
    train: Train,
  }[travelTime.icon] : null;

  return (
    <div 
      className="flex-shrink-0 w-40 cursor-pointer animate-scale-in"
      onClick={onClick}
    >
      <div className="relative rounded-xl overflow-hidden bg-card shadow-md">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-32 object-cover"
        />
        
        {matchPercent !== undefined && (
          <div className="absolute top-2 right-2 match-badge text-[10px] py-0.5 px-1.5">
            {matchPercent}%
            <span className="block text-[8px]">Vibe</span>
          </div>
        )}
      </div>
      
      <div className="mt-2">
        <h4 className="font-semibold text-sm text-foreground truncate">{name}</h4>
        <p className="text-xs text-muted-foreground truncate">{type}</p>
        {showTravelTime && TravelIcon && (
          <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
            <TravelIcon size={12} />
            {travelTime.minutes} min away
          </p>
        )}
      </div>
    </div>
  );
};

export default VenueCard;
