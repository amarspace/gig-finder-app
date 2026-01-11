# Event Aggregation System Documentation

## Overview

The Event Aggregation System is a robust, modular solution for fetching concert and event data from multiple sources. It implements a clean Provider pattern with caching, error handling, and graceful degradation.

## Architecture

### Core Components

1. **EventProvider Interface** - Base interface all providers must implement
2. **BaseEventProvider** - Abstract class with common functionality (retries, timeouts, error handling)
3. **Specific Providers** - Implementations for each platform (Bandsintown, Songkick, Ukrainian platforms)
4. **EventAggregatorService** - Orchestrates multiple providers with caching and error handling
5. **Web Scrapers** - Supabase Edge Functions for Ukrainian ticket platforms

### Data Flow

```
User Request
    ↓
EventAggregatorService (checks cache)
    ↓
Multiple Providers (parallel requests)
    ├── BandsintownProvider → Bandsintown API
    ├── SongkickProvider → Songkick API
    └── UkrainianScraperProvider → Supabase Edge Functions
        ├── scrape-concert-ua
        ├── scrape-kontramarka
        ├── scrape-karabas
        └── scrape-ottry
    ↓
Unified Event Schema
    ↓
Deduplication & Sorting
    ↓
Cache & Return
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (but recommended)
VITE_BANDSINTOWN_API_KEY=gigfinder_app
VITE_SONGKICK_API_KEY=your-songkick-api-key
```

### 3. Deploy Supabase Edge Functions

```bash
# Deploy all scraper functions
supabase functions deploy scrape-concert-ua
supabase functions deploy scrape-kontramarka
supabase functions deploy scrape-karabas
supabase functions deploy scrape-ottry
```

### 4. Get API Keys

#### Bandsintown API
- Website: https://www.bandsintown.com/api/overview
- **Note:** Bandsintown allows using any app_id instead of requiring a formal API key
- Just use a unique identifier like `gigfinder_app`

#### Songkick API
- Website: https://www.songkick.com/developer
- Sign up and request API access
- Approval may take a few days

---

## Usage Examples

### Basic Usage

```typescript
import { getEventAggregator } from '@/lib/events';

// Get the aggregator instance
const aggregator = getEventAggregator();

// Fetch all events from all providers
const events = await aggregator.fetchAllEvents();

// Display events
console.log(`Found ${events.length} events`);
```

### Fetch Artist Events

```typescript
import { getEventAggregator } from '@/lib/events';

const aggregator = getEventAggregator();

// Fetch events for a specific artist from all providers
const artistEvents = await aggregator.fetchArtistEvents('Coldplay');

console.log(`Found ${artistEvents.length} Coldplay events`);
```

### Fetch Location Events

```typescript
import { getEventAggregator } from '@/lib/events';

const aggregator = getEventAggregator();

// Fetch events in Kyiv from all providers
const kyivEvents = await aggregator.fetchLocationEvents('Kyiv', 'Ukraine');

console.log(`Found ${kyivEvents.length} events in Kyiv`);
```

### Fetch from Specific Provider

```typescript
import { getEventAggregator, EventSource } from '@/lib/events';

const aggregator = getEventAggregator();

// Fetch only from Bandsintown
const bandsintownEvents = await aggregator.fetchFromProvider(
  EventSource.BANDSINTOWN,
  { artistName: 'Coldplay' }
);
```

### Health Check

```typescript
import { getEventAggregator } from '@/lib/events';

const aggregator = getEventAggregator();

// Check health of all providers
const healthStatus = await aggregator.healthCheckAll();

console.log('Provider Health:', healthStatus);
// Output: { bandsintown: true, songkick: true, concert_ua: false, ... }
```

### Error Handling

```typescript
import { getEventAggregator } from '@/lib/events';

const aggregator = getEventAggregator();

try {
  const events = await aggregator.fetchAllEvents();

  // Check for partial failures
  const errors = aggregator.getErrors();

  if (errors.length > 0) {
    console.warn('Some providers failed:');
    errors.forEach(err => {
      console.warn(`- ${err.source}: ${err.error.message}`);
    });
  }

  console.log(`Successfully fetched ${events.length} events`);
} catch (error) {
  console.error('Fatal error:', error);
}
```

### Cache Management

```typescript
import { getEventAggregator } from '@/lib/events';

const aggregator = getEventAggregator();

// Clear all cached events
aggregator.clearCache();

// Remove expired cache entries
aggregator.cleanupCache();

// Force refresh (bypass cache)
const freshEvents = await aggregator.fetchAllEvents();
aggregator.clearCache(); // Clear after fetching
```

---

## Provider Details

### 1. Bandsintown Provider

**Best for:** Artist-specific events, tour dates

