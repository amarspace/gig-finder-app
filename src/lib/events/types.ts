/**
 * Event Aggregation System - Core Types
 * Unified schema for events from multiple sources
 */

export interface Event {
  id: string;
  title: string;
  artistName: string;
  date: Date;
  venue: {
    name: string;
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  ticketUrl?: string;
  imageUrl?: string;
  price?: {
    min?: number;
    max?: number;
    currency: string;
  };
  description?: string;
  source: EventSource;
  externalId: string; // Original ID from the source platform
  tags?: string[];
  genre?: string;
}

export enum EventSource {
  BANDSINTOWN = 'bandsintown',
  SONGKICK = 'songkick',
  CONCERT_UA = 'concert_ua',
  KONTRAMARKA = 'kontramarka',
  KARABAS = 'karabas',
  OTTRY = 'ottry',
}

export interface EventProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface EventQueryParams {
  artistName?: string;
  location?: string;
  city?: string;
  country?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface EventProviderResponse {
  events: Event[];
  totalCount?: number;
  hasMore?: boolean;
  nextPage?: string | number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface EventProviderError {
  source: EventSource;
  error: Error;
  timestamp: Date;
}
