import { Users, UserPlus, Check, Clock } from "lucide-react";
import { useConnections } from "@/hooks/useConnections";
import ProfileAvatar from "./ProfileAvatar";

const ConnectedPeopleSection = () => {
  const { interestedUsers, loading, sendConnectionRequest } = useConnections();

  const getStatusButton = (
    user: typeof interestedUsers[0],
    onConnect: () => void
  ) => {
    if (user.isConnected) {
      return (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
          <Check size={14} />
          Connected
        </div>
      );
    }

    if (user.connectionStatus === "pending") {
      return (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">
          <Clock size={14} />
          Pending
        </div>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onConnect();
        }}
        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:bg-primary/90 transition-colors"
      >
        <UserPlus size={14} />
        Connect
      </button>
    );
  };

  if (loading) {
    return (
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Users size={20} className="text-primary" />
          <h3 className="text-lg font-bold text-foreground">Connected People</h3>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  // Group users by event
  const usersByEvent = interestedUsers.reduce((acc, user) => {
    const eventId = user.gig?.id || "unknown";
    if (!acc[eventId]) {
      acc[eventId] = {
        gig: user.gig,
        users: [],
      };
    }
    acc[eventId].users.push(user);
    return acc;
  }, {} as Record<string, { gig: typeof interestedUsers[0]["gig"]; users: typeof interestedUsers }>);

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Users size={20} className="text-primary" />
        <h3 className="text-lg font-bold text-foreground">Connected People</h3>
      </div>

      {Object.keys(usersByEvent).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(usersByEvent).map(([eventId, { gig, users }]) => (
            <div key={eventId} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Event Header */}
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <p className="font-medium text-foreground">{gig?.artist_name || "Event"}</p>
                <p className="text-xs text-muted-foreground">{gig?.venue_name}</p>
              </div>

              {/* Users interested in this event */}
              <div className="divide-y divide-border">
                {users.map((user) => (
                  <div
                    key={`${user.user_id}-${eventId}`}
                    className="flex items-center gap-3 p-3"
                  >
                    <ProfileAvatar size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {user.profile?.full_name || "Anonymous User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Also interested in this event
                      </p>
                    </div>
                    {getStatusButton(user, () =>
                      sendConnectionRequest(user.user_id, gig?.id || "")
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <Users size={40} className="mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">No matching users yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add events to your wish list to find people with similar interests
          </p>
        </div>
      )}
    </section>
  );
};

export default ConnectedPeopleSection;
