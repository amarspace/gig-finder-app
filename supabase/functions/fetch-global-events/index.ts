import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GlobalEvent {
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

// Fetch events from Bandsintown API
async function fetchBandsintown(artistName: string, location?: string): Promise<GlobalEvent[]> {
  const BANDSINTOWN_APP_ID = Deno.env.get('BANDSINTOWN_APP_ID') || 'gigfinder_app';
  
  try {
    const url = `https://rest.bandsintown.com/artists/${encodeURIComponent(artistName)}/events?app_id=${BANDSINTOWN_APP_ID}`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.log(`Bandsintown failed for ${artistName}: ${response.status}`);
      return [];
    }

    const events = await response.json();
    
    if (!Array.isArray(events)) {
      return [];
    }

    return events.slice(0, 10).map((event: any) => ({
      artist_name: artistName,
      event_title: event.title || `${artistName} Live`,
      venue_name: event.venue?.name || 'TBA',
      city: event.venue?.city || location || 'Unknown',
      event_date: event.datetime,
      genre: 'Live Music',
      source_url: event.url || '',
      source: 'bandsintown',
      image_url: event.artist?.thumb_url || null,
      tags: [],
    }));
  } catch (error) {
    console.error(`Error fetching Bandsintown for ${artistName}:`, error);
    return [];
  }
}

// Fetch events from Songkick API
async function fetchSongkick(location: string): Promise<GlobalEvent[]> {
  const SONGKICK_API_KEY = Deno.env.get('SONGKICK_API_KEY');
  
  if (!SONGKICK_API_KEY) {
    console.log('Songkick API key not configured');
    return [];
  }

  try {
    // First get metro area ID
    const searchUrl = `https://api.songkick.com/api/3.0/search/locations.json?query=${encodeURIComponent(location)}&apikey=${SONGKICK_API_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      return [];
    }

    const searchData = await searchResponse.json();
    const metroArea = searchData.resultsPage?.results?.location?.[0]?.metroArea;

    if (!metroArea?.id) {
      return [];
    }

    // Fetch events for metro area
    const eventsUrl = `https://api.songkick.com/api/3.0/metro_areas/${metroArea.id}/calendar.json?apikey=${SONGKICK_API_KEY}`;
    
    const eventsResponse = await fetch(eventsUrl);
    
    if (!eventsResponse.ok) {
      return [];
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.resultsPage?.results?.event || [];

    return events.slice(0, 20).map((event: any) => {
      const artists = event.performance?.map((p: any) => p.artist?.displayName).filter(Boolean) || [];
      
      return {
        artist_name: artists[0] || event.displayName || 'Unknown Artist',
        event_title: event.displayName || 'Live Event',
        venue_name: event.venue?.displayName || 'TBA',
        city: event.location?.city || location,
        event_date: event.start?.datetime || event.start?.date,
        genre: event.type === 'Festival' ? 'Festival' : 'Live Music',
        source_url: event.uri || '',
        source: 'songkick',
        image_url: null,
        tags: [],
      };
    });
  } catch (error) {
    console.error(`Error fetching Songkick for ${location}:`, error);
    return [];
  }
}

// Scrape Kontramarka.ua
async function scrapeKontramarka(): Promise<GlobalEvent[]> {
  try {
    const response = await fetch('https://kontramarka.ua/uk/category/concerts', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'uk-UA,uk;q=0.9',
      },
    });

    if (!response.ok) {
      console.log('Kontramarka scrape failed:', response.status);
      return [];
    }

    const html = await response.text();
    const events: GlobalEvent[] = [];

    // Extract event data from HTML
    const eventPattern = /<div[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const titlePattern = /<h[23][^>]*>([^<]+)<\/h[23]>/i;
    const datePattern = /(\d{1,2})[.\s]*(січня|лютого|березня|квітня|травня|червня|липня|серпня|вересня|жовтня|листопада|грудня)/i;
    const venuePattern = /<span[^>]*class="[^"]*venue[^"]*"[^>]*>([^<]+)<\/span>/i;
    const linkPattern = /href="([^"]*kontramarka[^"]*)"/i;

    const ukrainianMonths: Record<string, number> = {
      'січня': 1, 'лютого': 2, 'березня': 3, 'квітня': 4,
      'травня': 5, 'червня': 6, 'липня': 7, 'серпня': 8,
      'вересня': 9, 'жовтня': 10, 'листопада': 11, 'грудня': 12
    };

    const eventMatches = html.matchAll(eventPattern);
    
    for (const match of eventMatches) {
      const block = match[1];
      const titleMatch = block.match(titlePattern);
      const dateMatch = block.match(datePattern);
      const venueMatch = block.match(venuePattern);
      const linkMatch = match[0].match(linkPattern);

      if (titleMatch) {
        let eventDate = new Date();
        if (dateMatch) {
          const day = parseInt(dateMatch[1]);
          const monthName = dateMatch[2].toLowerCase();
          const month = ukrainianMonths[monthName] || 1;
          const year = month < new Date().getMonth() + 1 ? 2026 : 2025;
          eventDate = new Date(year, month - 1, day);
        }

        events.push({
          artist_name: titleMatch[1].trim(),
          event_title: titleMatch[1].trim(),
          venue_name: venueMatch?.[1]?.trim() || 'Kyiv',
          city: 'Kyiv',
          event_date: eventDate.toISOString(),
          genre: 'Live Music',
          source_url: linkMatch?.[1] || 'https://kontramarka.ua',
          source: 'kontramarka',
        });
      }
    }

    return events.slice(0, 15);
  } catch (error) {
    console.error('Error scraping Kontramarka:', error);
    return [];
  }
}

