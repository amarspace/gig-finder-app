# Playlist to Events Integration Guide

## Overview

This guide shows you how to use the robust playlist parsing system to convert YouTube Music, Spotify, or Apple Music playlists into concert event recommendations.

---

## 🚀 Quick Start

### 1. Deploy Edge Functions

```bash
# Deploy the robust playlist parser
supabase functions deploy parse-playlist-v2

# Deploy the event finder
supabase functions deploy find-artist-events
```

### 2. Get API Keys (Optional but Recommended)

#### YouTube Data API v3
- Go to: https://console.cloud.google.com/
- Create a new project
- Enable "YouTube Data API v3"
- Create credentials (API key)
- Restrict key to YouTube Data API v3

#### Songkick API
- Sign up at: https://www.songkick.com/developer
- Request API access (approval takes 1-3 days)

#### Bandsintown
- No API key needed! Just use `gigfinder_app` as your app_id

---

## 📖 Usage Examples

### Example 1: Parse YouTube Music Playlist

```typescript
// Frontend code (React/TypeScript)
async function parseYouTubeMusicPlaylist(playlistUrl: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY; // Optional

  const response = await fetch(
    `${supabaseUrl}/functions/v1/parse-playlist-v2`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        url: playlistUrl,
        youtube_api_key: youtubeApiKey, // Optional
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to parse playlist');
  }

  const data = await response.json();
  return data.analysis;
}

// Usage
const playlistUrl = 'https://music.youtube.com/playlist?list=PLxxxxxx';
const analysis = await parseYouTubeMusicPlaylist(playlistUrl);

console.log('Artists:', analysis.artists);
console.log('Tracks:', analysis.tracks);
console.log('Total:', analysis.totalTracks);
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "artists": ["Coldplay", "Imagine Dragons", "OneRepublic", ...],
    "tracks": [
      { "artist": "Coldplay", "title": "Yellow" },
      { "artist": "Imagine Dragons", "title": "Believer" },
      ...
    ],
    "genres": [],
    "keywords": [],
    "source": "youtube_music",
    "totalTracks": 42
  }
}
```

---

### Example 2: Find Events for Playlist Artists

```typescript
async function findEventsForArtists(artists: string[]) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const songkickApiKey = import.meta.env.VITE_SONGKICK_API_KEY; // Optional

  const response = await fetch(
    `${supabaseUrl}/functions/v1/find-artist-events`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        artists: artists.slice(0, 10), // Limit to 10 artists for performance
        bandsintown_app_id: 'gigfinder_app',
        songkick_api_key: songkickApiKey, // Optional
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch events');
  }

  const data = await response.json();
  return data;
}

// Usage
const eventData = await findEventsForArtists(analysis.artists);

console.log('Summary:', eventData.summary);
console.log('Results:', eventData.results);
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "artist": "Coldplay",
      "events": [
        {
          "id": "bandsintown-123456",
          "artistName": "Coldplay",
          "title": "Coldplay - Music of the Spheres Tour",
          "date": "2024-06-15T19:00:00",
          "venue": {
            "name": "Wembley Stadium",
            "city": "London",
            "country": "United Kingdom",
            "latitude": 51.5560,
            "longitude": -0.2795
          },
          "ticketUrl": "https://bandsintown.com/...",
          "source": "bandsintown"
        },
        ...
      ],
      "totalEvents": 15,
      "source": ["bandsintown", "songkick"]
    },
    ...
  ],
  "summary": {
    "totalArtists": 10,
    "artistsWithEvents": 7,
    "totalEvents": 45
  }
}
```

---

### Example 3: Complete Flow (Playlist → Events)

```typescript
// Complete React component example
import { useState } from 'react';

function PlaylistToEvents() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Parse playlist
      console.log('Step 1: Parsing playlist...');
      const parseResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-playlist-v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            url: playlistUrl,
            youtube_api_key: import.meta.env.VITE_YOUTUBE_API_KEY,
          }),
        }
      );

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.error || 'Failed to parse playlist');
      }

      const { analysis } = await parseResponse.json();
      console.log('✅ Parsed playlist:', analysis);

      // Step 2: Find events for artists
      console.log('Step 2: Finding events for artists...');
      const eventsResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/find-artist-events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            artists: analysis.artists.slice(0, 10), // Top 10 artists
            bandsintown_app_id: 'gigfinder_app',
            songkick_api_key: import.meta.env.VITE_SONGKICK_API_KEY,
          }),
        }
      );

      if (!eventsResponse.ok) {
        const errorData = await eventsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch events');
      }

      const { results } = await eventsResponse.json();
      console.log('✅ Found events:', results);

      // Flatten all events into a single array
      const allEvents = results.flatMap((r) => r.events);
      setEvents(allEvents);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Playlist to Events</h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          placeholder="Paste YouTube Music or Spotify playlist URL"
          className="w-full px-4 py-2 border rounded-lg mb-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Find Events'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">
          {error}
        </div>
      )}

      {events.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Found {events.length} Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div key={event.id} className="p-4 border rounded-lg">
                <h3 className="font-bold">{event.title}</h3>
                <p className="text-sm text-gray-600">{event.artistName}</p>
                <p className="text-sm">{event.venue.name}</p>
                <p className="text-sm text-gray-500">
                  {event.venue.city}, {event.venue.country}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(event.date).toLocaleDateString()}
                </p>
                {event.ticketUrl && (
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm hover:underline"
                  >
                    Buy Tickets →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistToEvents;
```

---

## 🔍 Logging & Debugging

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **Logs**
3. Select your function (`parse-playlist-v2` or `find-artist-events`)
4. You'll see detailed logs like:

