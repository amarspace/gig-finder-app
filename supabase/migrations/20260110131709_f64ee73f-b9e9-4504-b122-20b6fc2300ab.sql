-- Create wishlist table for saving events
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, gig_id)
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlists
CREATE POLICY "Users can view own wishlist" 
ON public.wishlists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist" 
ON public.wishlists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own wishlist" 
ON public.wishlists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create connections table for connecting with people interested in same events
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, target_id, gig_id)
);

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connections
CREATE POLICY "Users can view own connections" 
ON public.connections 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can create connection requests" 
ON public.connections 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own connection requests" 
ON public.connections 
FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can delete own connection requests" 
ON public.connections 
FOR DELETE 
USING (auth.uid() = requester_id);

-- Add trigger for updated_at
CREATE TRIGGER update_connections_updated_at
BEFORE UPDATE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlists_gig_id ON public.wishlists(gig_id);
CREATE INDEX idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX idx_connections_target_id ON public.connections(target_id);
CREATE INDEX idx_connections_gig_id ON public.connections(gig_id);