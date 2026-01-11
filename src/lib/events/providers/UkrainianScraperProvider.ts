/**
 * Ukrainian Ticket Platform Scraper Provider
 * Calls Supabase Edge Functions that scrape Ukrainian ticket platforms
 */

import { BaseEventProvider } from '../EventProvider';
import {
  Event,
  EventProviderConfig,
  EventProviderResponse,
  EventQueryParams,
  EventSource,
} from '../types';

interface ScrapedEvent {
  id: string;
  title: string;
  artistName: string;
  date: string;
  venue: string;
  city: string;
  ticketUrl: string;
  imageUrl?: string;
  price?: string;
  source: string;
}

interface ScraperResponse {
  success: boolean;
  events: ScrapedEvent[];
  count: number;
  source: string;
  timestamp: string;
  error?: string;
}

export class UkrainianScraperProvider extends BaseEventProvider {
  readonly source: EventSource;
  private readonly scraperFunctionUrl: string;

  constructor(source: EventSource, config: EventProviderConfig) {
    super(config);
    this.source = source;

    // Map source to Supabase Edge Function URL
    const functionName = this.getFunctionName(source);
    const supabaseUrl = config.baseUrl || process.env.VITE_SUPABASE_URL;
    this.scraperFunctionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
  }

  private getFunctionName(source: EventSource): string {
    const functionMap: Record<string, string> = {
      [EventSource.CONCERT_UA]: 'scrape-concert-ua',
      [EventSource.KONTRAMARKA]: 'scrape-kontramarka',
      [EventSource.KARABAS]: 'scrape-karabas',
      [EventSource.OTTRY]: 'scrape-ottry',
    };

    return functionMap[source] || 'scrape-concert-ua';
  }

  async fetchEvents(params: EventQueryParams): Promise<EventProviderResponse> {
    const events = await this.scrapeEvents(params.city);
    return {
      events,
      totalCount: events.length,
      hasMore: false,
    };
  }

  async fetchArtistEvents(artistName: string): Promise<Event[]> {
    // Ukrainian scrapers don't support artist-specific queries
    // Return all events and filter locally
    const allEvents = await this.scrapeEvents();
    return allEvents.filter(event =>
      event.artistName.toLowerCase().includes(artistName.toLowerCase())
    );
  }

  async fetchLocationEvents(city: string, country?: string): Promise<Event[]> {
    return this.scrapeEvents(city);
  }

  /**
   * Call the scraper Edge Function
   */
  private async scrapeEvents(city?: string): Promise<Event[]> {
    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(
        this.scraperFunctionUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey || ''}`,
          },
          body: JSON.stringify({ city }),
        },
        30000 // 30 second timeout for scraping
      );

      const data: ScraperResponse = await response.json();

      if (!data.success || !data.events) {
        throw new Error(data.error || 'Scraper returned no events');
      }

      return data.events.map(event => this.transformScrapedEvent(event));
    });
  }

  /**
   * Transform scraped event to unified Event schema
   */
  private transformScrapedEvent(scrapedEvent: ScrapedEvent): Event {
    return {
      id: this.generateEventId(this.source, scrapedEvent.id),
      title: scrapedEvent.title,
      artistName: scrapedEvent.artistName,
      date: this.parseUkrainianDate(scrapedEvent.date),
      venue: {
        name: scrapedEvent.venue,
        city: scrapedEvent.city,
        country: 'Ukraine',
      },
      ticketUrl: scrapedEvent.ticketUrl,
      imageUrl: scrapedEvent.imageUrl,
      price: scrapedEvent.price
        ? {
            min: this.parsePrice(scrapedEvent.price),
            currency: 'UAH',
          }
        : undefined,
      source: this.source,
      externalId: scrapedEvent.id,
    };
  }

  /**
   * Parse Ukrainian date formats
   */
  private parseUkrainianDate(dateStr: string): Date {
    try {
      // Handle various Ukrainian date formats
      // e.g., "15 лютого 2024", "15.02.2024", "2024-02-15"

      // Try ISO format first
      if (dateStr.includes('-') || dateStr.includes('T')) {
        return new Date(dateStr);
      }

      // Ukrainian month names mapping
      const ukrainianMonths: Record<string, number> = {
        'січня': 0, 'січ': 0,
        'лютого': 1, 'лют': 1,
        'березня': 2, 'бер': 2,
        'квітня': 3, 'кві': 3,
        'травня': 4, 'тра': 4,
        'червня': 5, 'чер': 5,
        'липня': 6, 'лип': 6,
        'серпня': 7, 'сер': 7,
        'вересня': 8, 'вер': 8,
        'жовтня': 9, 'жов': 9,
        'листопада': 10, 'лис': 10,
        'грудня': 11, 'гру': 11,
      };

      for (const [monthName, monthIndex] of Object.entries(ukrainianMonths)) {
        if (dateStr.toLowerCase().includes(monthName)) {
          const parts = dateStr.match(/(\d+)\s+\w+\s+(\d{4})/);
          if (parts) {
            const day = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            return new Date(year, monthIndex, day);
          }
        }
      }

      // Try standard parsing as fallback
      return new Date(dateStr);
    } catch (error) {
      console.error('Failed to parse Ukrainian date:', dateStr);
      return new Date();
    }
  }

  /**
   * Parse price from string (e.g., "від 500 грн")
   */
  private parsePrice(priceStr: string): number | undefined {
    const match = priceStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const events = await this.scrapeEvents();
      return events.length >= 0; // Even 0 events means scraper is working
    } catch (error) {
      console.error(`Health check failed for ${this.source}:`, error);
      return false;
    }
  }
}
