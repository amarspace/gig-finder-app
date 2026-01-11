/**
 * Parse Playlist Edge Function - ROBUST VERSION
 * Handles YouTube Music, Spotify, and Apple Music with comprehensive logging
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PlaylistAnalysis {
  artists: string[];
  tracks: Array<{ artist: string; title: string }>;
  genres: string[];
  keywords: string[];
  source: 'spotify' | 'apple_music' | 'youtube_music' | 'unknown';
  playlistName?: string;
  totalTracks?: number;
}

interface EventRecommendations {
  artist: string;
  upcomingEvents: number;
  sources: string[];
}

// Timeout wrapper for fetch requests
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`⏱️ Fetch timeout after ${timeoutMs}ms for URL:`, url);
    controller.abort();
  }, timeoutMs);

  try {
    console.log(`🌐 Fetching URL: ${url}`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    console.log(`✅ Fetch successful, status: ${response.status}`);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('❌ Fetch aborted due to timeout');
      throw new Error('Source platform timed out');
    }
    console.error('❌ Fetch error:', error);
    throw error;
  }
}

// Detect platform from URL
function detectPlatform(url: string): PlaylistAnalysis['source'] {
  console.log('🔍 Detecting platform from URL:', url);

  if (url.includes('spotify.com') || url.includes('open.spotify')) {
    console.log('✅ Detected: Spotify');
    return 'spotify';
  }
  if (url.includes('music.apple.com') || url.includes('itunes.apple')) {
    console.log('✅ Detected: Apple Music');
    return 'apple_music';
  }
  if (url.includes('music.youtube.com') || url.includes('youtube.com/playlist')) {
    console.log('✅ Detected: YouTube Music');
    return 'youtube_music';
  }

  console.log('⚠️ Unknown platform');
  return 'unknown';
}

// Extract playlist ID from URL
function extractPlaylistId(url: string, platform: PlaylistAnalysis['source']): string | null {
  console.log('🔑 Extracting playlist ID from URL');

  try {
    if (platform === 'youtube_music') {
      // YouTube Music: ?list=PLxxxxxx or /playlist?list=PLxxxxxx
      const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      const playlistId = match ? match[1] : null;
      console.log('📝 YouTube playlist ID:', playlistId);
      return playlistId;
    }

    if (platform === 'spotify') {
      // Spotify: /playlist/xxxxx
      const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
      const playlistId = match ? match[1] : null;
      console.log('📝 Spotify playlist ID:', playlistId);
      return playlistId;
    }

    if (platform === 'apple_music') {
      // Apple Music: /playlist/pl.xxxxx
      const match = url.match(/playlist\/(pl\.[a-zA-Z0-9-]+)/);
      const playlistId = match ? match[1] : null;
      console.log('📝 Apple Music playlist ID:', playlistId);
      return playlistId;
    }

    console.log('⚠️ Could not extract playlist ID');
    return null;
  } catch (error) {
    console.error('❌ Error extracting playlist ID:', error);
    return null;
  }
}

// Parse YouTube Music playlist using YouTube Data API v3
async function parseYouTubeMusicPlaylist(playlistId: string, apiKey?: string): Promise<PlaylistAnalysis> {
  console.log('🎵 Parsing YouTube Music playlist:', playlistId);

  const tracks: Array<{ artist: string; title: string }> = [];
  const artists: Set<string> = new Set();

  try {
    // Method 1: Use YouTube Data API v3 if API key is provided
    if (apiKey) {
      console.log('🔑 Using YouTube Data API v3');

      const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;

      const response = await fetchWithTimeout(apiUrl, {}, 10000);

      if (!response.ok) {
        console.error('❌ YouTube API error:', response.status, response.statusText);
        throw new Error(`YouTube API returned ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ YouTube API returned ${data.items?.length || 0} items`);

      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          const title = item.snippet?.title || '';
          const videoOwner = item.snippet?.videoOwnerChannelTitle || '';

          // Parse "Artist - Song Title" format
          if (title.includes(' - ')) {
            const [artist, song] = title.split(' - ', 2);
            tracks.push({ artist: artist.trim(), title: song.trim() });
            artists.add(artist.trim());
          } else {
            // Use channel name as artist
            tracks.push({ artist: videoOwner, title: title });
            artists.add(videoOwner);
          }
        }
      }

      console.log(`✅ Extracted ${tracks.length} tracks from YouTube API`);
    } else {
      // Method 2: Scrape YouTube Music page (fallback)
      console.log('🌐 Scraping YouTube Music page (no API key provided)');

      const playlistUrl = `https://music.youtube.com/playlist?list=${playlistId}`;

      const response = await fetchWithTimeout(playlistUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      }, 15000); // Longer timeout for scraping

      if (!response.ok) {
        console.error('❌ YouTube Music page returned non-2xx:', response.status);
        throw new Error(`YouTube Music returned ${response.status}`);
      }

      const html = await response.text();
      console.log(`✅ Fetched HTML (${html.length} chars)`);

      // Extract ytInitialData from page
      const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);

      if (ytInitialDataMatch) {
        console.log('✅ Found ytInitialData in page');

        try {
          const ytData = JSON.parse(ytInitialDataMatch[1]);

          // Navigate to playlist items
          const contents = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]
            ?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
            ?.musicPlaylistShelfRenderer?.contents;

          if (contents && Array.isArray(contents)) {
            console.log(`✅ Found ${contents.length} playlist items`);

            for (const item of contents) {
              const musicItem = item.musicResponsiveListItemRenderer;
              if (!musicItem) continue;

              const flexColumns = musicItem.flexColumns || [];

              // First column usually has song title
              const titleColumn = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer;
              const title = titleColumn?.text?.runs?.[0]?.text || '';

              // Second column usually has artist
              const artistColumn = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer;
              const artist = artistColumn?.text?.runs?.[0]?.text || '';

              if (title && artist) {
                tracks.push({ artist, title });
                artists.add(artist);
              }
            }

            console.log(`✅ Extracted ${tracks.length} tracks from ytInitialData`);
          } else {
            console.log('⚠️ Could not find playlist items in ytInitialData');
          }
        } catch (parseError) {
          console.error('❌ Failed to parse ytInitialData:', parseError);
        }
      } else {
        console.log('⚠️ ytInitialData not found in HTML');

        // Fallback: Try to extract from HTML patterns
        const videoTitlePattern = /"title":\s*{\s*"runs":\s*\[\s*{\s*"text":\s*"([^"]+)"/g;
        const matches = html.matchAll(videoTitlePattern);

        for (const match of matches) {
          const title = match[1];
          if (title && title.includes(' - ')) {
            const [artist, song] = title.split(' - ', 2);
            tracks.push({ artist: artist.trim(), title: song.trim() });
            artists.add(artist.trim());
          }
        }

        console.log(`✅ Extracted ${tracks.length} tracks from HTML patterns`);
      }
    }

    if (tracks.length === 0) {
      throw new Error('No tracks found in playlist. The playlist might be empty or private.');
    }

    console.log(`🎉 Successfully parsed YouTube playlist: ${tracks.length} tracks, ${artists.size} artists`);

    return {
      artists: Array.from(artists).slice(0, 30),
      tracks: tracks.slice(0, 50),
      genres: [], // Will be enriched later
      keywords: [],
      source: 'youtube_music',
      totalTracks: tracks.length,
    };
  } catch (error) {
    console.error('❌ YouTube Music parsing failed:', error);
    throw error;
  }
}

// Parse Spotify playlist
async function parseSpotifyPlaylist(playlistId: string): Promise<PlaylistAnalysis> {
  console.log('🎵 Parsing Spotify playlist:', playlistId);

  try {
    const url = `https://open.spotify.com/playlist/${playlistId}`;

    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    }, 10000);

    if (!response.ok) {
      throw new Error(`Spotify returned ${response.status}`);
    }

    const html = await response.text();
    console.log(`✅ Fetched Spotify HTML (${html.length} chars)`);

    // Extract from Spotify embed data
    const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">({.+?})<\/script>/);

    const tracks: Array<{ artist: string; title: string }> = [];
    const artists: Set<string> = new Set();

    if (scriptMatch) {
      console.log('✅ Found Spotify data');

      try {
        const data = JSON.parse(scriptMatch[1]);
        const playlistData = data?.props?.pageProps?.state?.data?.entity;

        if (playlistData?.tracks?.items) {
          console.log(`✅ Found ${playlistData.tracks.items.length} tracks`);

          for (const item of playlistData.tracks.items) {
            const track = item.track;
            if (!track) continue;

            const title = track.name || '';
            const artist = track.artists?.[0]?.name || '';

            if (title && artist) {
              tracks.push({ artist, title });
              artists.add(artist);
            }
          }
        }
      } catch (parseError) {
        console.error('❌ Failed to parse Spotify data:', parseError);
      }
    }

    console.log(`✅ Extracted ${tracks.length} tracks from Spotify`);

    return {
      artists: Array.from(artists).slice(0, 30),
      tracks: tracks.slice(0, 50),
      genres: [],
      keywords: [],
      source: 'spotify',
      totalTracks: tracks.length,
    };
  } catch (error) {
    console.error('❌ Spotify parsing failed:', error);
    throw error;
  }
}

// Main handler
Deno.serve(async (req) => {
  console.log('\n🚀 === NEW REQUEST ===');
  console.log('📍 Method:', req.method);
  console.log('📍 URL:', req.url);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    console.log('📥 Parsing request body...');
    const body = await req.json();
    const { url, youtube_api_key } = body;

    if (!url) {
      console.error('❌ No URL provided');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Playlist URL is required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Received URL:', url);

    // Detect platform
    const platform = detectPlatform(url);
    console.log('📱 Platform:', platform);

    // Extract playlist ID
    const playlistId = extractPlaylistId(url, platform);

    if (!playlistId) {
      console.error('❌ Could not extract playlist ID');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid playlist URL format',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🆔 Playlist ID:', playlistId);

    // Parse based on platform
    let analysis: PlaylistAnalysis;

    switch (platform) {
      case 'youtube_music':
        console.log('🎬 Parsing YouTube Music playlist...');
        analysis = await parseYouTubeMusicPlaylist(playlistId, youtube_api_key);
        break;

      case 'spotify':
        console.log('🎧 Parsing Spotify playlist...');
        analysis = await parseSpotifyPlaylist(playlistId);
        break;

      case 'apple_music':
        console.log('🍎 Apple Music not fully implemented yet');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Apple Music playlists are not supported yet',
          }),
          {
            status: 501,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      default:
        console.error('❌ Unknown platform');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unsupported playlist platform',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    console.log('✅ Analysis complete');
    console.log('📊 Artists found:', analysis.artists.length);
    console.log('📊 Tracks found:', analysis.tracks.length);
    console.log('🎉 === REQUEST SUCCESSFUL ===\n');

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ === REQUEST FAILED ===');
    console.error('💥 Error:', error);
    console.error('💥 Stack:', error.stack);

    // Specific error handling
    if (error.message?.includes('timed out')) {
      console.error('⏱️ Timeout error detected');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Source platform timed out',
        }),
        {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (error.message?.includes('returned 4')) {
      console.error('🚫 4xx error from source');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Playlist not found or is private. Please check the URL and privacy settings.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic error
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse playlist';

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
