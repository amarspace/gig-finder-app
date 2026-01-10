import { useNavigate } from "react-router-dom";
import { Heart, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useWishlist } from "@/hooks/useWishlist";

const WishListSection = () => {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  if (loading) {
    return (
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={20} className="text-primary" />
          <h3 className="text-lg font-bold text-foreground">Wish List</h3>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Heart size={20} className="text-primary" />
        <h3 className="text-lg font-bold text-foreground">Wish List</h3>
      </div>
      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        {wishlist.length > 0 ? (
          wishlist.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/gig/${item.gig.id}`)}
            >
              <img
                src={item.gig.image_url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&q=80"}
                alt={item.gig.artist_name}
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{item.gig.artist_name}</p>
                <p className="text-sm text-muted-foreground truncate">{item.gig.venue_name}</p>
                <p className="text-xs text-primary font-medium">{formatDate(item.gig.event_date)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWishlist(item.gig_id);
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
              >
                <Heart size={18} fill="currentColor" />
              </button>
              <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <Heart size={40} className="mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">Your wish list is empty</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap the heart icon on events to save them here
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default WishListSection;
