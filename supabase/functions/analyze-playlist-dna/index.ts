import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaylistAnalysis {
  artists: string[];
  genres: string[];
  keywords: string[];
  tags: string[];
  moods: string[];
  source: 'spotify' | 'apple_music' | 'youtube_music' | 'unknown';
}

interface MusicBrainzArtist {
  id: string;
  name: string;
  tags?: { name: string; count: number }[];
  genres?: string[];
}

interface LastFmTag {
  name: string;
  count: number;
}

// Fetch artist metadata from MusicBrainz
async function fetchMusicBrainzArtist(artistName: string): Promise<{ tags: string[]; genres: string[] }> {
  try {
    const searchUrl = `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artistName)}&fmt=json&limit=1`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'GIGFINDER/1.0 (contact@gigfinder.app)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`MusicBrainz search failed for ${artistName}: ${response.status}`);
      return { tags: [], genres: [] };
    }

    const data = await response.json();
    const artist = data.artists?.[0];

    if (!artist) {
      return { tags: [], genres: [] };
    }

    // Fetch full artist data with tags
    const artistUrl = `https://musicbrainz.org/ws/2/artist/${artist.id}?inc=tags+genres&fmt=json`;
    
    // Wait to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const artistResponse = await fetch(artistUrl, {
      headers: {
        'User-Agent': 'GIGFINDER/1.0 (contact@gigfinder.app)',
        'Accept': 'application/json',
      },
    });

    if (!artistResponse.ok) {
      return { tags: [], genres: [] };
    }

    const artistData: MusicBrainzArtist = await artistResponse.json();
    
    const tags = artistData.tags?.filter(t => t.count > 0).map(t => t.name) || [];
    const genres = artistData.genres || [];

    return { tags, genres };
  } catch (error) {
    console.error(`Error fetching MusicBrainz data for ${artistName}:`, error);
    return { tags: [], genres: [] };
  }
}

