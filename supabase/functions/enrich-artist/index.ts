import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtistEnrichment {
  tags: string[];
  genres: string[];
  links: {
    instagram?: string;
    youtube?: string;
    spotify?: string;
    website?: string;
  };
  description?: string;
  image_url?: string;
}

// Fetch artist data from MusicBrainz including URL relations
async function fetchMusicBrainzArtistFull(artistName: string): Promise<ArtistEnrichment | null> {
  try {
    // Search for artist
    const searchUrl = `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artistName)}&fmt=json&limit=1`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'GIGFINDER/1.0 (contact@gigfinder.app)',
        'Accept': 'application/json',
      },
    });

    if (!searchResponse.ok) {
      console.log(`MusicBrainz search failed for ${artistName}`);
      return null;
    }

    const searchData = await searchResponse.json();
    const artist = searchData.artists?.[0];

    if (!artist) {
      return null;
    }

    // Wait to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Fetch full artist data with tags and url-rels
    const artistUrl = `https://musicbrainz.org/ws/2/artist/${artist.id}?inc=tags+genres+url-rels&fmt=json`;
    
    const artistResponse = await fetch(artistUrl, {
      headers: {
        'User-Agent': 'GIGFINDER/1.0 (contact@gigfinder.app)',
        'Accept': 'application/json',
      },
    });

    if (!artistResponse.ok) {
      return null;
    }

    const artistData = await artistResponse.json();
    
    // Extract tags and genres
    const tags = artistData.tags?.filter((t: any) => t.count > 0).map((t: any) => t.name) || [];
    const genres = artistData.genres || [];

    // Extract URL relations
    const relations = artistData.relations || [];
    const links: ArtistEnrichment['links'] = {};

    for (const rel of relations) {
      if (rel.type === 'social network' || rel.type === 'official homepage') {
        const url = rel.url?.resource || '';
        
        if (url.includes('instagram.com')) {
          links.instagram = url;
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
          links.youtube = url;
        } else if (url.includes('spotify.com')) {
          links.spotify = url;
        } else if (rel.type === 'official homepage') {
          links.website = url;
        }
      }
      
      // Direct type matches
      if (rel.type === 'youtube') {
        links.youtube = rel.url?.resource;
      }
      if (rel.type === 'streaming') {
        const url = rel.url?.resource || '';
        if (url.includes('spotify')) {
          links.spotify = url;
        }
      }
    }

    return {
      tags,
      genres,
      links,
      description: artistData.disambiguation || undefined,
    };
  } catch (error) {
    console.error(`Error fetching MusicBrainz data for ${artistName}:`, error);
    return null;
  }
}

// Fetch tags from Last.fm
async function fetchLastFmData(artistName: string): Promise<{ tags: string[]; bio?: string }> {
  const LASTFM_API_KEY = Deno.env.get('LASTFM_API_KEY');
  
  if (!LASTFM_API_KEY) {
    return { tags: [] };
  }

  try {
    // Get artist info
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return { tags: [] };
    }

    const data = await response.json();
    
    if (data.error) {
      return { tags: [] };
    }

    const tags = data.artist?.tags?.tag?.map((t: any) => t.name.toLowerCase()) || [];
    const bio = data.artist?.bio?.summary?.replace(/<[^>]*>/g, '').slice(0, 300);

    return { tags, bio };
  } catch (error) {
    console.error(`Error fetching Last.fm data for ${artistName}:`, error);
    return { tags: [] };
  }
}

// Generate fallback social links
function generateFallbackLinks(artistName: string): ArtistEnrichment['links'] {
  const encoded = encodeURIComponent(artistName);
  const tag = artistName.replace(/\s+/g, '').toLowerCase();

  return {
    instagram: `https://www.instagram.com/explore/tags/${tag}`,
    youtube: `https://www.youtube.com/results?search_query=${encoded}+official`,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName } = await req.json();

    if (!artistName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Artist name required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Enriching artist:', artistName);

    // Fetch from multiple sources
    const [mbData, lfmData] = await Promise.all([
      fetchMusicBrainzArtistFull(artistName),
      fetchLastFmData(artistName),
    ]);

    // Combine data
    const allTags = [...new Set([
      ...(mbData?.tags || []),
      ...(lfmData?.tags || []),
    ])];

    const genres = mbData?.genres || [];
    
    // Use MusicBrainz links or generate fallbacks
    const links = mbData?.links && Object.keys(mbData.links).length > 0
      ? mbData.links
      : generateFallbackLinks(artistName);

    // Ensure we always have Instagram and YouTube
    if (!links.instagram) {
      links.instagram = `https://www.instagram.com/explore/tags/${artistName.replace(/\s+/g, '').toLowerCase()}`;
    }
    if (!links.youtube) {
      links.youtube = `https://www.youtube.com/results?search_query=${encodeURIComponent(artistName)}+official`;
    }

    const enrichment: ArtistEnrichment = {
      tags: allTags,
      genres,
      links,
      description: lfmData?.bio || mbData?.description,
    };

    console.log('Artist enrichment complete:', JSON.stringify(enrichment, null, 2));

    return new Response(
      JSON.stringify({ success: true, enrichment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error enriching artist:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});