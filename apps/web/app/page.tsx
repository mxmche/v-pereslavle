import { EventCard } from './event-card';
import { getEvents, getLocations } from './lib/api';
import { CATEGORIES, WHEN_OPTIONS, whenRange } from './lib/format';

type Search = { when?: string; category?: string; location?: string };

function href(current: Search, patch: Search) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) if (v && v !== 'all') params.set(k, v);
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

export default async function HomePage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const when = search.when ?? 'all';
  const [events, locations] = await Promise.all([
    getEvents({ ...whenRange(when), category: search.category, location: search.location, limit: 100 }),
    getLocations(),
  ]);

  return (
    <>
      <h1>Афиша Переславля</h1>
      <nav className="filters" aria-label="Когда">
        {WHEN_OPTIONS.map((o) => (
          <a key={o.key} className="chip" href={href(search, { when: o.key })} aria-current={when === o.key}>{o.label}</a>
        ))}
      </nav>
      <nav className="filters" aria-label="Категория">
        <a className="chip" href={href(search, { category: '' })} aria-current={!search.category}>Все категории</a>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <a key={key} className="chip" href={href(search, { category: key })} aria-current={search.category === key}>{label}</a>
        ))}
      </nav>
      {locations.length > 0 && (
        <nav className="filters" aria-label="Площадка">
          <a className="chip" href={href(search, { location: '' })} aria-current={!search.location}>Все площадки</a>
          {locations.slice(0, 12).map((l) => (
            <a key={l.slug} className="chip" href={href(search, { location: l.slug })} aria-current={search.location === l.slug}>{l.name}</a>
          ))}
        </nav>
      )}
      {events.length === 0 ? (
        <p className="empty">Подходящих событий пока нет.</p>
      ) : (
        <ul className="events">{events.map((e) => <EventCard key={e.id} event={e} />)}</ul>
      )}
    </>
  );
}
