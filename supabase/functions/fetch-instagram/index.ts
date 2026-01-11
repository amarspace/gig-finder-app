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

// Since Instagram requires authentication for API access,
// we'll provide curated local vibe data that simulates Instagram content
function getLocalVibeData(): LocalVibePost[] {
  const now = new Date();
  
  return [
    // Kyiv venues
    {
      id: 'lv1',
      image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80',
      caption: '🎸 Tonight at Барабан! Live jazz session with local talents. The vibe is immaculate ✨ #kyivnights #livemusic',
      venue_name: 'Барабан',
      venue_type: 'Live Music Bar',
      city: 'Kyiv',
      tags: ['livemusic', 'jazz', 'kyivnights', 'барабан'],
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'lv2',
      image_url: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&q=80',
      caption: 'Atlas is packed! 🔥 Electronic night with @go_a vibes. Ukrainian beats hitting different 🇺🇦 #atlas #kyiv',
      venue_name: 'Atlas',
      venue_type: 'Concert Hall',
      city: 'Kyiv',
      tags: ['atlas', 'electronic', 'kyiv', 'ukrainianmusic'],
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'lv3',
      image_url: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=400&q=80',
      caption: 'Smooth evening at Caribbean Club 🎷 Jazz never gets old #caribbeanclub #jazzkyiv',
      venue_name: 'Caribbean Club',
      venue_type: 'Jazz Club',
      city: 'Kyiv',
      tags: ['jazz', 'caribbeanclub', 'kyivmusic', 'liveperformance'],
      timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'lv4',
      image_url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&q=80',
      caption: "Docker's ABC - best rock covers in town! 🎸🍺 #dockersabc #rocknroll",
      venue_name: "Docker's ABC",
      venue_type: 'Pub & Grill',
      city: 'Kyiv',
      tags: ['rock', 'covers', 'pub', 'dockersabc'],
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
    },
    
    // Lviv venues
    {
      id: 'lv5',
      image_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&q=80',
      caption: 'Opera night in Lviv 🎭 Absolutely magical performance #lvivopera #культура',
      venue_name: 'Lviv Opera House',
      venue_type: 'Opera & Ballet',
      city: 'Lviv',
      tags: ['opera', 'lviv', 'культура', 'classical'],
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'lv6',
      image_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&q=80',
      caption: '!FESTrepublic going crazy tonight! 🔥 Best indie scene in Ukraine #festrepublic #indiemusic',
      venue_name: '!FESTrepublic',
      venue_type: 'Concert Venue',
      city: 'Lviv',
      tags: ['indie', 'festrepublic', 'lviv', 'alternativemusic'],
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'lv7',
      image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
      caption: 'Picasso Club - where art meets music 🎨🎵 #picassoclub #lvivnights',
      venue_name: 'Picasso Club',
      venue_type: 'Live Music Club',
      city: 'Lviv',
      tags: ['picassoclub', 'livemusic', 'lviv', 'art'],
      timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'lv8',
      image_url: 'https://images.unsplash.com/photo-1574447714530-e9aa4c6b9c3e?w=400&q=80',
      caption: 'Pravda Beer Theatre - craft beer + live music = perfect combo 🍺🎸 #pravdabeer',
      venue_name: 'Pravda Beer Theatre',
      venue_type: 'Brewery & Stage',
      city: 'Lviv',
      tags: ['craftbeer', 'livemusic', 'pravdabeer', 'lviv'],
      timestamp: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString()
    },
    
    // Berlin venues (for Ukrainian diaspora)
    {
      id: 'lv9',
      image_url: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400&q=80',
      caption: 'Berlin Arena hosting Ukrainian night! 🇺🇦🇩🇪 #berlinukraine #diaspora',
      venue_name: 'Berlin Arena',
      venue_type: 'Arena',
      city: 'Berlin',
      tags: ['berlin', 'ukrainian', 'diaspora', 'concert'],
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'lv10',
      image_url: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=400&q=80',
      caption: 'Berghain queue at midnight 😅 Worth it though #berghain #technoberlin',
      venue_name: 'Berghain',
      venue_type: 'Techno Club',
      city: 'Berlin',
      tags: ['berghain', 'techno', 'berlin', 'nightlife'],
      timestamp: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'lv11',
      image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
      caption: 'SO36 punk night - raw energy! 🤘 #so36 #punkberlin #underground',
      venue_name: 'SO36',
      venue_type: 'Punk & Alternative',
      city: 'Berlin',
      tags: ['punk', 'so36', 'berlin', 'underground'],
      timestamp: new Date(now.getTime() - 9 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'lv12',
      image_url: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400&q=80',
      caption: 'Lido Berlin - intimate gig vibes 🎤 #lidoberlin #livemusicberlin',
      venue_name: 'Lido Berlin',
      venue_type: 'Live Music Venue',
      city: 'Berlin',
      tags: ['lido', 'livemusic', 'berlin', 'intimategig'],
      timestamp: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString()
    }
  ];
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
