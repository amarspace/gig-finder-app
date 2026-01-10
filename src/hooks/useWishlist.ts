import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface WishlistItem {
  id: string;
  gig_id: string;
  created_at: string;
  gig: {
    id: string;
    artist_name: string;
    venue_name: string;
    event_date: string;
    genre: string;
    image_url: string | null;
  };
}

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setWishlistIds(new Set());
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("wishlists")
      .select(`
        id,
        gig_id,
        created_at,
        gig:gigs (
          id,
          artist_name,
          venue_name,
          event_date,
          genre,
          image_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Filter out null gigs and type-cast properly
      const validItems = data.filter((item): item is WishlistItem => item.gig !== null);
      setWishlist(validItems);
      setWishlistIds(new Set(validItems.map((item) => item.gig_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (gigId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to save events to your wish list",
        variant: "destructive",
      });
      return false;
    }

    const { error } = await supabase.from("wishlists").insert({
      user_id: user.id,
      gig_id: gigId,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already in wish list",
          description: "This event is already saved",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add to wish list",
          variant: "destructive",
        });
      }
      return false;
    }

    toast({
      title: "Added to Wish List",
      description: "Event saved to your wish list",
    });
    await fetchWishlist();
    return true;
  };

  const removeFromWishlist = async (gigId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("gig_id", gigId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove from wish list",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Removed from Wish List",
      description: "Event removed from your wish list",
    });
    await fetchWishlist();
    return true;
  };

  const toggleWishlist = async (gigId: string) => {
    if (wishlistIds.has(gigId)) {
      return removeFromWishlist(gigId);
    }
    return addToWishlist(gigId);
  };

  const isInWishlist = (gigId: string) => wishlistIds.has(gigId);

  return {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    refreshWishlist: fetchWishlist,
  };
};
