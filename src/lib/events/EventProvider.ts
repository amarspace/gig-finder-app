/**
 * Event Provider Interface
 * All event providers must implement this interface
 */

import {
  Event,
  EventProviderConfig,
  EventProviderResponse,
  EventQueryParams,
  EventSource,
} from './types';

export interface IEventProvider {
  readonly source: EventSource;
  readonly config: EventProviderConfig;

  /**
   * Fetch events based on query parameters
   */
  fetchEvents(params: EventQueryParams): Promise<EventProviderResponse>;

  /**
   * Fetch events for a specific artist
   */
  fetchArtistEvents(artistName: string): Promise<Event[]>;

  /**
   * Fetch events for a specific location
   */
  fetchLocationEvents(city: string, country?: string): Promise<Event[]>;

  /**
   * Check if the provider is available/healthy
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Abstract base class for event providers
 * Implements common functionality like retries and error handling
 */
export abstract class BaseEventProvider implements IEventProvider {
  abstract readonly source: EventSource;
  protected readonly defaultTimeout = 10000; // 10 seconds
  protected readonly defaultMaxRetries = 3;

  constructor(public readonly config: EventProviderConfig) {}

  abstract fetchEvents(params: EventQueryParams): Promise<EventProviderResponse>;
  abstract fetchArtistEvents(artistName: string): Promise<Event[]>;
  abstract fetchLocationEvents(city: string, country?: string): Promise<Event[]>;

  async healthCheck(): Promise<boolean> {
    try {
      // Default implementation - override if provider has dedicated health endpoint
      const response = await this.fetchEvents({ limit: 1 });
      return response.events !== undefined;
    } catch (error) {
      console.error(`Health check failed for ${this.source}:`, error);
      return false;
    }
  }

  /**
   * Retry logic for failed requests
   */
  protected async retryRequest<T>(
    fn: () => Promise<T>,
    maxRetries = this.config.maxRetries || this.defaultMaxRetries
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} for ${this.source}`);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Sleep utility for retry delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with timeout
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = this.config.timeout || this.defaultTimeout
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Normalize date to ISO string
   */
  protected normalizeDate(date: string | Date): Date {
    return typeof date === 'string' ? new Date(date) : date;
  }

  /**
   * Generate unique event ID
   */
  protected generateEventId(source: EventSource, externalId: string): string {
    return `${source}-${externalId}`;
  }
}