// Fetch artist tags from Last.fm (fallback/supplement)
async function fetchLastFmTags(artistName: string): Promise<string[]> {
  const LASTFM_API_KEY = Deno.env.get('LASTFM_API_KEY');
  
  // If no API key, return empty array (will use mock data)
  if (!LASTFM_API_KEY) {
    console.log('Last.fm API key not configured, using fallback');
    return [];
  }

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`Last.fm failed for ${artistName}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (data.error) {
      return [];
    }

    const tags = data.toptags?.tag || [];
    return tags.slice(0, 10).map((t: LastFmTag) => t.name.toLowerCase());
  } catch (error) {
    console.error(`Error fetching Last.fm data for ${artistName}:`, error);
    return [];
  }
}

// Extract artists from playlist HTML
function extractArtistsFromHtml(html: string): string[] {
  const artistPatterns = [
    /"artist[_\-]?name":\s*"([^"]+)"/gi,
    /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i,
    /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
    /"name":\s*"([^"]+)"/gi,
  ];

  const artists: Set<string> = new Set();
  
  for (const pattern of artistPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2 && match[1].length < 50) {
        artists.add(match[1]);
      }
    }
  }

  // Known Ukrainian artists for fallback
  const ukrainianArtists = [
    'MONATIK', 'Океан Ельзи', 'The Hardkiss', 'Jamala', 'Kalush', 'Go_A',
    'Kazka', 'Бумбокс', 'Скрябін', 'Без Обмежень', 'Latexfauna', 'Один в каное',
    'Dakha Brakha', 'Onuka', 'Pianoboy', 'Сергій Бабкін', 'Alyona Alyona',
    'TNMK', 'Noize MC', 'ВРЕМЯ И СТЕКЛО'
  ];

  // Check if any known artists appear in HTML
  for (const artist of ukrainianArtists) {
    if (html.toLowerCase().includes(artist.toLowerCase())) {
      artists.add(artist);
    }
  }

  return Array.from(artists).slice(0, 10);
}

// Detect platform from URL
function detectPlatform(url: string): PlaylistAnalysis['source'] {
  if (url.includes('spotify')) return 'spotify';
  if (url.includes('apple.com') || url.includes('music.apple')) return 'apple_music';
  if (url.includes('youtube') || url.includes('music.youtube')) return 'youtube_music';
  return 'unknown';
}

// Map raw tags to vibe categories
function categorizeVibes(tags: string[]): { genres: string[]; moods: string[]; keywords: string[] } {
  const vibeCategories: Record<string, string[]> = {
    'Yacht Rock': ['soft rock', 'smooth', 'sophisti-pop', 'aor', 'adult contemporary', 'indie-safari', 'funk'],
    'Rap': ['hip-hop', 'trap', 'boom bap', 'drill', 'phonk', 'grime', 'hip hop'],
    'Rock': ['classic rock', 'hard rock', 'grunge', 'blues rock', 'stoner rock', 'alternative rock'],
    'Electronic': ['techno', 'house', 'deep house', 'synth-pop', 'minimal', 'edm', 'electronica'],
    'Acoustic': ['folk', 'singer-songwriter', 'unplugged', 'indie folk', 'acoustic'],
    'Metal': ['heavy metal', 'thrash', 'symphonic metal', 'nu-metal', 'metalcore'],
    'Pop': ['dance pop', 'synth pop', 'art pop', 'indie pop', 'k-pop', 'ukrainian pop'],
    'Indie': ['indie rock', 'indie pop', 'lo-fi', 'dream pop', 'shoegaze'],
    'Ukrainian': ['ukrainian', 'ukraine', 'ukrainian folk', 'ukrainian rock', 'ukrainian pop'],
  };

  const moodKeywords = [
    'chill', 'energetic', 'melancholic', 'upbeat', 'dark', 'bright', 'smooth',
    'aggressive', 'mellow', 'romantic', 'party', 'relaxing', 'intense', 'dreamy'
  ];

  const genres: Set<string> = new Set();
  const moods: Set<string> = new Set();
  const keywords: Set<string> = new Set();

  const tagsLower = tags.map(t => t.toLowerCase());

  for (const [vibeCategory, vibeTerms] of Object.entries(vibeCategories)) {
    for (const tag of tagsLower) {
      if (vibeTerms.some(term => tag.includes(term) || term.includes(tag))) {
        genres.add(vibeCategory);
      }
    }
  }

  for (const tag of tagsLower) {
    for (const mood of moodKeywords) {
      if (tag.includes(mood)) {
        moods.add(mood);
      }
    }
    // Add remaining as keywords
    keywords.add(tag);
  }

  return {
    genres: Array.from(genres),
    moods: Array.from(moods),
    keywords: Array.from(keywords).slice(0, 15),
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, artists: providedArtists } = await req.json();

    if (!url && !providedArtists) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL or artists list required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing playlist DNA:', url);

    const source = url ? detectPlatform(url) : 'unknown';
    let artists: string[] = providedArtists || [];

    // Try to fetch and parse playlist HTML if URL provided
    if (url && artists.length === 0) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        if (response.ok) {
          const html = await response.text();
          artists = extractArtistsFromHtml(html);
        }
      } catch (e) {
        console.log('Failed to fetch playlist HTML:', e);
      }
    }

    // If we still don't have artists, return error - no mock data
    if (artists.length === 0) {
      console.log('No artists extracted from playlist');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unable to extract artists from playlist. Please try a different playlist URL or check that the playlist is public.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect tags from MusicBrainz and Last.fm for each artist
    const allTags: string[] = [];
    const allGenres: string[] = [];

    // Only analyze first 5 artists to avoid rate limits
    const artistsToAnalyze = artists.slice(0, 5);
    
    for (const artist of artistsToAnalyze) {
      console.log(`Analyzing artist: ${artist}`);
      
      // Fetch from MusicBrainz
      const mbData = await fetchMusicBrainzArtist(artist);
      allTags.push(...mbData.tags);
      allGenres.push(...mbData.genres);

      // Fetch from Last.fm as fallback
      const lfmTags = await fetchLastFmTags(artist);
      allTags.push(...lfmTags);

      // Small delay between artists
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Categorize the collected tags
    const { genres, moods, keywords } = categorizeVibes(allTags);

    // Merge with any genres from MusicBrainz
    const finalGenres = [...new Set([...genres, ...allGenres.map(g => g.charAt(0).toUpperCase() + g.slice(1))])];

    const analysis: PlaylistAnalysis = {
      artists,
      genres: finalGenres.length > 0 ? finalGenres : ['Pop', 'Rock'], // Default fallback
      keywords: keywords.length > 0 ? keywords : allTags.slice(0, 10),
      tags: allTags,
      moods: moods.length > 0 ? moods : ['energetic'],
      source,
    };

    console.log('Playlist DNA analysis complete:', JSON.stringify(analysis, null, 2));

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing playlist DNA:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});