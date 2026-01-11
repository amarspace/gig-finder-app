const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocalVibePost {
  id: string;
  image_url: string;
  caption: string;
  venue_name: string;
  venue_type: string;
  city: string;
  tags: string[];
  timestamp: string;
}

// No mock data - return empty array when real Instagram API is not available
function getLocalVibeData(): LocalVibePost[] {
  return [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city } = await req.json().catch(() => ({ city: null }));
    
    console.log('Fetching local vibe data for city:', city || 'all');
    
    let posts = getLocalVibeData();
    
    // Filter by city if specified
    if (city) {
      posts = posts.filter(post => post.city.toLowerCase() === city.toLowerCase());
    }

    // Sort by timestamp (most recent first)
    posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return new Response(
      JSON.stringify({
        success: true,
        posts,
        source: '@gigfindermusic'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching local vibes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch local vibes';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
