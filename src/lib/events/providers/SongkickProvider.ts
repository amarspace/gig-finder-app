/**
 * Songkick API Provider
 * Documentation: https://www.songkick.com/developer
 */

import { BaseEventProvider } from '../EventProvider';
import {
  Event,
  EventProviderConfig,
  EventProviderResponse,
  EventQueryParams,
  EventSource,
} from '../types';

interface SongkickEvent {
  id: number;
  displayName: string;
  type: string;
  uri: string;
  status: string;
  start: {
    date: string;
    datetime: string;
    time: string;
  };
  performance: Array<{
    id: number;
    displayName: string;
    billing: string;
    artist: {
      id: number;
      displayName: string;
      uri: string;
    };
  }>;
  venue: {
    id: number;
    displayName: string;
    uri: string;
    lat: number;
    lng: number;
    metroArea: {
      displayName: string;
      country: {
        displayName: string;
      };
    };
  };
  location: {
    city: string;
    lat: number;
    lng: number;
  };
  ageRestriction?: string;
}

interface SongkickResponse {
  resultsPage: {
    status: string;
    results: {
      event?: SongkickEvent[];
    };
    totalEntries: number;
    perPage: number;
    page: number;
  };
}

export class SongkickProvider extends BaseEventProvider {
  readonly source = EventSource.SONGKICK;
  private readonly baseUrl = 'https://api.songkick.com/api/3.0';
  private readonly apiKey: string;

  constructor(config: EventProviderConfig) {
    super(config);

    if (!config.apiKey) {
      throw new Error('Songkick API key is required');
    }

    this.apiKey = config.apiKey;
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

    throw new Error('Songkick requires either artistName or location parameter');
  }

  /**
   * Fetch events for a specific artist
   */
  async fetchArtistEvents(artistName: string): Promise<Event[]> {
    // Step 1: Search for artist ID
    const artistId = await this.searchArtist(artistName);

    if (!artistId) {
      console.warn(`Artist not found on Songkick: ${artistName}`);
      return [];
    }

    // Step 2: Fetch artist events
    const url = `${this.baseUrl}/artists/${artistId}/calendar.json?apikey=${this.apiKey}`;

    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(url);
      const data: SongkickResponse = await response.json();

      const events = data.resultsPage.results.event || [];
      return events.map(event => this.transformEvent(event));
    });
  }

  /**
   * Fetch events by location (city-based search)
   */
  async fetchLocationEvents(city: string, country?: string): Promise<Event[]> {
    // Step 1: Get metro area ID
    const metroAreaId = await this.searchMetroArea(city, country);

    if (!metroAreaId) {
      console.warn(`Metro area not found on Songkick: ${city}`);
      return [];
    }

    // Step 2: Fetch events for metro area
    const url = `${this.baseUrl}/metro_areas/${metroAreaId}/calendar.json?apikey=${this.apiKey}`;

    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(url);
      const data: SongkickResponse = await response.json();

      const events = data.resultsPage.results.event || [];
      return events.map(event => this.transformEvent(event));
    });
  }

  /**
   * Search for artist and return artist ID
   */
  private async searchArtist(artistName: string): Promise<number | null> {
    const encodedArtist = encodeURIComponent(artistName);
    const url = `${this.baseUrl}/search/artists.json?apikey=${this.apiKey}&query=${encodedArtist}`;

    try {
      const response = await this.fetchWithTimeout(url);
      const data: any = await response.json();

      const artists = data.resultsPage.results.artist || [];
      if (artists.length === 0) return null;

      // Return first match (most relevant)
      return artists[0].id;
    } catch (error) {
      console.error(`Failed to search artist ${artistName}:`, error);
      return null;
    }
  }

  /**
   * Search for metro area and return metro area ID
   */
  private async searchMetroArea(city: string, country?: string): Promise<number | null> {
    const query = country ? `${city}, ${country}` : city;
    const encodedQuery = encodeURIComponent(query);
    const url = `${this.baseUrl}/search/locations.json?apikey=${this.apiKey}&query=${encodedQuery}`;

    try {
      const response = await this.fetchWithTimeout(url);
      const data: any = await response.json();

      const locations = data.resultsPage.results.location || [];
      if (locations.length === 0) return null;

      // Return first match
      return locations[0].metroArea.id;
    } catch (error) {
      console.error(`Failed to search metro area ${city}:`, error);
      return null;
    }
  }

  /**
   * Transform Songkick event to unified Event schema
   */
  private transformEvent(songkickEvent: SongkickEvent): Event {
    const headliner = songkickEvent.performance.find(p => p.billing === 'headline');
    const artistName = headliner?.artist.displayName || songkickEvent.performance[0]?.artist.displayName;

    return {
      id: this.generateEventId(this.source, songkickEvent.id.toString()),
      title: songkickEvent.displayName,
      artistName,
      date: this.normalizeDate(songkickEvent.start.datetime || songkickEvent.start.date),
      venue: {
        name: songkickEvent.venue.displayName,
        city: songkickEvent.venue.metroArea.displayName,
        country: songkickEvent.venue.metroArea.country.displayName,
        latitude: songkickEvent.venue.lat,
        longitude: songkickEvent.venue.lng,
      },
      ticketUrl: songkickEvent.uri,
      source: this.source,
      externalId: songkickEvent.id.toString(),
      tags: songkickEvent.performance.map(p => p.artist.displayName),
    };
  }

  /**
   * Health check for Songkick API
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple location search
      const url = `${this.baseUrl}/search/locations.json?apikey=${this.apiKey}&query=kyiv`;
      const response = await this.fetchWithTimeout(url);
      const data: any = await response.json();

      return data.resultsPage.status === 'ok';
    } catch (error) {
      console.error('Songkick health check failed:', error);
      return false;
    }
  }
}
