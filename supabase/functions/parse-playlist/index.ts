const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaylistAnalysis {
  artists: string[];
  genres: string[];
  keywords: string[];
  source: 'spotify' | 'apple_music' | 'youtube_music' | 'unknown';
}

// Genre mappings from keywords
const genreKeywords: Record<string, string[]> = {
  'Pop': ['pop', 'mainstream', 'charts', 'hit', 'radio'],
  'Rock': ['rock', 'guitar', 'alternative', 'indie rock', 'punk'],
  'Electronic': ['electronic', 'edm', 'house', 'techno', 'dance', 'dj'],
  'Hip-Hop': ['hip-hop', 'rap', 'trap', 'drill', 'freestyle'],
  'Folk': ['folk', 'acoustic', 'traditional', 'country', 'народна'],
  'Jazz': ['jazz', 'swing', 'blues', 'smooth'],
  'R&B': ['r&b', 'rnb', 'soul', 'neo-soul', 'contemporary'],
  'Metal': ['metal', 'heavy', 'thrash', 'death', 'black metal'],
  'Classical': ['classical', 'orchestra', 'symphony', 'opera'],
  'Indie': ['indie', 'independent', 'underground', 'альтернатива'],
  'Ukrainian': ['українська', 'ukraine', 'ukrainian', 'україна', 'folk']
};

// Known Ukrainian artists for matching
const ukrainianArtists = [
  'KAZKA', 'The Hardkiss', 'Kalush Orchestra', 'Go_A', 'Океан Ельзи',
  'Один в каное', 'Антитіла', 'MONATIK', 'Бумбокс', 'Jamala',
  'Тіна Кароль', 'Время и Стекло', 'DZIDZIO', 'Pianoбой', 'Скрябін',
  'ДахаБраха', 'Onuka', 'Vivienne Mort', 'Друга Ріка', 'Плач Єремії'
];

async function fetchPlaylistPreview(url: string): Promise<string> {
  try {
    console.log('Fetching playlist preview from:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GigFinder/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      console.log('Failed to fetch playlist, status:', response.status);
      return '';
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return '';
  }
}

function detectPlatform(url: string): PlaylistAnalysis['source'] {
  if (url.includes('spotify.com') || url.includes('open.spotify')) {
    return 'spotify';
  }
  if (url.includes('music.apple.com') || url.includes('itunes.apple')) {
    return 'apple_music';
  }
  if (url.includes('music.youtube.com') || url.includes('youtube.com/playlist')) {
    return 'youtube_music';
  }
  return 'unknown';
}

function extractArtistsFromHtml(html: string): string[] {
  const artists: Set<string> = new Set();
  
  // Look for og:description, meta description, title
  const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  
  const textContent = [
    ogDescMatch?.[1] || '',
    descMatch?.[1] || '',
    titleMatch?.[1] || ''
  ].join(' ');

  // Check for Ukrainian artists
  for (const artist of ukrainianArtists) {
    if (textContent.toLowerCase().includes(artist.toLowerCase())) {
      artists.add(artist);
    }
  }

  // Extract potential artist names from common patterns
  const artistPatterns = [
    /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /Artist:\s*([^,<]+)/gi,
    /"artist"\s*:\s*"([^"]+)"/g,
    /performer[^>]*>([^<]+)/gi
  ];

  for (const pattern of artistPatterns) {
    const matches = textContent.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2 && match[1].length < 50) {
        artists.add(match[1].trim());
      }
    }
  }

  return Array.from(artists).slice(0, 20);
}

function extractGenresFromHtml(html: string): string[] {
  const genres: Set<string> = new Set();
  const htmlLower = html.toLowerCase();

  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    for (const keyword of keywords) {
      if (htmlLower.includes(keyword)) {
        genres.add(genre);
        break;
      }
    }
  }

  return Array.from(genres);
}

function extractKeywords(html: string): string[] {
  const keywords: Set<string> = new Set();
  
  // Extract from meta keywords
  const keywordsMatch = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]+)"/i);
  if (keywordsMatch) {
    keywordsMatch[1].split(',').forEach(k => keywords.add(k.trim().toLowerCase()));
  }

  // Extract genre-related terms
  const htmlLower = html.toLowerCase();
  for (const genreKeywordList of Object.values(genreKeywords)) {
    for (const keyword of genreKeywordList) {
      if (htmlLower.includes(keyword)) {
        keywords.add(keyword);
      }
    }
  }

  return Array.from(keywords).slice(0, 30);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Playlist URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing playlist:', url);
    
    const source = detectPlatform(url);
    let analysis: PlaylistAnalysis;

    // Try to fetch and parse the playlist page
    const html = await fetchPlaylistPreview(url);

    if (html && html.length > 1000) {
      // Parse real content
      const artists = extractArtistsFromHtml(html);
      const genres = extractGenresFromHtml(html);
      const keywords = extractKeywords(html);

      // If we couldn't extract any data, return error
      if (artists.length === 0 || genres.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unable to extract playlist data. Please make sure the playlist is public and try again.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      analysis = {
        artists,
        genres,
        keywords,
        source
      };
    } else {
      // Failed to fetch playlist HTML
      console.log('Failed to fetch playlist HTML');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unable to access playlist. Please check that the URL is correct and the playlist is public.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analysis complete:', analysis);

    return new Response(
      JSON.stringify({
        success: true,
        analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing playlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse playlist';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
