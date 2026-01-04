import GigHeader from "./GigHeader";
import { Button } from "./ui/button";

interface ProfileGuestScreenProps {
  onLogin: () => void;
}

const ProfileGuestScreen = ({ onLogin }: ProfileGuestScreenProps) => {
  return (
    <div className="min-h-screen pb-24 px-5 animate-fade-in">
      <div className="pt-12">
        <GigHeader />
      </div>

      <div className="mt-12 space-y-6">
        <Button
          onClick={onLogin}
          variant="outline"
          className="w-full py-6 text-lg font-semibold border-2 border-purple-border text-secondary-foreground hover:bg-secondary/50 rounded-2xl"
        >
          Log in to Personalize
        </Button>

        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Why Log In?</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
              Save favorite artists
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
              Get personalized recommendations
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
              Sync your playlists
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileGuestScreen;
