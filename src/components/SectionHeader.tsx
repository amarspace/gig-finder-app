import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SectionHeaderProps {
  title: string;
  sectionKey: string;
  rightContent?: React.ReactNode;
  city?: string;
}

const SectionHeader = ({ title, sectionKey, rightContent, city }: SectionHeaderProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const params = city ? `?city=${city}` : "";
    navigate(`/section/${sectionKey}${params}`);
  };

  return (
    <div className="flex items-center justify-between px-5 mb-3">
      <button
        onClick={handleClick}
        className="flex items-center gap-1 group"
      >
        <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h2>
        <ChevronRight
          size={20}
          className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all"
        />
      </button>
      {rightContent}
    </div>
  );
};

export default SectionHeader;
