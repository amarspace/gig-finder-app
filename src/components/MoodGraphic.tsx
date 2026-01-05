import { Music, Radio, Headphones } from "lucide-react";

const MoodGraphic = () => {
  return (
    <div className="relative flex items-center justify-center py-12">
      {/* Abstract circles */}
      <div className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 animate-pulse" />
      <div className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-secondary/30 to-primary/5" />
      <div className="absolute w-32 h-32 rounded-full bg-gradient-to-bl from-accent/15 to-transparent" />
      
      {/* Floating icons */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="absolute -left-16 -top-8 p-3 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "0s", animationDuration: "3s" }}>
          <Music size={24} className="text-secondary-foreground" />
        </div>
        <div className="absolute -right-12 top-4 p-3 rounded-full bg-accent/20 animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "3.5s" }}>
          <Radio size={20} className="text-accent" />
        </div>
        <div className="absolute left-4 bottom-0 p-3 rounded-full bg-primary/15 animate-bounce" style={{ animationDelay: "1s", animationDuration: "4s" }}>
          <Headphones size={22} className="text-primary" />
        </div>
        
        {/* Central element */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
          <Music size={36} className="text-primary-foreground" />
        </div>
      </div>
    </div>
  );
};

export default MoodGraphic;