**Features:**
- Artist calendar lookup
- Event details with lineup
- Ticket availability status
- Venue coordinates

**Limitations:**
- No direct location-based search
- Requires exact artist name match

**Example:**
```typescript
import { BandsintownProvider } from '@/lib/events';

const provider = new BandsintownProvider({
  apiKey: 'gigfinder_app',
  timeout: 10000,
});

const events = await provider.fetchArtistEvents('The Weeknd');
```

---

### 2. Songkick Provider

**Best for:** Location-based event discovery, metro area searches

**Features:**
- Metro area search
- Artist calendar
- Comprehensive venue data
- Multiple artist support (lineup)

**Limitations:**
- Requires API key approval
- Two-step search (find metro area ID first)

**Example:**
```typescript
import { SongkickProvider } from '@/lib/events';

const provider = new SongkickProvider({
  apiKey: 'your-api-key',
  timeout: 10000,
});

const kyivEvents = await provider.fetchLocationEvents('Kyiv', 'Ukraine');
```

---

### 3. Ukrainian Platform Scrapers

**Platforms:** Concert.ua, Kontramarka.ua, Karabas.com, Ottry.com

**Best for:** Ukrainian events, local ticket platforms

**Features:**
- Real-time web scraping via Puppeteer
- Direct ticket links
- UAH pricing
- Ukrainian language support

**Limitations:**
- Slower than API providers (scraping takes time)
- May break if platforms change their HTML structure
- No artist-specific search

**Example:**
```typescript
import { UkrainianScraperProvider, EventSource } from '@/lib/events';

const provider = new UkrainianScraperProvider(
  EventSource.CONCERT_UA,
  {
    baseUrl: 'https://your-project.supabase.co',
    apiKey: 'your-supabase-anon-key',
    timeout: 30000,
  }
);

const events = await provider.fetchLocationEvents('Kyiv');
```

---

## Frontend Integration

### Using the React Component

```tsx
import AggregatedEvents from '@/pages/AggregatedEvents';

function App() {
  return <AggregatedEvents />;
}
```

### Using the Event Card

```tsx
import AggregatedEventCard from '@/components/AggregatedEventCard';
import { Event } from '@/lib/events/types';

function MyComponent({ event }: { event: Event }) {
  return (
    <AggregatedEventCard
      event={event}
      onClick={() => console.log('Event clicked:', event.title)}
    />
  );
}
```

---

## Unified Event Schema

All providers return events in this unified format:

```typescript
interface Event {
  id: string;                    // Unique ID (source-externalId)
  title: string;                 // Event title
  artistName: string;            // Main artist name
  date: Date;                    // Event date/time
  venue: {
    name: string;                // Venue name
    city: string;                // City
    country: string;             // Country
    latitude?: number;           // Optional coordinates
    longitude?: number;
  };
  ticketUrl?: string;            // Link to buy tickets
  imageUrl?: string;             // Event/artist image
  price?: {
    min?: number;                // Minimum price
    max?: number;                // Maximum price
    currency: string;            // Currency (UAH, USD, etc.)
  };
  description?: string;          // Event description
  source: EventSource;           // Provider source
  externalId: string;            // Original platform ID
  tags?: string[];               // Artist tags/lineup
  genre?: string;                // Music genre
}
```

---

## Caching Strategy

### How It Works

1. **Cache Key Generation:** Unique key based on request type and parameters
2. **TTL:** Default 15 minutes (configurable)
3. **Storage:** In-memory Map (fast, session-based)
4. **Cleanup:** Automatic removal of expired entries

### Cache Keys

```
all:{params}           → All events from all providers
artist:{artistName}    → Artist-specific events
location:{city}        → Location-specific events
songkick:{params}      → Provider-specific cache
```

### Best Practices

- Use `clearCache()` when deploying new scrapers
- Call `cleanupCache()` periodically to free memory
- Disable cache during development: `enableCache: false`

---

## Error Handling

### Graceful Degradation

The aggregator continues even if some providers fail:

```typescript
// Provider 1: ✅ Success (50 events)
// Provider 2: ❌ Failed (network error)
// Provider 3: ✅ Success (30 events)
// Result: 80 events returned, errors logged
```

### Fail-Fast Mode

Enable if you want to stop on first error:

```typescript
const aggregator = new EventAggregatorService({
  failFast: true, // Throw error immediately
});
```

### Retry Logic

All providers automatically retry failed requests:

```typescript
const provider = new SongkickProvider({
  apiKey: 'key',
  maxRetries: 3, // Retry up to 3 times
});
```

**Retry Strategy:**
- 1st retry: 1 second delay
- 2nd retry: 2 seconds delay
- 3rd retry: 4 seconds delay

---

## Performance Optimization

### 1. Parallel Requests

The aggregator fetches from all providers simultaneously:

