import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventCard } from '../../event-card';
import { getEvents, getLocation } from '../../lib/api';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const location = await getLocation((await params).slug);
  return location ? { title: location.name, alternates: { canonical: `/locations/${location.slug}` } } : {};
}

export default async function LocationPage({ params }: Params) {
  const { slug } = await params;
  const [location, events] = await Promise.all([getLocation(slug), getEvents({ location: slug, limit: 100 })]);
  if (!location) notFound();
  return (
    <>
      <h1>{location.name}</h1>
      {location.address && <p className="meta">{location.address}</p>}
      <h2>Ближайшие события</h2>
      {events.length === 0 ? (
        <p className="empty">Событий пока нет.</p>
      ) : (
        <ul className="events">{events.map((e) => <EventCard key={e.id} event={e} />)}</ul>
      )}
    </>
  );
}
