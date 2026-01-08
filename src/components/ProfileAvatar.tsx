import { useUserSettings } from "@/contexts/UserSettingsContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackText?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const ProfileAvatar = ({ size = "md", className, fallbackText = "U" }: ProfileAvatarProps) => {
  const { profilePhoto } = useUserSettings();

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={profilePhoto} alt="Profile" className="object-cover" />
      <AvatarFallback>{fallbackText.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar;
