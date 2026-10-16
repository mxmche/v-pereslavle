import type { Prisma } from '@vp/db';

export interface EventsFilter {
  from?: string;
  to?: string;
  category?: string;
  location?: string; // location slug
}

const validDate = (s?: string) => {
  const d = s ? new Date(s) : undefined;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
};

const MSK_OFFSET_MS = 3 * 3600_000;

/** Midnight of the current Moscow day: date-only events start at 00:00 and must stay listed all day. */
export function startOfMskDay(now = new Date()): Date {
  const msk = new Date(now.getTime() + MSK_OFFSET_MS);
  return new Date(Date.UTC(msk.getUTCFullYear(), msk.getUTCMonth(), msk.getUTCDate()) - MSK_OFFSET_MS);
}

/**
 * Published events overlapping [from, to). `from` defaults to the start of today (MSK);
 * an event without endsAt counts as a single instant at startsAt.
 */
export function buildPublicWhere(f: EventsFilter, now = new Date()): Prisma.EventWhereInput {
  const from = validDate(f.from) ?? startOfMskDay(now);
  const to = validDate(f.to);
  const and: Prisma.EventWhereInput[] = [
    { OR: [{ endsAt: { gte: from } }, { endsAt: null, startsAt: { gte: from } }] },
  ];
  if (to) and.push({ startsAt: { lt: to } });
  if (f.category) and.push({ category: f.category });
  if (f.location) and.push({ location: { slug: f.location } });
  return { status: 'PUBLISHED', AND: and };
}
