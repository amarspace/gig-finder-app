/**
 * Aggregated Event Card Component
 * Displays an event from any provider in a unified format
 */

import { format } from 'date-fns';
import { Calendar, MapPin, ExternalLink, Ticket } from 'lucide-react';
import { Event, EventSource } from '@/lib/events/types';

interface AggregatedEventCardProps {
  event: Event;
  onClick?: () => void;
}

const AggregatedEventCard = ({ event, onClick }: AggregatedEventCardProps) => {
  const formattedDate = format(event.date, 'MMM d, yyyy');
  const formattedTime = format(event.date, 'HH:mm');

  const getSourceBadgeColor = (source: EventSource): string => {
    const colors: Record<EventSource, string> = {
      [EventSource.BANDSINTOWN]: 'bg-blue-500',
      [EventSource.SONGKICK]: 'bg-green-500',
      [EventSource.CONCERT_UA]: 'bg-yellow-500',
      [EventSource.KONTRAMARKA]: 'bg-purple-500',
      [EventSource.KARABAS]: 'bg-pink-500',
      [EventSource.OTTRY]: 'bg-orange-500',
    };

    return colors[source] || 'bg-gray-500';
  };

  const getSourceLabel = (source: EventSource): string => {
    const labels: Record<EventSource, string> = {
      [EventSource.BANDSINTOWN]: 'Bandsintown',
      [EventSource.SONGKICK]: 'Songkick',
      [EventSource.CONCERT_UA]: 'Concert.ua',
      [EventSource.KONTRAMARKA]: 'Kontramarka',
      [EventSource.KARABAS]: 'Karabas',
      [EventSource.OTTRY]: 'Ottry',
    };

    return labels[source] || source;
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-border"
    >
      {/* Image */}
      {event.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80';
            }}
          />

          {/* Source Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`${getSourceBadgeColor(event.source)} text-white text-xs font-semibold px-2 py-1 rounded-full`}
            >
              {getSourceLabel(event.source)}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Artist */}
        <div>
          <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            {event.artistName}
          </p>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={16} className="text-primary" />
          <span>
            {formattedDate} • {formattedTime}
          </span>
        </div>

        {/* Venue & Location */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-foreground">{event.venue.name}</p>
            <p className="text-xs">
              {event.venue.city}, {event.venue.country}
            </p>
          </div>
        </div>

        {/* Price */}
        {event.price && (
          <div className="flex items-center gap-2 text-sm">
            <Ticket size={16} className="text-primary" />
            <span className="font-semibold text-foreground">
              {event.price.min
                ? `від ${event.price.min} ${event.price.currency}`
                : event.price.currency}
            </span>
          </div>
        )}

        {/* Ticket Link */}
        {event.ticketUrl && (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 w-full mt-4 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Ticket size={16} />
            Buy Tickets
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
};

export default AggregatedEventCard;
