const MONTHS: Record<string, number> = {
  январ: 1, феврал: 2, март: 3, апрел: 4, ма: 5, июн: 6,
  июл: 7, август: 8, сентябр: 9, октябр: 10, ноябр: 11, декабр: 12,
};

function monthOf(word: string): number | undefined {
  const w = word.toLowerCase();
  for (const [stem, n] of Object.entries(MONTHS)) {
    // "ма" must match "мая"/"май" exactly, not "март"
    if (stem === 'ма' ? /^ма[йя]$/.test(w) : w.startsWith(stem)) return n;
  }
  return undefined;
}

/** Midnight Moscow time (UTC+3, no DST) as an absolute instant. */
function msk(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, -3));
}

function endOfMonthDay(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Parses coarse Russian date strings from the calendar:
 * "31 июля 2027", "30-31 июля 2027", "31 июля - 2 августа 2026",
 * "Январь 2027", "май-июнь 2027". Month-only values start on the 1st.
 */
export function parseRuDateRange(raw: string): { startsAt: Date; endsAt?: Date } | null {
  const text = raw.replace(/ /g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const year = /(\d{4})\s*(?:г\.?)?\s*$/.exec(text)?.[1];
  if (!year) return null;
  const y = Number(year);
  const body = text.slice(0, text.lastIndexOf(year)).replace(/\s*г\.?\s*$/, '').trim();

  // "31 июля - 2 августа"
  let m = /^(\d{1,2})\s+([а-я]+)\s*[-–—]\s*(\d{1,2})\s+([а-я]+)$/.exec(body);
  if (m) {
    const [m1, m2] = [monthOf(m[2]), monthOf(m[4])];
    if (!m1 || !m2) return null;
    return { startsAt: msk(y, m1, +m[1]), endsAt: msk(y, m2, +m[3]) };
  }
  // "30-31 июля"
  m = /^(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([а-я]+)$/.exec(body);
  if (m) {
    const mo = monthOf(m[3]);
    return mo ? { startsAt: msk(y, mo, +m[1]), endsAt: msk(y, mo, +m[2]) } : null;
  }
  // "31 июля"
  m = /^(\d{1,2})\s+([а-я]+)$/.exec(body);
  if (m) {
    const mo = monthOf(m[2]);
    return mo ? { startsAt: msk(y, mo, +m[1]) } : null;
  }
  // "май-июнь"
  m = /^([а-я]+)\s*[-–—]\s*([а-я]+)$/.exec(body);
  if (m) {
    const [m1, m2] = [monthOf(m[1]), monthOf(m[2])];
    if (!m1 || !m2) return null;
    return { startsAt: msk(y, m1, 1), endsAt: msk(y, m2, endOfMonthDay(y, m2)) };
  }
  // "Январь"
  m = /^([а-я]+)$/.exec(body);
  if (m) {
    const mo = monthOf(m[1]);
    return mo ? { startsAt: msk(y, mo, 1) } : null;
  }
  return null;
}

/**
 * Parses "19.06.26 9:00 - 08.11.26 9:00" (or a single "19.06.26 9:00" / "19.06.2026"),
 * times are Moscow. Returns null when no start date is found.
 */
export function parseDottedDateRange(raw: string): { startsAt: Date; endsAt?: Date } | null {
  const re = /(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})(?:\s+(\d{1,2}):(\d{2}))?/g;
  const dates = [...raw.matchAll(re)].map((m) => {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(Date.UTC(year, Number(m[2]) - 1, Number(m[1]), Number(m[4] ?? 0) - 3, Number(m[5] ?? 0)));
  });
  if (dates.length === 0) return null;
  return dates.length > 1 ? { startsAt: dates[0], endsAt: dates[1] } : { startsAt: dates[0] };
}
