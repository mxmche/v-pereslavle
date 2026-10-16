import type { PublicEvent } from './lib/api';
import { CATEGORIES, formatPrice, formatWhen } from './lib/format';

export function EventCard({ event }: { event: PublicEvent }) {
  const place = event.location?.name ?? event.locationText;
  const price = formatPrice(event);
  return (
    <li className="event-card">
      {event.imageUrl ? <img src={event.imageUrl} alt="" loading="lazy" /> : <div className="ph" />}
      <div className="body">
        <h2><a href={`/events/${event.slug}`}>{event.title}</a></h2>
        <div className="meta">{formatWhen(event.startsAt, event.endsAt)}</div>
        <div className="meta">
          {[CATEGORIES[event.category] ?? CATEGORIES.other, place, price].filter(Boolean).join(' · ')}
        </div>
      </div>
    </li>
  );
}
