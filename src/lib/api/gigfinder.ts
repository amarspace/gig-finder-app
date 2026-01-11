import { supabase } from '@/integrations/supabase/client';

export interface PlaylistAnalysis {
  artists: string[];
  genres: string[];
  keywords: string[];
  tags?: string[];
  moods?: string[];
  source: 'spotify' | 'apple_music' | 'youtube_music' | 'unknown';
}

export interface LocalVibePost {
  id: string;
  image_url: string;
  caption: string;
  venue_name: string;
  venue_type: string;
  city: string;
  tags: string[];
  timestamp: string;
}

export interface ScrapedEvent {
  artist_name: string;
  event_title: string;
  venue_name: string;
  city: string;
  event_date: string;
  genre: string;
  source_url: string;
  source: string;
  image_url?: string;
  tags?: string[];
}

export interface ArtistEnrichment {
  tags: string[];
  genres: string[];
  links: {
    instagram?: string;
    youtube?: string;
    spotify?: string;
    website?: string;
  };
  description?: string;
}

// Vibe category mapping for sophisticated matching
const vibeMap: Record<string, string[]> = {
  'Yacht Rock': ['soft rock', 'smooth', 'sophisti-pop', 'aor', 'indie-safari', 'funk', 'adult contemporary'],
  'Rap': ['hip-hop', 'trap', 'boom bap', 'drill', 'phonk', 'grime', 'hip hop'],
  'Rock': ['classic rock', 'hard rock', 'grunge', 'blues rock', 'stoner rock', 'alternative rock'],
  'Electronic': ['techno', 'house', 'deep house', 'synth-pop', 'minimal', 'edm', 'electronica'],
  'Acoustic': ['folk', 'singer-songwriter', 'unplugged', 'indie folk', 'acoustic'],
  'Metal': ['heavy metal', 'thrash', 'symphonic metal', 'nu-metal', 'metalcore'],
  'Pop': ['dance pop', 'synth pop', 'art pop', 'indie pop', 'k-pop'],
  'Indie': ['indie rock', 'indie pop', 'lo-fi', 'dream pop', 'shoegaze'],
  'Ukrainian': ['ukrainian', 'ukraine', 'ukrainian folk', 'ukrainian rock', 'ukrainian pop'],
  'Jazz': ['jazz', 'jazz-pop', 'smooth jazz', 'bebop', 'cool jazz'],
  'Folk': ['folk', 'folk rock', 'traditional', 'world music', 'celtic'],
};

// Parse playlist URL and extract taste profile using MusicBrainz/Last.fm
export async function parsePlaylist(url: string): Promise<{ success: boolean; analysis?: PlaylistAnalysis; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-playlist-dna', {
      body: { url }
    });

    if (error) {
      console.error('Error parsing playlist:', error);
      // Fall back to basic parser
      return await parsePlaylistBasic(url);
    }

    return data;
  } catch (err) {
    console.error('Failed to parse playlist:', err);
    return await parsePlaylistBasic(url);
  }
}

// Basic playlist parser (fallback)
async function parsePlaylistBasic(url: string): Promise<{ success: boolean; analysis?: PlaylistAnalysis; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('parse-playlist', {
      body: { url }
    });

    if (error) {
      console.error('Error parsing playlist:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('Failed to parse playlist:', err);
    return { success: false, error: 'Failed to analyze playlist' };
  }
}

// Fetch local vibe posts from Instagram-style data
export async function fetchLocalVibes(city?: string): Promise<{ success: boolean; posts?: LocalVibePost[]; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-instagram', {
      body: { city }
    });

    if (error) {
      console.error('Error fetching local vibes:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('Failed to fetch local vibes:', err);
    return { success: false, error: 'Failed to fetch local vibes' };
  }
}

// Fetch global events from aggregated sources
export async function fetchGlobalEvents(location?: string, artists?: string[]): Promise<{ success: boolean; events?: ScrapedEvent[]; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-global-events', {
      body: { location, artists }
    });

    if (error) {
      console.error('Error fetching global events:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('Failed to fetch global events:', err);
    return { success: false, error: 'Failed to fetch events' };
  }
}

// Scrape events from Ukrainian ticket platforms
export async function scrapeEvents(): Promise<{ success: boolean; events?: ScrapedEvent[]; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-events', {
      body: {}
    });

    if (error) {
      console.error('Error scraping events:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('Failed to scrape events:', err);
    return { success: false, error: 'Failed to scrape events' };
  }
}