```typescript
// All providers called in parallel (not sequential)
const events = await aggregator.fetchAllEvents();
```

### 2. Caching

Cache reduces API calls by 90%+:

```typescript
// First call: Fetches from all providers (~5s)
const events1 = await aggregator.fetchAllEvents();

// Second call: Returns cached results (~5ms)
const events2 = await aggregator.fetchAllEvents();
```

### 3. Timeouts

Prevents slow providers from blocking others:

```typescript
const provider = new BandsintownProvider({
  timeout: 10000, // 10 second max
});
```

---

## Testing

### Test Individual Provider

```typescript
import { BandsintownProvider } from '@/lib/events';

const provider = new BandsintownProvider({
  apiKey: 'gigfinder_app',
});

// Test health
const healthy = await provider.healthCheck();
console.log('Bandsintown healthy:', healthy);

// Test fetch
const events = await provider.fetchArtistEvents('Coldplay');
console.log('Fetched events:', events.length);
```

### Test Aggregator

```typescript
import { getEventAggregator } from '@/lib/events';

const aggregator = getEventAggregator();

// Test all providers
const health = await aggregator.healthCheckAll();
console.log('Provider health:', health);

// Test fetch
const events = await aggregator.fetchAllEvents();
console.log('Total events:', events.length);

// Check errors
const errors = aggregator.getErrors();
console.log('Errors:', errors);
```

---

## Troubleshooting

### Issue: Bandsintown returns 403 Forbidden

**Cause:** Invalid API key or app_id

**Solution:**
```bash
# Use any string as app_id (no formal key needed)
VITE_BANDSINTOWN_API_KEY=gigfinder_app
```

### Issue: Songkick returns empty results

**Cause:** Artist/location not found, or API key not approved

**Solution:**
1. Check API key is valid
2. Try exact artist name (case-sensitive)
3. Wait for API key approval (can take days)

### Issue: Ukrainian scrapers timeout

**Cause:** Slow website response or changed HTML structure

**Solution:**
1. Increase timeout: `VITE_SCRAPER_TIMEOUT=60000`
2. Check Edge Function logs in Supabase dashboard
3. Update scraper selectors if HTML changed

### Issue: Cache not clearing

**Cause:** Using different aggregator instances

**Solution:**
```typescript
// Always use singleton
import { getEventAggregator } from '@/lib/events';

const aggregator = getEventAggregator(); // ✅ Same instance
```

### Issue: CORS errors from Edge Functions

**Cause:** Missing CORS headers or wrong Supabase URL

**Solution:**
1. Verify `VITE_SUPABASE_URL` in .env
2. Check Edge Function deployment
3. Test Edge Function directly in Supabase dashboard

---

## API Reference

### EventAggregatorService

```typescript
class EventAggregatorService {
  constructor(config?: AggregatorConfig)

  // Methods
  registerProvider(provider: IEventProvider): void
  fetchAllEvents(params?: EventQueryParams): Promise<Event[]>
  fetchFromProvider(source: EventSource, params?: EventQueryParams): Promise<Event[]>
  fetchArtistEvents(artistName: string): Promise<Event[]>
  fetchLocationEvents(city: string, country?: string): Promise<Event[]>
  healthCheckAll(): Promise<Record<EventSource, boolean>>
  getErrors(): EventProviderError[]
  clearCache(): void
  cleanupCache(): void
}
```

### Helper Functions

```typescript
// Get singleton instance
getEventAggregator(): EventAggregatorService

// Create new instance
createEventAggregator(): EventAggregatorService

// Reset singleton (for testing)
resetEventAggregator(): void
```

---

## Contributing

### Adding a New Provider

1. **Create provider class:**

```typescript
import { BaseEventProvider } from '../EventProvider';
import { EventSource } from '../types';

export class MyNewProvider extends BaseEventProvider {
  readonly source = EventSource.MY_NEW_SOURCE;

  async fetchEvents(params) {
    // Implementation
  }

  async fetchArtistEvents(artistName) {
    // Implementation
  }

  async fetchLocationEvents(city, country) {
    // Implementation
  }
}
```

2. **Register in aggregator:**

```typescript
// src/lib/events/index.ts
import { MyNewProvider } from './providers/MyNewProvider';

export function createEventAggregator() {
  const aggregator = new EventAggregatorService();

  const myProvider = new MyNewProvider({ apiKey: '...' });
  aggregator.registerProvider(myProvider);

  return aggregator;
}
```

3. **Add to EventSource enum:**

```typescript
// src/lib/events/types.ts
export enum EventSource {
  // ...existing
  MY_NEW_SOURCE = 'my_new_source',
}
```

---

## License

MIT

---

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check Supabase Edge Function logs
4. Open an issue on GitHub

---

**Happy Event Aggregating! 🎉**
