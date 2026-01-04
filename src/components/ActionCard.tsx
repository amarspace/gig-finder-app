import { ChevronRight, LucideIcon } from "lucide-react";

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant: "purple" | "orange";
  onClick?: () => void;
}

const ActionCard = ({ icon: Icon, title, description, variant, onClick }: ActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-5 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
        variant === "purple" ? "card-purple" : "card-orange"
      }`}
    >
      <div className={variant === "purple" ? "icon-purple" : "icon-orange"}>
        <Icon size={24} />
      </div>
      
      <div className="flex-1 text-left">
        <h3 className="font-semibold text-foreground text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <ChevronRight size={24} className="text-muted-foreground" />
    </button>
  );
};

export default ActionCard;
