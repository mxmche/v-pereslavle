const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export interface EventLocation {
  slug: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  locationText: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  isFree: boolean | null;
  category: string;
  imageUrl: string | null;
  ticketUrl: string | null;
  updatedAt: string;
  location: EventLocation | null;
  sources: { url: string | null; source: { name: string } }[];
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 300, tags: ['events'] } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    // API unreachable (e.g. during `next build` without a backend) → render an empty state
    console.error(err);
    return null;
  }
}

export interface EventsQuery {
  from?: string;
  to?: string;
  category?: string;
  location?: string;
  limit?: number;
}

export async function getEvents(q: EventsQuery = {}): Promise<PublicEvent[]> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '') params.set(k, String(v));
  return (await get<PublicEvent[]>(`/events?${params}`)) ?? [];
}

export const getEvent = (slug: string) => get<PublicEvent>(`/events/${encodeURIComponent(slug)}`);
export const getLocations = async () => (await get<EventLocation[]>('/locations')) ?? [];
export const getLocation = (slug: string) => get<EventLocation & { aliases: string[] }>(`/locations/${encodeURIComponent(slug)}`);

export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';
