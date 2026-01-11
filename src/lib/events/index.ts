/**
 * Event Aggregation System - Main Export
 * Initialize and export the aggregator with all providers
 */

import { EventAggregatorService } from './EventAggregatorService';
import { BandsintownProvider } from './providers/BandsintownProvider';
import { SongkickProvider } from './providers/SongkickProvider';
import { UkrainianScraperProvider } from './providers/UkrainianScraperProvider';
import { EventSource } from './types';

export * from './types';
export * from './EventProvider';
export * from './EventAggregatorService';
export * from './providers/BandsintownProvider';
export * from './providers/SongkickProvider';
export * from './providers/UkrainianScraperProvider';

/**
 * Initialize the event aggregator with all providers
 */
export function createEventAggregator(): EventAggregatorService {
  const aggregator = new EventAggregatorService({
    cacheTTL: 15 * 60 * 1000, // 15 minutes
    enableCache: true,
    failFast: false, // Continue even if some providers fail
  });

  // Register Bandsintown (artist-focused)
  try {
    const bandsintownProvider = new BandsintownProvider({
      apiKey: import.meta.env.VITE_BANDSINTOWN_API_KEY,
      timeout: 10000,
    });
    aggregator.registerProvider(bandsintownProvider);
  } catch (error) {
    console.warn('Failed to initialize Bandsintown provider:', error);
  }

  // Register Songkick (location-focused)
  try {
    const songkickApiKey = import.meta.env.VITE_SONGKICK_API_KEY;
    if (songkickApiKey) {
      const songkickProvider = new SongkickProvider({
        apiKey: songkickApiKey,
        timeout: 10000,
      });
      aggregator.registerProvider(songkickProvider);
    } else {
      console.warn('Songkick API key not found - provider disabled');
    }
  } catch (error) {
    console.warn('Failed to initialize Songkick provider:', error);
  }

  // Register Ukrainian platforms (scrapers)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      // Concert.ua
      const concertUaProvider = new UkrainianScraperProvider(EventSource.CONCERT_UA, {
        baseUrl: supabaseUrl,
        apiKey: supabaseAnonKey,
        timeout: 30000,
      });
      aggregator.registerProvider(concertUaProvider);

      // Kontramarka.ua
      const kontramarkaProvider = new UkrainianScraperProvider(EventSource.KONTRAMARKA, {
        baseUrl: supabaseUrl,
        apiKey: supabaseAnonKey,
        timeout: 30000,
      });
      aggregator.registerProvider(kontramarkaProvider);

      // Karabas
      const karabasProvider = new UkrainianScraperProvider(EventSource.KARABAS, {
        baseUrl: supabaseUrl,
        apiKey: supabaseAnonKey,
        timeout: 30000,
      });
      aggregator.registerProvider(karabasProvider);

      // Ottry
      const ottryProvider = new UkrainianScraperProvider(EventSource.OTTRY, {
        baseUrl: supabaseUrl,
        apiKey: supabaseAnonKey,
        timeout: 30000,
      });
      aggregator.registerProvider(ottryProvider);
    } catch (error) {
      console.warn('Failed to initialize Ukrainian scrapers:', error);
    }
  } else {
    console.warn('Supabase credentials not found - Ukrainian scrapers disabled');
  }

  return aggregator;
}

/**
 * Singleton instance of the aggregator
 */
let aggregatorInstance: EventAggregatorService | null = null;

/**
 * Get the singleton aggregator instance
 */
export function getEventAggregator(): EventAggregatorService {
  if (!aggregatorInstance) {
    aggregatorInstance = createEventAggregator();
  }

  return aggregatorInstance;
}

/**
 * Reset the aggregator instance (useful for testing)
 */
export function resetEventAggregator(): void {
  aggregatorInstance = null;
}
