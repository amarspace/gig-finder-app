/**
 * Event Aggregator Service
 * Aggregates events from multiple providers with caching and error handling
 */

import { IEventProvider } from './EventProvider';
import {
  Event,
  EventQueryParams,
  EventProviderError,
  EventSource,
  CacheEntry,
} from './types';

interface AggregatorConfig {
  cacheTTL?: number; // Cache time-to-live in milliseconds (default: 15 minutes)
  enableCache?: boolean;
  failFast?: boolean; // If true, throw error on first provider failure
}

export class EventAggregatorService {
  private providers: Map<EventSource, IEventProvider> = new Map();
  private cache: Map<string, CacheEntry<Event[]>> = new Map();
  private errors: EventProviderError[] = [];
  private readonly defaultCacheTTL = 15 * 60 * 1000; // 15 minutes

  constructor(private config: AggregatorConfig = {}) {
    this.config.cacheTTL = config.cacheTTL || this.defaultCacheTTL;
    this.config.enableCache = config.enableCache !== false; // Default true
    this.config.failFast = config.failFast || false;
  }

  /**
   * Register an event provider
   */
  registerProvider(provider: IEventProvider): void {
    this.providers.set(provider.source, provider);
    console.log(`Registered provider: ${provider.source}`);
  }

  /**
   * Get all registered providers
   */
  getProviders(): IEventProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Fetch events from all providers
   */
  async fetchAllEvents(params: EventQueryParams = {}): Promise<Event[]> {
    const cacheKey = this.generateCacheKey('all', params);

    // Check cache first
    if (this.config.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('Returning cached events');
        return cached;
      }
    }

    // Fetch from all providers in parallel
    const allEvents: Event[] = [];
    this.errors = []; // Reset errors

    const promises = Array.from(this.providers.values()).map(async provider => {
      try {
        console.log(`Fetching events from ${provider.source}...`);
        const response = await provider.fetchEvents(params);
        return response.events;
      } catch (error) {
        console.error(`Error fetching from ${provider.source}:`, error);

        this.errors.push({
          source: provider.source,
          error: error instanceof Error ? error : new Error(String(error)),
          timestamp: new Date(),
        });

        if (this.config.failFast) {
          throw error;
        }

        return []; // Return empty array on error (graceful degradation)
      }
    });

    const results = await Promise.all(promises);

    // Flatten and deduplicate
    for (const events of results) {
      allEvents.push(...events);
    }

    const uniqueEvents = this.deduplicateEvents(allEvents);
    const sortedEvents = this.sortEventsByDate(uniqueEvents);

    // Cache the results
    if (this.config.enableCache) {
      this.setCache(cacheKey, sortedEvents);
    }

    return sortedEvents;
  }

  /**
   * Fetch events from a specific provider
   */
  async fetchFromProvider(
    source: EventSource,
    params: EventQueryParams = {}
  ): Promise<Event[]> {
    const provider = this.providers.get(source);

    if (!provider) {
      throw new Error(`Provider ${source} not registered`);
    }

    const cacheKey = this.generateCacheKey(source, params);

    // Check cache
    if (this.config.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch from provider
    const response = await provider.fetchEvents(params);

    // Cache results
    if (this.config.enableCache) {
      this.setCache(cacheKey, response.events);
    }

    return response.events;
  }

  /**
   * Fetch artist events from all providers
   */
  async fetchArtistEvents(artistName: string): Promise<Event[]> {
    const cacheKey = this.generateCacheKey('artist', { artistName });

    if (this.config.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const allEvents: Event[] = [];
    this.errors = [];

    const promises = Array.from(this.providers.values()).map(async provider => {
      try {
        return await provider.fetchArtistEvents(artistName);
      } catch (error) {
        console.error(`Error fetching artist events from ${provider.source}:`, error);

        this.errors.push({
          source: provider.source,
          error: error instanceof Error ? error : new Error(String(error)),
          timestamp: new Date(),
        });

        return [];
      }
    });

    const results = await Promise.all(promises);

    for (const events of results) {
      allEvents.push(...events);
    }

    const uniqueEvents = this.deduplicateEvents(allEvents);
    const sortedEvents = this.sortEventsByDate(uniqueEvents);

    if (this.config.enableCache) {
      this.setCache(cacheKey, sortedEvents);
    }

    return sortedEvents;
  }

  /**
   * Fetch location events from all providers
   */
  async fetchLocationEvents(city: string, country?: string): Promise<Event[]> {
    const cacheKey = this.generateCacheKey('location', { city, country });

    if (this.config.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const allEvents: Event[] = [];
    this.errors = [];

    const promises = Array.from(this.providers.values()).map(async provider => {
      try {
        return await provider.fetchLocationEvents(city, country);
      } catch (error) {
        console.error(`Error fetching location events from ${provider.source}:`, error);

        this.errors.push({
          source: provider.source,
          error: error instanceof Error ? error : new Error(String(error)),
          timestamp: new Date(),
        });

        return [];
      }
    });

    const results = await Promise.all(promises);

    for (const events of results) {
      allEvents.push(...events);
    }

    const uniqueEvents = this.deduplicateEvents(allEvents);
    const sortedEvents = this.sortEventsByDate(uniqueEvents);

    if (this.config.enableCache) {
      this.setCache(cacheKey, sortedEvents);
    }

    return sortedEvents;
  }

  /**
   * Health check all providers
   */
  async healthCheckAll(): Promise<Record<EventSource, boolean>> {
    const results: Partial<Record<EventSource, boolean>> = {};

    const promises = Array.from(this.providers.entries()).map(async ([source, provider]) => {
      const isHealthy = await provider.healthCheck();
      results[source] = isHealthy;
    });

    await Promise.all(promises);

    return results as Record<EventSource, boolean>;
  }

  /**
   * Get recent errors
   */
  getErrors(): EventProviderError[] {
    return this.errors;
  }

  /**
   * Clear all cached events
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  /**
   * Remove expired cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`Removed ${removed} expired cache entries`);
    }
  }

  /**
   * Get cached events
   */
  private getFromCache(key: string): Event[] | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry
   */
  private setCache(key: string, data: Event[]): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (this.config.cacheTTL || this.defaultCacheTTL),
    });
  }

  /**
   * Generate cache key from params
   */
  private generateCacheKey(type: string, params: any = {}): string {
    return `${type}:${JSON.stringify(params)}`;
  }

  /**
   * Deduplicate events based on external ID and source
   */
  private deduplicateEvents(events: Event[]): Event[] {
    const seen = new Set<string>();
    const unique: Event[] = [];

    for (const event of events) {
      const key = `${event.source}-${event.externalId}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(event);
      }
    }

    return unique;
  }

  /**
   * Sort events by date (earliest first)
   */
  private sortEventsByDate(events: Event[]): Event[] {
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
