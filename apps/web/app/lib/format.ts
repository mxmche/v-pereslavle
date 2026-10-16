export const CATEGORIES: Record<string, string> = {
  concert: 'Концерты',
  exhibition: 'Выставки',
  excursion: 'Экскурсии',
  festival: 'Фестивали',
  theatre: 'Театр',
  cinema: 'Кино',
  kids: 'Детям',
  lecture: 'Лекции',
  sport: 'Спорт',
  religious: 'Религия',
  other: 'Другое',
};

const TZ = 'Europe/Moscow';
const MSK_OFFSET_MS = 3 * 3600_000;
const DAY_MS = 24 * 3600_000;

const dayFmt = new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, day: 'numeric', month: 'long' });
const dayYearFmt = new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const dayKey = (d: Date) => new Date(d.getTime() + MSK_OFFSET_MS).toISOString().slice(0, 10);
const hasTime = (d: Date) => timeFmt.format(d) !== '00:00';

/** "12 июня, 19:00", "30–31 июля", "19 июня – 8 ноября 2026" */
export function formatWhen(startsAt: string, endsAt?: string | null): string {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const sameDay = !end || dayKey(start) === dayKey(end);
  if (sameDay) {
    return `${dayYearFmt.format(start)}${hasTime(start) ? `, ${timeFmt.format(start)}` : ''}`;
  }
  const sameYear = dayKey(start).slice(0, 4) === dayKey(end).slice(0, 4);
  return `${sameYear ? dayFmt.format(start) : dayYearFmt.format(start)} – ${dayYearFmt.format(end)}`;
}

export function formatPrice(e: { isFree: boolean | null; priceFrom: number | null; priceTo: number | null }): string | null {
  if (e.isFree) return 'Бесплатно';
  if (e.priceFrom == null) return null;
  if (e.priceTo != null && e.priceTo !== e.priceFrom) return `${e.priceFrom}–${e.priceTo} ₽`;
  return `от ${e.priceFrom} ₽`;
}

export const WHEN_OPTIONS = [
  { key: 'all', label: 'Все' },
  { key: 'today', label: 'Сегодня' },
  { key: 'weekend', label: 'Выходные' },
  { key: 'week', label: 'Неделя' },
] as const;
export type When = (typeof WHEN_OPTIONS)[number]['key'];

/** Moscow-day boundaries for the quick date filters, as ISO instants. */
export function whenRange(when: string, now = new Date()): { from?: string; to?: string } {
  const msk = new Date(now.getTime() + MSK_OFFSET_MS);
  const today = Date.UTC(msk.getUTCFullYear(), msk.getUTCMonth(), msk.getUTCDate()) - MSK_OFFSET_MS;
  const iso = (ms: number) => new Date(ms).toISOString();
  const dow = (msk.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  if (when === 'today') return { from: iso(today), to: iso(today + DAY_MS) };
  if (when === 'week') return { from: iso(today), to: iso(today + 7 * DAY_MS) };
  if (when === 'weekend') {
    const saturday = dow >= 5 ? today - (dow - 5) * DAY_MS : today + (5 - dow) * DAY_MS;
    return { from: iso(Math.max(saturday, today)), to: iso(saturday + 2 * DAY_MS) };
  }
  return {};
}
