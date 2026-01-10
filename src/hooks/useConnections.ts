import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  full_name: string | null;
}

interface Gig {
  id: string;
  artist_name: string;
  venue_name: string;
  event_date: string;
}

interface Connection {
  id: string;
  requester_id: string;
  target_id: string;
  gig_id: string;
  status: string;
  created_at: string;
}

interface InterestedUser {
  user_id: string;
  profile: UserProfile | null;
  gig: Gig | null;
  isConnected: boolean;
  connectionStatus: string | null;
}

export const useConnections = () => {
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [myConnections, setMyConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInterestedUsers = useCallback(async () => {
    if (!user) {
      setInterestedUsers([]);
      setLoading(false);
      return;
    }

    // Get current user's wishlist gig IDs
    const { data: myWishlist } = await supabase
      .from("wishlists")
      .select("gig_id")
      .eq("user_id", user.id);

    if (!myWishlist?.length) {
      setInterestedUsers([]);
      setLoading(false);
      return;
    }

    const myGigIds = myWishlist.map((w) => w.gig_id);

    // Get other users interested in the same gigs
    const { data: otherWishlists } = await supabase
      .from("wishlists")
      .select(`
        user_id,
        gig_id,
        gig:gigs (
          id,
          artist_name,
          venue_name,
          event_date
        )
      `)
      .in("gig_id", myGigIds)
      .neq("user_id", user.id);

    // Get profiles for those users
    const userIds = [...new Set(otherWishlists?.map((w) => w.user_id) || [])];
    
    let profiles: UserProfile[] = [];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("user_profiles")
        .select("id, full_name")
        .in("id", userIds);
      profiles = profilesData || [];
    }

    // Get existing connections
    const { data: connections } = await supabase
      .from("connections")
      .select("*")
      .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`);

    setMyConnections(connections || []);

    // Build the interested users list
    const usersMap = new Map<string, InterestedUser>();
    
    otherWishlists?.forEach((wishlist) => {
      const key = `${wishlist.user_id}-${wishlist.gig_id}`;
      const profile = profiles.find((p) => p.id === wishlist.user_id) || null;
      
      const existingConnection = connections?.find(
        (c) =>
          ((c.requester_id === user.id && c.target_id === wishlist.user_id) ||
            (c.target_id === user.id && c.requester_id === wishlist.user_id)) &&
          c.gig_id === wishlist.gig_id
      );

      usersMap.set(key, {
        user_id: wishlist.user_id,
        profile,
        gig: wishlist.gig as Gig | null,
        isConnected: existingConnection?.status === "accepted",
        connectionStatus: existingConnection?.status || null,
      });
    });

    setInterestedUsers(Array.from(usersMap.values()));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInterestedUsers();
  }, [fetchInterestedUsers]);

  const sendConnectionRequest = async (targetUserId: string, gigId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to connect with others",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase.from("connections").insert({
      requester_id: user.id,
      target_id: targetUserId,
      gig_id: gigId,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already connected",
          description: "You have already sent a connection request",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send connection request",
          variant: "destructive",
        });
      }
      return false;
    }

    toast({
      title: "Request Sent",
      description: "Connection request sent successfully",
    });
    await fetchInterestedUsers();
    return true;
  };

  const acceptConnection = async (connectionId: string) => {
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connectionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept connection",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Connected!",
      description: "You are now connected",
    });
    await fetchInterestedUsers();
    return true;
  };

  return {
    interestedUsers,
    myConnections,
    loading,
    sendConnectionRequest,
    acceptConnection,
    refreshConnections: fetchInterestedUsers,
  };
};
