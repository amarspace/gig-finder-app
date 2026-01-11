-- Add artist enrichment fields to gigs table
ALTER TABLE public.gigs
ADD COLUMN tags TEXT[] DEFAULT '{}',
ADD COLUMN musicbrainz_genres TEXT[] DEFAULT '{}',
ADD COLUMN instagram_url TEXT,
ADD COLUMN youtube_url TEXT,
ADD COLUMN spotify_url TEXT,
ADD COLUMN website_url TEXT,
ADD COLUMN artist_description TEXT;

-- Add index for faster tag/genre matching
CREATE INDEX idx_gigs_tags ON public.gigs USING GIN(tags);
CREATE INDEX idx_gigs_musicbrainz_genres ON public.gigs USING GIN(musicbrainz_genres);

-- Add comment for documentation
COMMENT ON COLUMN public.gigs.tags IS 'Artist tags from MusicBrainz for genre matching';
COMMENT ON COLUMN public.gigs.musicbrainz_genres IS 'Artist genres from MusicBrainz for genre matching';
COMMENT ON COLUMN public.gigs.instagram_url IS 'Direct Instagram profile URL from MusicBrainz';
COMMENT ON COLUMN public.gigs.youtube_url IS 'Direct YouTube channel URL from MusicBrainz';
COMMENT ON COLUMN public.gigs.spotify_url IS 'Spotify artist URL from MusicBrainz';
COMMENT ON COLUMN public.gigs.website_url IS 'Official website URL from MusicBrainz';
COMMENT ON COLUMN public.gigs.artist_description IS 'Artist bio/description from MusicBrainz';
