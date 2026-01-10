import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

interface WishlistButtonProps {
  gigId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const WishlistButton = ({ gigId, size = "md", className = "" }: WishlistButtonProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(gigId);

  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleWishlist(gigId);
  };

  return (
    <button
      onClick={handleClick}
      className={`rounded-full transition-colors ${sizeClasses[size]} ${
        isWishlisted
          ? "bg-primary text-primary-foreground"
          : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:bg-background hover:text-primary"
      } ${className}`}
    >
      <Heart size={iconSizes[size]} fill={isWishlisted ? "currentColor" : "none"} />
    </button>
  );
};

export default WishlistButton;
