import type { PublicEvent } from './api';

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// RFC 5545: lines are folded at 75 octets; fold by characters, which is safe for the ASCII-heavy structure
const fold = (line: string) => (line.match(/.{1,70}/gu) ?? ['']).join('\r\n ');

export function buildIcs(event: PublicEvent, url: string): string {
  const start = new Date(event.startsAt);
  const midnightMsk = new Date(start.getTime() + 3 * 3600_000).toISOString().slice(11, 16) === '00:00';
  const end = event.endsAt ? new Date(event.endsAt) : null;
  const dateOnly = (d: Date) => new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 10).replace(/-/g, '');
  const next = (d: Date) => new Date(d.getTime() + 24 * 3600_000);

  const when = midnightMsk
    ? [`DTSTART;VALUE=DATE:${dateOnly(start)}`, `DTEND;VALUE=DATE:${dateOnly(next(end ?? start))}`]
    : [`DTSTART:${stamp(start)}`, `DTEND:${stamp(end ?? new Date(start.getTime() + 2 * 3600_000))}`];

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//v-pereslavle//afisha//RU',
    'BEGIN:VEVENT',
    `UID:${event.id}@v-pereslavle`,
    `DTSTAMP:${stamp(new Date(event.updatedAt))}`,
    ...when,
    `SUMMARY:${esc(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${esc(event.description)}`] : []),
    ...(event.location || event.locationText ? [`LOCATION:${esc([event.location?.name ?? event.locationText, event.location?.address].filter(Boolean).join(', '))}`] : []),
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