// Enrich artist with MusicBrainz/Last.fm data
export async function enrichArtist(artistName: string): Promise<{ success: boolean; enrichment?: ArtistEnrichment; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('enrich-artist', {
      body: { artistName }
    });

    if (error) {
      console.error('Error enriching artist:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('Failed to enrich artist:', err);
    return { success: false, error: 'Failed to fetch artist data' };
  }
}

/**
 * Calculate match score using vibe-to-vibe mapping
 * This implements the sophisticated matching algorithm that ensures:
 * - "Yacht Rock" fans get smooth/sophisticated artists, not generic pop
 * - Opposite vibes get penalized (e.g., Acoustic fans don't want Electronic)
 * - Direct genre overlap gets bonus points
 */
export function calculateMatchScore(
  playlistTags: string[],
  eventTags: string[]
): number {
  const weights = { genre: 0.6, artist: 0.3, mood: 0.1 };
  let score = 0;

  const playlistTagsLower = playlistTags.map(t => t.toLowerCase());
  const eventTagsLower = eventTags.map(t => t.toLowerCase());

  // Logic 1: Vibe-to-Vibe Mapping
  // Check if playlist matches sophisticated vibes
  const smoothVibes = vibeMap['Yacht Rock'];
  const isSmoothPlaylist = playlistTagsLower.some(tag => 
    smoothVibes.some(v => tag.includes(v) || v.includes(tag))
  );
  const isSmoothEvent = eventTagsLower.some(tag => 
    ['smooth', 'jazz-pop', 'indie-safari', 'sophisti-pop', 'soft rock'].some(v => 
      tag.includes(v) || v.includes(tag)
    )
  );

  if (isSmoothPlaylist && isSmoothEvent) {
    score += weights.genre * 100;
  }

  // Check other vibe categories
  for (const [vibeCategory, vibeTerms] of Object.entries(vibeMap)) {
    const playlistHasVibe = playlistTagsLower.some(tag =>
      vibeTerms.some(term => tag.includes(term) || term.includes(tag))
    );
    const eventHasVibe = eventTagsLower.some(tag =>
      vibeTerms.some(term => tag.includes(term) || term.includes(tag))
    );

    if (playlistHasVibe && eventHasVibe) {
      score += weights.genre * 80;
      break; // Only count best match
    }
  }

  // Logic 2: Strict Filtering (Opposite Vibe Penalty)
  const electronicTerms = vibeMap['Electronic'];
  const isAcousticPlaylist = playlistTagsLower.some(tag =>
    vibeMap['Acoustic'].some(term => tag.includes(term) || term.includes(tag))
  );
  const isElectronicEvent = eventTagsLower.some(tag =>
    electronicTerms.some(term => tag.includes(term) || term.includes(tag))
  );

  if (isAcousticPlaylist && isElectronicEvent) {
    score -= 50;
  }

  // Metal penalty for soft rock fans
  const isMetalEvent = eventTagsLower.some(tag =>
    vibeMap['Metal'].some(term => tag.includes(term) || term.includes(tag))
  );
  if (isSmoothPlaylist && isMetalEvent) {
    score -= 40;
  }

  // Logic 3: Direct Genre/Tag Match
  const overlap = playlistTagsLower.filter(t => 
    eventTagsLower.some(e => e.includes(t) || t.includes(e))
  ).length;
  score += (overlap / Math.max(playlistTagsLower.length, 1)) * 20;

  // Add small randomness for natural feel (1-5%)
  const jitter = Math.random() * 5;

  return Math.min(Math.max(Math.round(score + jitter), 0), 98);
}

/**
 * Enhanced match percent calculation with vibe matching
 * Returns: High Match (85-98%), Mid Match (60-84%), Low Match (<60%) or "New for You"
 */
export function calculateMatchPercent(
  eventGenre: string,
  eventArtist: string,
  userAnalysis: PlaylistAnalysis | null,
  eventTags?: string[]
): { percent: number; state: 'matched' | 'unmatched' | 'unknown'; isNewForYou: boolean } {
  // No playlist imported - return random vibe % (fallback for guests without import)
  if (!userAnalysis) {
    const vibePercent = Math.floor(Math.random() * 16) + 80; // 80-95%
    return { percent: vibePercent, state: 'unknown', isNewForYou: false };
  }

  const eventGenreLower = eventGenre.toLowerCase();
  const eventArtistLower = eventArtist.toLowerCase();

  // Check for exact artist match (highest priority)
  const exactArtistMatch = userAnalysis.artists.some(
    artist => artist.toLowerCase() === eventArtistLower ||
              eventArtistLower.includes(artist.toLowerCase()) ||
              artist.toLowerCase().includes(eventArtistLower)
  );

  if (exactArtistMatch) {
    // Artist match: 92-98% (Highest Match)
    const percent = Math.floor(Math.random() * 7) + 92;
    return { percent, state: 'matched', isNewForYou: false };
  }

  // Build playlist tags from analysis
  const playlistTags = [
    ...userAnalysis.genres,
    ...(userAnalysis.keywords || []),
    ...(userAnalysis.tags || []),
    ...(userAnalysis.moods || []),
  ].filter(Boolean);

  // Build event tags
  const combinedEventTags = [
    eventGenre,
    ...(eventTags || []),
  ].filter(Boolean);

  // Use sophisticated vibe matching if we have tags
  if (playlistTags.length > 0 && combinedEventTags.length > 0) {
    const vibeScore = calculateMatchScore(playlistTags, combinedEventTags);

    if (vibeScore >= 50) {
      // High match (85-98%)
      const percent = Math.min(98, Math.floor(vibeScore * 0.98) + Math.floor(Math.random() * 10));
      return { 
        percent: Math.max(85, percent), 
        state: 'matched', 
        isNewForYou: false 
      };
    } else if (vibeScore >= 20) {
      // Mid match (60-84%)
      const percent = Math.floor(vibeScore * 0.8) + 60 + Math.floor(Math.random() * 5);
      return { 
        percent: Math.min(84, percent), 
        state: 'matched', 
        isNewForYou: false 
      };
    } else if (vibeScore < 0) {
      // Negative score (opposite vibe) - show as "New for You"
      return { 
        percent: Math.floor(Math.random() * 20) + 10, 
        state: 'unmatched', 
        isNewForYou: true 
      };
    }
  }

  // Fallback: Check for basic genre matching
  const topGenre = userAnalysis.genres[0]?.toLowerCase() || '';
  const isTopGenreMatch = topGenre && (
    eventGenreLower.includes(topGenre) || 
    topGenre.includes(eventGenreLower)
  );

  if (isTopGenreMatch) {
    const percent = Math.floor(Math.random() * 14) + 85;
    return { percent, state: 'matched', isNewForYou: false };
  }

  // Check for secondary genre match
  const secondaryGenreMatch = userAnalysis.genres.slice(1).some(
    genre => eventGenreLower.includes(genre.toLowerCase()) ||
             genre.toLowerCase().includes(eventGenreLower)
  );

  if (secondaryGenreMatch) {
    const percent = Math.floor(Math.random() * 25) + 60;
    return { percent, state: 'matched', isNewForYou: false };
  }

  // Similar genre mapping for fallback
  const genreSimilarity: Record<string, string[]> = {
    'pop': ['indie', 'dance', 'electronic', 'r&b'],
    'rock': ['indie', 'alternative', 'metal', 'punk'],
    'indie': ['alternative', 'folk', 'rock', 'pop'],
    'electronic': ['techno', 'house', 'edm', 'dance'],
    'hip-hop': ['rap', 'r&b', 'urban'],
    'folk': ['acoustic', 'singer-songwriter', 'indie'],
    'jazz': ['blues', 'soul', 'r&b'],
    'classical': ['orchestral', 'opera', 'instrumental'],
  };

  const hasSimilarGenre = userAnalysis.genres.some(userGenre => {
    const similar = genreSimilarity[userGenre.toLowerCase()] || [];
    return similar.some(s => eventGenreLower.includes(s));
  });

  if (hasSimilarGenre) {
    const percent = Math.floor(Math.random() * 20) + 60;
    return { percent, state: 'unmatched', isNewForYou: false };
  }

  // No overlap: "New for You"
  return { 
    percent: Math.floor(Math.random() * 25) + 15, 
    state: 'unmatched',
    isNewForYou: true
  };
}

/**
 * Generate safe social media URLs for an artist
 * Uses Google search handoff to bypass ERR_BLOCKED_BY_RESPONSE errors
 * from direct Instagram tag/explore URLs
 */
export function generateSocialLinks(artistName: string) {
  const encodedArtist = encodeURIComponent(artistName);

  return {
    // Use YouTube search which is reliable and not blocked
    youtube: `https://www.youtube.com/results?search_query=${encodedArtist}+official+music`,
    // Use Google search handoff to find verified Instagram profile
    instagram: `https://www.google.com/search?q=${encodedArtist}+official+instagram`,
  };
}

/**
 * Safely open a social link in a new tab
 * Uses window.open with proper security parameters to avoid blocking
 */
export function openSocialLink(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Get user's location using Geolocation API
export function getUserLocation(): Promise<{ latitude: number; longitude: number; city?: string } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to reverse geocode to get city name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village;
          
          resolve({ latitude, longitude, city });
        } catch {
          resolve({ latitude, longitude });
        }
      },
      () => {
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
}