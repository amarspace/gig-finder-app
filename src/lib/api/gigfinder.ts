import { supabase } from '@/integrations/supabase/client';

export interface PlaylistAnalysis {
  artists: string[];
  genres: string[];
  keywords: string[];
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
}

// Parse playlist URL and extract taste profile
export async function parsePlaylist(url: string): Promise<{ success: boolean; analysis?: PlaylistAnalysis; error?: string }> {
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

// Calculate match percentage based on user's playlist analysis and event genre
// Returns: High Match (85-98%), Mid Match (60-84%), Low Match (<60%) or "New for You"
export function calculateMatchPercent(
  eventGenre: string,
  eventArtist: string,
  userAnalysis: PlaylistAnalysis | null
): { percent: number; state: 'matched' | 'unmatched' | 'unknown'; isNewForYou: boolean } {
  // No playlist imported - return random vibe % (fallback for guests without import)
  if (!userAnalysis) {
    const vibePercent = Math.floor(Math.random() * 16) + 80; // 80-95%
    return { percent: vibePercent, state: 'unknown', isNewForYou: false };
  }

  const eventGenreLower = eventGenre.toLowerCase();
  const eventArtistLower = eventArtist.toLowerCase();

  // Check for exact artist match
  const exactArtistMatch = userAnalysis.artists.some(
    artist => artist.toLowerCase() === eventArtistLower ||
              eventArtistLower.includes(artist.toLowerCase()) ||
              artist.toLowerCase().includes(eventArtistLower)
  );

  // Check if genre is TOP genre (first in list)
  const topGenre = userAnalysis.genres[0]?.toLowerCase() || '';
  const isTopGenreMatch = topGenre && (
    eventGenreLower.includes(topGenre) || 
    topGenre.includes(eventGenreLower)
  );

  // Check for secondary genre match
  const secondaryGenreMatch = userAnalysis.genres.slice(1).some(
    genre => eventGenreLower.includes(genre.toLowerCase()) ||
             genre.toLowerCase().includes(eventGenreLower)
  );

  // Similar genre mapping for secondary matches
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

  // Check for similar genre (related genres)
  const hasSimilarGenre = userAnalysis.genres.some(userGenre => {
    const similar = genreSimilarity[userGenre.toLowerCase()] || [];
    return similar.some(s => eventGenreLower.includes(s));
  });

  // Calculate final match
  let percent = 0;
  let state: 'matched' | 'unmatched' | 'unknown' = 'unmatched';

  if (exactArtistMatch) {
    // Artist match: 85-98% (High Match)
    percent = Math.floor(Math.random() * 14) + 85; // 85-98%
    state = 'matched';
  } else if (isTopGenreMatch) {
    // Top genre match: 85-98% (High Match)
    percent = Math.floor(Math.random() * 14) + 85; // 85-98%
    state = 'matched';
  } else if (secondaryGenreMatch) {
    // Secondary genre match: 60-84% (Mid Match)
    percent = Math.floor(Math.random() * 25) + 60; // 60-84%
    state = 'matched';
  } else if (hasSimilarGenre) {
    // Similar genre: 60-79% (Mid Match)
    percent = Math.floor(Math.random() * 20) + 60; // 60-79%
    state = 'unmatched';
  } else {
    // No overlap: "New for You" - return low percent
    percent = Math.floor(Math.random() * 25) + 15; // 15-39%
    state = 'unmatched';
  }

  // Add 1-5% jitter for precision feel (only for non-low matches)
  if (percent >= 60) {
    const jitter = Math.floor(Math.random() * 5) + 1;
    percent = Math.min(99, percent + jitter);
  }

  return { 
    percent, 
    state,
    isNewForYou: percent < 50
  };
}

// Generate social media URLs for an artist
export function generateSocialLinks(artistName: string) {
  const encodedArtist = encodeURIComponent(artistName);
  const tagName = artistName.replace(/\s+/g, '').toLowerCase();

  return {
    youtube: `https://www.youtube.com/results?search_query=${encodedArtist}+official+music`,
    instagram: `https://www.instagram.com/explore/tags/${tagName}`,
    website: `https://www.google.com/search?q=${encodedArtist}+official+website`,
  };
}