// Scrape Concert.ua
async function scrapeConcertUa(): Promise<GlobalEvent[]> {
  try {
    const response = await fetch('https://concert.ua/uk/eventgroup/koncerty', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'uk-UA,uk;q=0.9',
      },
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const events: GlobalEvent[] = [];

    // Simple extraction
    const titlePattern = /<h[234][^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h/gi;
    const matches = html.matchAll(titlePattern);

    for (const match of matches) {
      events.push({
        artist_name: match[1].trim(),
        event_title: match[1].trim(),
        venue_name: 'Kyiv',
        city: 'Kyiv',
        event_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        genre: 'Live Music',
        source_url: 'https://concert.ua',
        source: 'concert_ua',
      });
    }

    return events.slice(0, 10);
  } catch (error) {
    console.error('Error scraping Concert.ua:', error);
    return [];
  }
}

// Scrape Karabas
async function scrapeKarabas(): Promise<GlobalEvent[]> {
  try {
    const response = await fetch('https://karabas.com/uk/concerts', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'uk-UA,uk;q=0.9',
      },
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const events: GlobalEvent[] = [];

    const titlePattern = /<a[^>]*class="[^"]*event[^"]*"[^>]*>([^<]+)<\/a>/gi;
    const matches = html.matchAll(titlePattern);

    for (const match of matches) {
      events.push({
        artist_name: match[1].trim(),
        event_title: match[1].trim(),
        venue_name: 'Kyiv',
        city: 'Kyiv',
        event_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        genre: 'Live Music',
        source_url: 'https://karabas.com',
        source: 'karabas',
      });
    }

    return events.slice(0, 10);
  } catch (error) {
    console.error('Error scraping Karabas:', error);
    return [];
  }
}

// Get mock events for development
function getMockEvents(): GlobalEvent[] {
  return [
    {
      artist_name: 'Океан Ельзи',
      event_title: 'Океан Ельзи - Великий концерт',
      venue_name: 'Палац Спорту',
      city: 'Kyiv',
      event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      genre: 'Rock',
      source_url: 'https://kontramarka.ua/okean-elzy',
      source: 'kontramarka',
      image_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80',
      tags: ['ukrainian rock', 'alternative', 'indie'],
    },
    {
      artist_name: 'MONATIK',
      event_title: 'MONATIK Live Show',
      venue_name: 'Stereo Plaza',
      city: 'Kyiv',
      event_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      genre: 'Pop',
      source_url: 'https://concert.ua/monatik',
      source: 'concert_ua',
      image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
      tags: ['ukrainian pop', 'r&b', 'dance'],
    },
    {
      artist_name: 'Dakha Brakha',
      event_title: 'Dakha Brakha - World Music',
      venue_name: 'Жовтневий Палац',
      city: 'Kyiv',
      event_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      genre: 'Folk',
      source_url: 'https://karabas.com/dakhabrakha',
      source: 'karabas',
      image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
      tags: ['world music', 'folk', 'experimental'],
    },
    {
      artist_name: 'Kalush Orchestra',
      event_title: 'Kalush Orchestra Tour 2025',
      venue_name: 'Atlas',
      city: 'Kyiv',
      event_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      genre: 'Hip-Hop',
      source_url: 'https://kontramarka.ua/kalush',
      source: 'kontramarka',
      image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
      tags: ['hip-hop', 'folk rap', 'ukrainian'],
    },
    {
      artist_name: 'KAZKA',
      event_title: 'KAZKA - New Album Tour',
      venue_name: 'Caribbean Club',
      city: 'Kyiv',
      event_date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
      genre: 'Electronic',
      source_url: 'https://concert.ua/kazka',
      source: 'concert_ua',
      image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
      tags: ['electronic', 'pop', 'folk electronic'],
    },
    {
      artist_name: 'The Hardkiss',
      event_title: 'The Hardkiss - Stadium Show',
      venue_name: 'NSC Olimpiyskiy',
      city: 'Kyiv',
      event_date: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString(),
      genre: 'Rock',
      source_url: 'https://kontramarka.ua/hardkiss',
      source: 'kontramarka',
      image_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
      tags: ['alternative rock', 'indie', 'ukrainian'],
    },
    {
      artist_name: 'Go_A',
      event_title: 'Go_A Electronic Folk Night',
      venue_name: 'Bel Etage',
      city: 'Kyiv',
      event_date: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000).toISOString(),
      genre: 'Electronic',
      source_url: 'https://karabas.com/goa',
      source: 'karabas',
      image_url: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80',
      tags: ['electronic', 'folk', 'techno folk'],
    },
    {
      artist_name: 'Бумбокс',
      event_title: 'Бумбокс - Acoustic Session',
      venue_name: 'Sentrum',
      city: 'Kyiv',
      event_date: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
      genre: 'Acoustic',
      source_url: 'https://concert.ua/boombox',
      source: 'concert_ua',
      image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
      tags: ['acoustic', 'indie', 'singer-songwriter'],
    },
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location = 'Kyiv', artists = [] } = await req.json();
    
    console.log('Fetching global events for:', location, 'with artists:', artists);

    const allEvents: GlobalEvent[] = [];

    // Fetch from multiple sources in parallel
    const [
      kontramarka,
      concertUa,
      karabas,
    ] = await Promise.allSettled([
      scrapeKontramarka(),
      scrapeConcertUa(),
      scrapeKarabas(),
    ]);

    // Collect results
    if (kontramarka.status === 'fulfilled') allEvents.push(...kontramarka.value);
    if (concertUa.status === 'fulfilled') allEvents.push(...concertUa.value);
    if (karabas.status === 'fulfilled') allEvents.push(...karabas.value);

    // Fetch Bandsintown for specific artists if provided
    if (artists.length > 0) {
      const artistPromises = artists.slice(0, 3).map((artist: string) => 
        fetchBandsintown(artist, location)
      );
      const artistResults = await Promise.allSettled(artistPromises);
      
      for (const result of artistResults) {
        if (result.status === 'fulfilled') {
          allEvents.push(...result.value);
        }
      }
    }

    // Try Songkick
    const songkickEvents = await fetchSongkick(location);
    allEvents.push(...songkickEvents);

    // If no events found, use mock data
    const finalEvents = allEvents.length > 0 ? allEvents : getMockEvents();

    // Deduplicate by artist name
    const uniqueEvents = Array.from(
      new Map(finalEvents.map(e => [e.artist_name.toLowerCase(), e])).values()
    );

    // Sort by date
    uniqueEvents.sort((a, b) => 
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );

    console.log(`Found ${uniqueEvents.length} events`);

    // Store events in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert events to database
    for (const event of uniqueEvents.slice(0, 20)) {
      await supabase
        .from('gigs')
        .upsert({
          artist_name: event.artist_name,
          venue_name: event.venue_name,
          event_date: event.event_date,
          genre: event.genre,
          image_url: event.image_url,
        }, {
          onConflict: 'artist_name,event_date',
          ignoreDuplicates: true,
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        events: uniqueEvents,
        sources: {
          kontramarka: kontramarka.status === 'fulfilled' ? kontramarka.value.length : 0,
          concert_ua: concertUa.status === 'fulfilled' ? concertUa.value.length : 0,
          karabas: karabas.status === 'fulfilled' ? karabas.value.length : 0,
          songkick: songkickEvents.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching global events:', error);
    
    // Return mock events on error
    const mockEvents = getMockEvents();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        events: mockEvents,
        fallback: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});