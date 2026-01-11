/**
 * Find Artist Events Edge Function
 * Integrates with Bandsintown and Songkick to find events for playlist artists
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ArtistEvent {
  id: string;
  artistName: string;
  title: string;
  date: string;
  venue: {
    name: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  ticketUrl?: string;
  imageUrl?: string;
  source: 'bandsintown' | 'songkick';
}

interface ArtistEventsResult {
  artist: string;
  events: ArtistEvent[];
  totalEvents: number;
  source: string[];
}

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

// Fetch events from Bandsintown
async function fetchBandsintownEvents(artistName: string, appId: string): Promise<ArtistEvent[]> {
  console.log(`🎸 Fetching Bandsintown events for: ${artistName}`);

  try {
    const encodedArtist = encodeURIComponent(artistName);
    const url = `https://rest.bandsintown.com/artists/${encodedArtist}/events?app_id=${appId}`;

    const response = await fetchWithTimeout(url, {}, 10000);

    if (!response.ok) {
      console.log(`⚠️ Bandsintown returned ${response.status} for ${artistName}`);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.log(`⚠️ Bandsintown returned non-array for ${artistName}`);
      return [];
    }

    console.log(`✅ Bandsintown found ${data.length} events for ${artistName}`);

    return data.map((event: any) => ({
      id: `bandsintown-${event.id}`,
      artistName,
      title: event.title || `${artistName} Live`,
      date: event.datetime,
      venue: {
        name: event.venue?.name || 'Unknown Venue',
        city: event.venue?.city || '',
        country: event.venue?.country || '',
        latitude: parseFloat(event.venue?.latitude),
        longitude: parseFloat(event.venue?.longitude),
      },
      ticketUrl: event.url || event.offers?.[0]?.url,
      imageUrl: event.artist?.image_url,
      source: 'bandsintown' as const,
    }));
  } catch (error) {
    console.error(`❌ Bandsintown error for ${artistName}:`, error);
    return [];
  }
}

// Fetch events from Songkick
async function fetchSongkickEvents(artistName: string, apiKey: string): Promise<ArtistEvent[]> {
  console.log(`🎤 Fetching Songkick events for: ${artistName}`);

  try {
    // Step 1: Search for artist
    const encodedArtist = encodeURIComponent(artistName);
    const searchUrl = `https://api.songkick.com/api/3.0/search/artists.json?apikey=${apiKey}&query=${encodedArtist}`;

    const searchResponse = await fetchWithTimeout(searchUrl, {}, 10000);

    if (!searchResponse.ok) {
      console.log(`⚠️ Songkick search returned ${searchResponse.status} for ${artistName}`);
      return [];
    }

    const searchData = await searchResponse.json();
    const artists = searchData.resultsPage?.results?.artist || [];

    if (artists.length === 0) {
      console.log(`⚠️ Songkick: Artist not found - ${artistName}`);
      return [];
    }

    const artistId = artists[0].id;
    console.log(`✅ Songkick found artist ID: ${artistId}`);

    // Step 2: Fetch artist events
    const eventsUrl = `https://api.songkick.com/api/3.0/artists/${artistId}/calendar.json?apikey=${apiKey}`;

    const eventsResponse = await fetchWithTimeout(eventsUrl, {}, 10000);

    if (!eventsResponse.ok) {
      console.log(`⚠️ Songkick events returned ${eventsResponse.status}`);
      return [];
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.resultsPage?.results?.event || [];

    console.log(`✅ Songkick found ${events.length} events for ${artistName}`);

    return events.map((event: any) => ({
      id: `songkick-${event.id}`,
      artistName,
      title: event.displayName,
      date: event.start?.datetime || event.start?.date,
      venue: {
        name: event.venue?.displayName || 'Unknown Venue',
        city: event.venue?.metroArea?.displayName || '',
        country: event.venue?.metroArea?.country?.displayName || '',
        latitude: event.venue?.lat,
        longitude: event.venue?.lng,
      },
      ticketUrl: event.uri,
      source: 'songkick' as const,
    }));
  } catch (error) {
    console.error(`❌ Songkick error for ${artistName}:`, error);
    return [];
  }
}

// Fetch events for a single artist from all sources
async function fetchArtistEvents(
  artistName: string,
  bandsintownAppId: string,
  songkickApiKey?: string
): Promise<ArtistEventsResult> {
  console.log(`\n🎯 Fetching events for artist: ${artistName}`);

  const allEvents: ArtistEvent[] = [];
  const sources: string[] = [];

  // Fetch from Bandsintown (always available)
  try {
    const bandsintownEvents = await fetchBandsintownEvents(artistName, bandsintownAppId);
    allEvents.push(...bandsintownEvents);
    if (bandsintownEvents.length > 0) {
      sources.push('bandsintown');
    }
  } catch (error) {
    console.error('❌ Bandsintown failed:', error);
  }

  // Fetch from Songkick (if API key provided)
  if (songkickApiKey) {
    try {
      const songkickEvents = await fetchSongkickEvents(artistName, songkickApiKey);
      allEvents.push(...songkickEvents);
      if (songkickEvents.length > 0) {
        sources.push('songkick');
      }
    } catch (error) {
      console.error('❌ Songkick failed:', error);
    }
  }

  // Sort by date
  allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  console.log(`✅ Total events found for ${artistName}: ${allEvents.length}`);

  return {
    artist: artistName,
    events: allEvents,
    totalEvents: allEvents.length,
    source: sources,
  };
}

// Main handler
Deno.serve(async (req) => {
  console.log('\n🚀 === FIND ARTIST EVENTS REQUEST ===');

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Parsing request body...');
    const body = await req.json();
    const {
      artists,
      bandsintown_app_id = 'gigfinder_app',
      songkick_api_key,
    } = body;

    if (!artists || !Array.isArray(artists) || artists.length === 0) {
      console.error('❌ No artists provided');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Artists array is required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ Received ${artists.length} artists:`, artists);

    // Fetch events for all artists (parallel)
    console.log('🔄 Fetching events in parallel...');
    const artistEventPromises = artists.map((artist) =>
      fetchArtistEvents(artist, bandsintown_app_id, songkick_api_key)
    );

    const results = await Promise.all(artistEventPromises);

    // Filter out artists with no events
    const artistsWithEvents = results.filter((r) => r.totalEvents > 0);
    const totalEvents = results.reduce((sum, r) => sum + r.totalEvents, 0);

    console.log(`✅ Found events for ${artistsWithEvents.length}/${artists.length} artists`);
    console.log(`✅ Total events: ${totalEvents}`);
    console.log('🎉 === REQUEST SUCCESSFUL ===\n');

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          totalArtists: artists.length,
          artistsWithEvents: artistsWithEvents.length,
          totalEvents,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ === REQUEST FAILED ===');
    console.error('💥 Error:', error);
    console.error('💥 Stack:', error.stack);

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
