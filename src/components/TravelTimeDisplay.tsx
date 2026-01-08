import { PersonStanding, Car, Train } from "lucide-react";
import { useTravelTime } from "@/hooks/useTravelTime";

interface TravelTimeDisplayProps {
  venueName: string;
  date: string;
}

const TravelTimeDisplay = ({ venueName, date }: TravelTimeDisplayProps) => {
  const travelTime = useTravelTime(venueName);

  if (!travelTime) {
    return <span>{date}</span>;
  }

  const IconComponent = {
    walking: PersonStanding,
    car: Car,
    train: Train,
  }[travelTime.icon];

  return (
    <span className="flex items-center gap-1">
      {date} • <IconComponent size={14} className="inline" /> {travelTime.minutes} min away
    </span>
  );
};

export default TravelTimeDisplay;
