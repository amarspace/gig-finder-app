-- Create gigs table
CREATE TABLE public.gigs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  genre TEXT NOT NULL,
  image_url TEXT,
  match_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (gigs should be visible to everyone)
CREATE POLICY "Gigs are publicly readable"
ON public.gigs
FOR SELECT
USING (true);

-- Insert sample data
INSERT INTO public.gigs (artist_name, venue_name, event_date, genre, image_url, match_percentage) VALUES
('KOLA', 'Stereo Plaza, Kyiv', '2026-02-14 20:00:00+02', 'Pop', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', 94),
('DOROFEEVA', 'Palace Ukraine, Kyiv', '2026-02-20 19:00:00+02', 'Pop/Dance', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80', 87),
('Artem Pivovarov', 'Atlas Club, Kyiv', '2026-03-05 21:00:00+02', 'Indie Pop', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80', 82),
('Kazka', 'Bel Etage, Kyiv', '2026-03-12 20:00:00+02', 'Folk Pop', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80', 78),
('Monatik', 'Olympic Stadium, Kyiv', '2026-04-01 19:30:00+03', 'R&B/Pop', 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80', 91);