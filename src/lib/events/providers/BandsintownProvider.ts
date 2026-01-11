/**
 * Bandsintown API Provider
 * Documentation: https://www.bandsintown.com/api/overview
 */

import { BaseEventProvider } from '../EventProvider';
import {
  Event,
  EventProviderConfig,
  EventProviderResponse,
  EventQueryParams,
  EventSource,
} from '../types';

interface BandsintownEvent {
  id: string;
  artist_id: string;
  url: string;
  on_sale_datetime: string;
  datetime: string;
  description: string;
  venue: {
    name: string;
    latitude: string;
    longitude: string;
    city: string;
    region: string;
    country: string;
  };
  offers: Array<{
    type: string;
    url: string;
    status: string;
  }>;
  lineup: string[];
  title?: string;
}

interface BandsintownArtist {
  id: string;
  name: string;
  url: string;
  image_url: string;
  thumb_url: string;
  facebook_page_url?: string;
  mbid?: string;
  tracker_count: number;
  upcoming_event_count: number;
}

export class BandsintownProvider extends BaseEventProvider {
  readonly source = EventSource.BANDSINTOWN;
  private readonly baseUrl = 'https://rest.bandsintown.com';
  private readonly appId: string;

  constructor(config: EventProviderConfig) {
    super(config);
    this.appId = config.apiKey || 'gigfinder_app';
  }

  /**
   * Fetch events with generic query parameters
   */
  async fetchEvents(params: EventQueryParams): Promise<EventProviderResponse> {
    if (params.artistName) {
      const events = await this.fetchArtistEvents(params.artistName);
      return {
        events,
        totalCount: events.length,
        hasMore: false,
      };
    }

    if (params.location || params.city) {
      const location = params.city || params.location || '';
      const events = await this.fetchLocationEvents(location, params.country);
      return {
        events,
        totalCount: events.length,
        hasMore: false,
      };
    }

    throw new Error('Bandsintown requires either artistName or location parameter');
  }

  /**
   * Fetch events for a specific artist
   */
  async fetchArtistEvents(artistName: string): Promise<Event[]> {
    const encodedArtist = encodeURIComponent(artistName);
    const url = `${this.baseUrl}/artists/${encodedArtist}/events?app_id=${this.appId}`;

    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(url);
      const bandsintownEvents: BandsintownEvent[] = await response.json();

      return bandsintownEvents.map(event => this.transformEvent(event, artistName));
    });
  }

  /**
   * Fetch events by location
   * Note: Bandsintown doesn't have a direct location search endpoint
   * This is a workaround using artist search + filtering
   */
  async fetchLocationEvents(city: string, country?: string): Promise<Event[]> {
    // Bandsintown's API is primarily artist-focused
    // For location-based search, we'd need to query popular artists
    // This is a limitation of their API - consider using Songkick for location-based queries
    console.warn('Bandsintown location-based search is limited. Consider using Songkick.');
    return [];
  }

  /**
   * Get artist information (useful for enrichment)
   */
  async getArtistInfo(artistName: string): Promise<BandsintownArtist | null> {
    const encodedArtist = encodeURIComponent(artistName);
    const url = `${this.baseUrl}/artists/${encodedArtist}?app_id=${this.appId}`;

    try {
      const response = await this.fetchWithTimeout(url);
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch artist info for ${artistName}:`, error);
      return null;
    }
  }

  /**
   * Transform Bandsintown event to unified Event schema
   */
  private transformEvent(bandsintownEvent: BandsintownEvent, artistName: string): Event {
    const ticketOffer = bandsintownEvent.offers?.find(
      offer => offer.type === 'Tickets' && offer.status === 'available'
    );

    return {
      id: this.generateEventId(this.source, bandsintownEvent.id),
      title: bandsintownEvent.title || `${artistName} Live`,
      artistName,
      date: this.normalizeDate(bandsintownEvent.datetime),
      venue: {
        name: bandsintownEvent.venue.name,
        city: bandsintownEvent.venue.city,
        country: bandsintownEvent.venue.country,
        latitude: parseFloat(bandsintownEvent.venue.latitude),
        longitude: parseFloat(bandsintownEvent.venue.longitude),
      },
      ticketUrl: ticketOffer?.url || bandsintownEvent.url,
      description: bandsintownEvent.description,
      source: this.source,
      externalId: bandsintownEvent.id,
      tags: bandsintownEvent.lineup || [artistName],
    };
  }

  /**
   * Health check for Bandsintown API
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a well-known artist
      const events = await this.fetchArtistEvents('Coldplay');
      return Array.isArray(events);
    } catch (error) {
      console.error('Bandsintown health check failed:', error);
      return false;
    }
  }
}
