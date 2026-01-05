import { Chrome } from "lucide-react";
import GigHeader from "./GigHeader";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileGuestScreenProps {
  onLogin: () => void;
}

const ProfileGuestScreen = ({ onLogin }: ProfileGuestScreenProps) => {
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen pb-24 px-5 animate-fade-in">
      <div className="pt-12">
        <GigHeader />
      </div>

      <div className="mt-12 space-y-6">
        {/* Google Sign In Button - Primary CTA */}
        <Button
          onClick={handleGoogleSignIn}
          className="w-full py-6 text-lg font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-2xl flex items-center justify-center gap-3"
        >
          <Chrome size={24} />
          Continue with Google
        </Button>

        {/* Email Sign In - Secondary */}
        <Button
          onClick={onLogin}
          variant="outline"
          className="w-full py-6 text-lg font-semibold border-2 border-border text-foreground hover:bg-muted rounded-2xl"
        >
          Sign in with Email
        </Button>

        <div className="space-y-3 mt-8">
          <h2 className="text-xl font-bold text-foreground">Why Log In?</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Save favorite artists and venues
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Get personalized recommendations
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Sync your YouTube Music playlists
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Discover local venues matching your vibe
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileGuestScreen;