```
🚀 === NEW REQUEST ===
📍 Method: POST
📍 URL: https://xxx.supabase.co/functions/v1/parse-playlist-v2
✅ Received URL: https://music.youtube.com/playlist?list=PLxxxxxx
🔍 Detecting platform from URL: https://music.youtube.com/playlist...
✅ Detected: YouTube Music
🔑 Extracting playlist ID from URL
📝 YouTube playlist ID: PLxxxxxx
🎵 Parsing YouTube Music playlist: PLxxxxxx
🌐 Fetching URL: https://music.youtube.com/playlist?list=PLxxxxxx
✅ Fetch successful, status: 200
✅ Fetched HTML (125436 chars)
✅ Found ytInitialData in page
✅ Found 42 playlist items
✅ Extracted 42 tracks from ytInitialData
🎉 Successfully parsed YouTube playlist: 42 tracks, 15 artists
✅ Analysis complete
📊 Artists found: 15
📊 Tracks found: 42
🎉 === REQUEST SUCCESSFUL ===
```

### Common Errors & Solutions

#### Error: "Source platform timed out" (504)

**Cause:** YouTube/Spotify took longer than 10 seconds to respond

**Solution:**
- The timeout is intentional to prevent hanging
- YouTube Music pages are often slow (use YouTube API instead)
- Retry the request after a few seconds

#### Error: "YouTube Music returned 403"

**Cause:** YouTube is blocking the scraper

**Solutions:**
1. **Use YouTube Data API v3** (recommended):
   ```typescript
   body: JSON.stringify({
     url: playlistUrl,
     youtube_api_key: 'YOUR_API_KEY' // This bypasses scraping
   })
   ```

2. The function will fall back to scraping if no API key is provided

#### Error: "Unable to extract playlist data"

**Cause:** Playlist is private or empty

**Solution:**
- Make sure the playlist is **Public** or **Unlisted**
- Check that the playlist has at least 1 track

---

## ⚙️ Environment Variables

Add to your `.env` file:

```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (but highly recommended for YouTube Music)
VITE_YOUTUBE_API_KEY=your-youtube-api-key

# Optional (for better event coverage)
VITE_SONGKICK_API_KEY=your-songkick-key
```

---

## 🎯 Integration with Event Aggregation System

You can also integrate with the full event aggregation system we built earlier:

```typescript
import { getEventAggregator } from '@/lib/events';

async function findEventsUsingAggregator(artists: string[]) {
  const aggregator = getEventAggregator();

  // Fetch events for all artists in parallel
  const allEvents = await Promise.all(
    artists.map((artist) => aggregator.fetchArtistEvents(artist))
  );

  // Flatten results
  return allEvents.flat();
}

// Usage after parsing playlist
const analysis = await parseYouTubeMusicPlaylist(playlistUrl);
const events = await findEventsUsingAggregator(analysis.artists);
```

This approach gives you:
- ✅ Bandsintown + Songkick + Ukrainian platforms
- ✅ Automatic caching (15 minutes)
- ✅ Deduplication
- ✅ Unified event schema

---

## 📊 Performance Tips

### 1. Limit Artists
Don't fetch events for all artists at once:
```typescript
// Good: Top 10 artists
artists: analysis.artists.slice(0, 10)

// Bad: All 50 artists (slow!)
artists: analysis.artists
```

### 2. Use YouTube Data API
Scraping YouTube Music is slow (15+ seconds). Using the API is much faster (2-3 seconds).

### 3. Cache Results
Cache the playlist analysis in your frontend:
```typescript
// Cache in localStorage
localStorage.setItem(`playlist_${playlistId}`, JSON.stringify(analysis));
```

### 4. Parallel Requests
The Edge Functions already handle parallel requests internally, but you can also batch playlist parsing:

```typescript
const playlists = [url1, url2, url3];
const analyses = await Promise.all(
  playlists.map((url) => parseYouTubeMusicPlaylist(url))
);
```

---

## 🔒 Rate Limiting

### YouTube Data API
- **Quota:** 10,000 units per day (free tier)
- **Cost per playlist:** ~3 units
- **Safe limit:** ~3,000 playlists/day

### Bandsintown
- **Rate limit:** 100 requests/minute
- **No daily limit**
- **Recommendation:** Batch artists (10 at a time)

### Songkick
- **Rate limit:** 5 requests/second
- **Daily limit:** 5,000 requests
- **Recommendation:** Use for popular artists only

---

## 🧪 Testing

### Test YouTube Music Playlist

```bash
curl -X POST https://your-project.supabase.co/functions/v1/parse-playlist-v2 \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://music.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
    "youtube_api_key": "YOUR_API_KEY"
  }'
```

### Test Event Finder

```bash
curl -X POST https://your-project.supabase.co/functions/v1/find-artist-events \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "artists": ["Coldplay", "Imagine Dragons"],
    "bandsintown_app_id": "gigfinder_app",
    "songkick_api_key": "YOUR_SONGKICK_KEY"
  }'
```

---

## 📝 Summary

**What We Built:**
1. ✅ Robust YouTube Music playlist parser with API + scraping fallback
2. ✅ Comprehensive logging for debugging
3. ✅ 10-second timeout with clear 504 errors
4. ✅ Proper CORS headers for frontend integration
5. ✅ Event finder that integrates with Bandsintown & Songkick
6. ✅ Complete React example component

**Key Features:**
- Handles YouTube Music, Spotify (Apple Music coming soon)
- Falls back to scraping if YouTube API is not available
- Detailed emoji-based logging (🚀 ✅ ❌ etc.)
- Timeout handling prevents hanging requests
- Proper error messages for frontend display
- Integration with event aggregation system

**Next Steps:**
1. Deploy the functions
2. Get YouTube Data API key (optional but recommended)
3. Test with your playlists
4. Integrate into your React app
5. Add to your event discovery flow

---

🎉 **Happy Event Finding!**
