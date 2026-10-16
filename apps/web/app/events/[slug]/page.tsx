import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_URL, getEvent } from '../../lib/api';
import { CATEGORIES, formatPrice, formatWhen } from '../../lib/format';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const event = await getEvent((await params).slug);
  if (!event) return {};
  const description = event.description?.slice(0, 200);
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: { title: event.title, description, images: event.imageUrl ? [event.imageUrl] : undefined },
  };
}

export default async function EventPage({ params }: Params) {
  const event = await getEvent((await params).slug);
  if (!event) notFound();

  const place = event.location?.name ?? event.locationText;
  const price = formatPrice(event);
  const url = `${SITE_URL}/events/${event.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.startsAt,
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(event.description ? { description: event.description } : {}),
    ...(event.imageUrl ? { image: [event.imageUrl] } : {}),
    url,
    location: {
      '@type': 'Place',
      name: place ?? 'Переславль-Залесский',
      address: event.location?.address ?? 'Переславль-Залесский',
      ...(event.location?.lat != null && event.location.lng != null
        ? { geo: { '@type': 'GeoCoordinates', latitude: event.location.lat, longitude: event.location.lng } }
        : {}),
    },
    ...(event.isFree || event.priceFrom != null
      ? { offers: { '@type': 'Offer', price: event.isFree ? 0 : event.priceFrom, priceCurrency: 'RUB', url: event.ticketUrl ?? url } }
      : {}),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      {event.imageUrl && <img className="event-hero" src={event.imageUrl} alt="" />}
      <h1>{event.title}</h1>
      <div className="facts">
        <div><strong>Когда:</strong> {formatWhen(event.startsAt, event.endsAt)}</div>
        {place && (
          <div>
            <strong>Где:</strong>{' '}
            {event.location ? <a href={`/locations/${event.location.slug}`}>{event.location.name}</a> : place}
            {event.location?.address ? `, ${event.location.address}` : ''}
          </div>
        )}
        <div><strong>Категория:</strong> {CATEGORIES[event.category] ?? CATEGORIES.other}</div>
        {price && <div><strong>Цена:</strong> {price}</div>}
      </div>
      {event.description && <p className="description">{event.description}</p>}
      <div className="actions">
        {event.ticketUrl && <a className="btn primary" href={event.ticketUrl} rel="noopener">Билеты</a>}
        <a className="btn" href={`/events/${event.slug}/ics`}>В календарь</a>
      </div>
      {event.sources.length > 0 && (
        <p className="sources">
          Источник:{' '}
          {event.sources.map((s, i) => (
            <span key={i}>
              {i > 0 && ', '}
              {s.url ? <a href={s.url} rel="noopener nofollow">{s.source.name}</a> : s.source.name}
            </span>
          ))}
        </p>
      )}
    </article>
  );
}
