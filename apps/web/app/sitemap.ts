import type { MetadataRoute } from 'next';
import { SITE_URL, getEvents, getLocations } from './lib/api';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, locations] = await Promise.all([getEvents({ limit: 200 }), getLocations()]);
  return [
    { url: SITE_URL, changeFrequency: 'hourly' },
    ...locations.map((l) => ({ url: `${SITE_URL}/locations/${l.slug}`, changeFrequency: 'daily' as const })),
    ...events.map((e) => ({ url: `${SITE_URL}/events/${e.slug}`, lastModified: e.updatedAt })),
  ];
}
