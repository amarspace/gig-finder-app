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
export function calculateMatchPercent(
  eventGenre: string,
  eventArtist: string,
  userAnalysis: PlaylistAnalysis | null
): { percent: number; state: 'matched' | 'unmatched' | 'unknown' } {
  // No playlist imported - return random vibe %
  if (!userAnalysis) {
    const vibePercent = Math.floor(Math.random() * 16) + 80; // 80-95%
    return { percent: vibePercent, state: 'unknown' };
  }

  let basePercent = 0;
  let isMatch = false;

  // Check for artist match (+25%)
  const artistMatch = userAnalysis.artists.some(
    artist => artist.toLowerCase().includes(eventArtist.toLowerCase()) ||
              eventArtist.toLowerCase().includes(artist.toLowerCase())
  );
  if (artistMatch) {
    basePercent += 25;
    isMatch = true;
  }

  // Check for genre match (+60-70%)
  const genreMatch = userAnalysis.genres.some(
    genre => eventGenre.toLowerCase().includes(genre.toLowerCase()) ||
             genre.toLowerCase().includes(eventGenre.toLowerCase())
  );
  if (genreMatch) {
    basePercent += Math.floor(Math.random() * 11) + 60; // 60-70%
    isMatch = true;
  }

  // Check for keyword match (+5-10%)
  const keywordMatch = userAnalysis.keywords.some(
    keyword => eventGenre.toLowerCase().includes(keyword) ||
               eventArtist.toLowerCase().includes(keyword)
  );
  if (keywordMatch) {
    basePercent += Math.floor(Math.random() * 6) + 5; // 5-10%
  }

  // Add 1-5% jitter for precision feel
  const jitter = Math.floor(Math.random() * 5) + 1;
  
  // Cap at 99%
  const finalPercent = Math.min(99, basePercent + jitter);

  if (isMatch && finalPercent > 50) {
    return { percent: finalPercent, state: 'matched' };
  } else if (finalPercent > 0) {
    return { percent: Math.max(20, finalPercent), state: 'unmatched' };
  }

  // Fallback for no match
  return { percent: Math.floor(Math.random() * 20) + 15, state: 'unmatched' };
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
