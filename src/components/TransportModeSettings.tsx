import { Car, PersonStanding, Train, Wand2 } from "lucide-react";
import { useUserSettings, TransportMode } from "@/contexts/UserSettingsContext";
import { cn } from "@/lib/utils";

const transportOptions: { value: TransportMode; label: string; icon: React.ReactNode }[] = [
  { value: "walking", label: "Walking", icon: <PersonStanding size={20} /> },
  { value: "driving", label: "Driving", icon: <Car size={20} /> },
  { value: "transit", label: "Public Transport", icon: <Train size={20} /> },
  { value: "auto", label: "Auto", icon: <Wand2 size={20} /> },
];

const TransportModeSettings = () => {
  const { transportMode, setTransportMode } = useUserSettings();

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select how you typically travel to events
      </p>
      <div className="grid grid-cols-2 gap-2">
        {transportOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setTransportMode(option.value)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all",
              transportMode === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/50"
            )}
          >
            {option.icon}
            <span className="font-medium text-sm">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TransportModeSettings;
