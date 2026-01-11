/**
 * Aggregated Events Page
 * Displays events from all providers with filtering
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, Search, RefreshCw, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AggregatedEventCard from '@/components/AggregatedEventCard';
import { getEventAggregator } from '@/lib/events';
import { Event, EventSource } from '@/lib/events/types';

const AggregatedEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<EventSource | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [errors, setErrors] = useState<string[]>([]);

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Filter events when search/filters change
  useEffect(() => {
    filterEvents();
  }, [searchQuery, selectedSource, selectedCity, events]);

  const loadEvents = async (forceRefresh = false) => {
    setLoading(true);
    setErrors([]);

    try {
      const aggregator = getEventAggregator();

      // Clear cache if force refresh
      if (forceRefresh) {
        aggregator.clearCache();
      }

      // Fetch events from all providers
      const allEvents = await aggregator.fetchAllEvents();

      setEvents(allEvents);
      setFilteredEvents(allEvents);

      // Check for errors
      const providerErrors = aggregator.getErrors();
      if (providerErrors.length > 0) {
        setErrors(
          providerErrors.map(
            (err) => `${err.source}: ${err.error.message}`
          )
        );
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      setErrors(['Failed to load events. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.artistName.toLowerCase().includes(query) ||
          event.venue.name.toLowerCase().includes(query) ||
          event.venue.city.toLowerCase().includes(query)
      );
    }

    // Filter by source
    if (selectedSource !== 'all') {
      filtered = filtered.filter((event) => event.source === selectedSource);
    }

    // Filter by city
    if (selectedCity !== 'all') {
      filtered = filtered.filter((event) => event.venue.city === selectedCity);
    }

    setFilteredEvents(filtered);
  };

  const handleRefresh = () => {
    loadEvents(true);
  };

  const handleEventClick = (event: Event) => {
    // Open ticket URL in new tab
    if (event.ticketUrl) {
      window.open(event.ticketUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Get unique cities for filter
  const uniqueCities = Array.from(
    new Set(events.map((event) => event.venue.city))
  ).sort();

  const allSources = Object.values(EventSource);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 px-5 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">All Events</h1>
            <p className="text-xs text-muted-foreground">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              {events.length !== filteredEvents.length &&
                ` (filtered from ${events.length})`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 pb-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search events, artists, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 pb-4 space-y-2">
          {/* Source Filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedSource('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedSource === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              All Sources
            </button>
            {allSources.map((source) => (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedSource === source
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {source.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* City Filter */}
          {uniqueCities.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedCity('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCity === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                All Cities
              </button>
              {uniqueCities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCity === city
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="px-5 pb-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-xs font-medium text-destructive mb-1">
                Some providers failed:
              </p>
              {errors.map((error, index) => (
                <p key={index} className="text-xs text-destructive/80">
                  • {error}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pt-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-96 bg-muted rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Filter size={48} className="text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">
              No events found
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {searchQuery || selectedSource !== 'all' || selectedCity !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'No events available at the moment. Check back later!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <AggregatedEventCard
                key={event.id}
                event={event}
                onClick={() => handleEventClick(event)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AggregatedEvents;
